import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '20'), 50);
    const status = params.status;
    const kind = params.kind;

    const where: any = {};
    if (status) where.status = status;
    if (kind) where.kind = kind;

    const [alerts, total] = await Promise.all([
      prisma.scalpingAlert.findMany({
        where,
        include: { route: true, operator: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scalpingAlert.count({ where }),
    ]);

    return NextResponse.json({
      data: alerts.map(a => ({ ...a, details: JSON.parse(a.details) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
