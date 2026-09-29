import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '50'), 100);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({
      data: logs.map(l => ({ ...l, meta: l.meta ? JSON.parse(l.meta) : null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
