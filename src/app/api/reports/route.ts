import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { triageReport } from '@/lib/ai';

const reportSchema = z.object({
  type: z.enum(['FAKE_PORTAL', 'FAKE_TICKET', 'SCALPER', 'FAKE_OPERATOR']),
  url: z.string().optional(),
  phone: z.string().optional(),
  upiId: z.string().optional(),
  amountLost: z.number().optional(),
  routeId: z.string().optional(),
  description: z.string().optional(),
  screenshotData: z.string().optional(), // base64
});

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '20'), 50);
    const status = params.status;
    const type = params.type;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { route: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      data: reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = reportSchema.parse(body);

    // Triage the report
    const triage = await triageReport({
      description: data.description || '',
      ocrText: '',
      type: data.type,
    });

    // Create report
    const report = await prisma.report.create({
      data: {
        type: data.type,
        url: data.url,
        phone: data.phone,
        upiId: data.upiId,
        amountLost: data.amountLost,
        routeId: data.routeId || null,
        description: data.description,
        status: 'NEW',
        aiSummary: triage.summary,
      },
    });

    // Create/update entities
    const entities = [];
    if (data.phone) {
      entities.push({ kind: 'PHONE', value: data.phone });
    }
    if (data.upiId) {
      entities.push({ kind: 'UPI', value: data.upiId });
    }
    if (data.url) {
      try {
        const host = new URL(data.url.startsWith('http') ? data.url : `https://${data.url}`).hostname;
        entities.push({ kind: 'DOMAIN', value: host });
      } catch {}
    }

    // Also extract from triage
    for (const phone of triage.extractedEntities.phones) {
      if (phone !== data.phone) entities.push({ kind: 'PHONE', value: phone });
    }
    for (const upi of triage.extractedEntities.upis) {
      if (upi !== data.upiId) entities.push({ kind: 'UPI', value: upi });
    }

    for (const entity of entities) {
      await prisma.entity.upsert({
        where: { kind_value: { kind: entity.kind, value: entity.value } },
        update: { reportCount: { increment: 1 } },
        create: { kind: entity.kind, value: entity.value, reportCount: 1 },
      });
    }

    // Auto-blocklist entities with 3+ reports
    await prisma.entity.updateMany({
      where: { reportCount: { gte: 3 }, blocklisted: false },
      data: { blocklisted: true },
    });

    return NextResponse.json({
      data: {
        report,
        referenceNumber: `RPT-${report.id.slice(0, 8).toUpperCase()}`,
        triage: { severity: triage.severity, extractedEntities: triage.extractedEntities },
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.issues } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
