import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '20'), 50);
    const verdict = params.verdict;
    const search = params.search;

    const where: any = {};
    if (verdict) where.verdict = verdict;
    if (search) where.host = { contains: search };

    const [domains, total] = await Promise.all([
      prisma.domain.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { riskScore: 'desc' },
      }),
      prisma.domain.count({ where }),
    ]);

    return NextResponse.json({
      data: domains.map(d => ({ ...d, reasons: JSON.parse(d.reasons) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
