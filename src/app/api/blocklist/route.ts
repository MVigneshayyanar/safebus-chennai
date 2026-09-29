import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const [blockedDomains, blockedPhones, blockedUpis] = await Promise.all([
      prisma.entity.findMany({ where: { kind: 'DOMAIN', blocklisted: true }, select: { value: true } }),
      prisma.entity.findMany({ where: { kind: 'PHONE', blocklisted: true }, select: { value: true } }),
      prisma.entity.findMany({ where: { kind: 'UPI', blocklisted: true }, select: { value: true } }),
    ]);

    // Also include FRAUD domains from domain table
    const fraudDomains = await prisma.domain.findMany({
      where: { verdict: 'FRAUD' },
      select: { host: true },
    });

    return NextResponse.json({
      data: {
        domains: [...new Set([...blockedDomains.map(d => d.value), ...fraudDomains.map(d => d.host)])],
        phones: blockedPhones.map(p => p.value),
        upis: blockedUpis.map(u => u.value),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
