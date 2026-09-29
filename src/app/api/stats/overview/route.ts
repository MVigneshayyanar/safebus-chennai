import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const [
      totalDomains,
      fraudDomains,
      totalReports,
      verifiedOperators,
      openAlerts,
      totalTickets,
      confirmedReports,
      suspiciousDomains,
    ] = await Promise.all([
      prisma.domain.count(),
      prisma.domain.count({ where: { verdict: 'FRAUD' } }),
      prisma.report.count(),
      prisma.operator.count({ where: { status: 'VERIFIED' } }),
      prisma.scalpingAlert.count({ where: { status: 'OPEN' } }),
      prisma.ticket.count(),
      prisma.report.count({ where: { status: 'CONFIRMED' } }),
      prisma.domain.count({ where: { verdict: 'SUSPICIOUS' } }),
    ]);

    return NextResponse.json({
      data: {
        domainsScanned: totalDomains,
        fraudsBlocked: fraudDomains,
        reportsReceived: totalReports,
        verifiedOperators,
        openAlerts,
        totalTickets,
        confirmedReports,
        suspiciousDomains,
        ticketsVerified: totalTickets,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
