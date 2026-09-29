import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['VERIFIED', 'PENDING', 'SUSPENDED', 'REJECTED']).optional(),
  hub: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = querySchema.parse(params);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.hub) where.hubs = { contains: query.hub };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { publicId: { contains: query.search } },
        { permitNumber: { contains: query.search } },
      ];
    }

    const [operators, total] = await Promise.all([
      prisma.operator.findMany({
        where,
        include: { vehicles: { select: { id: true, registrationNumber: true, type: true } }, _count: { select: { tickets: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { trustScore: 'desc' },
      }),
      prisma.operator.count({ where }),
    ]);

    return NextResponse.json({
      data: operators.map(op => ({
        ...op,
        hubs: JSON.parse(op.hubs),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: error.issues } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const schema = z.object({
      name: z.string().min(2),
      permitNumber: z.string().regex(/^TN-OMN-\d{4,6}$/i, 'Invalid permit format'),
      permitExpiry: z.string().datetime(),
      gstin: z.string().optional(),
      pan: z.string().optional(),
      contactPhone: z.string().optional(),
      hubs: z.array(z.string()).default([]),
      registeredMerchantId: z.string().optional(),
      registeredUpiVpa: z.string().optional(),
    });

    const data = schema.parse(body);
    const publicId = `OP-TN-${String(await prisma.operator.count() + 1).padStart(4, '0')}`;

    const operator = await prisma.operator.create({
      data: {
        publicId,
        name: data.name,
        permitNumber: data.permitNumber,
        permitExpiry: new Date(data.permitExpiry),
        gstin: data.gstin,
        pan: data.pan,
        contactPhone: data.contactPhone,
        hubs: JSON.stringify(data.hubs),
        registeredMerchantId: data.registeredMerchantId,
        registeredUpiVpa: data.registeredUpiVpa,
        status: 'PENDING',
        trustScore: 30,
      },
    });

    await prisma.auditLog.create({
      data: { actor: 'system', action: 'OPERATOR_ONBOARDED', entity: 'Operator', entityId: operator.publicId, meta: JSON.stringify({ name: operator.name }) },
    });

    return NextResponse.json({ data: { ...operator, hubs: JSON.parse(operator.hubs) } }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.issues } }, { status: 400 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Operator with this permit number already exists' } }, { status: 409 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
