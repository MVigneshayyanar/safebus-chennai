import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { scoreDomain } from '@/lib/risk';

const CRAWLER_PROBE_CANDIDATES = [
  { host: 'kcbt-omnibus-booking.site', source: 'CRAWLER_BOT_KCBT', whoisAge: 2 },
  { host: 'kpn-chennai-festivals.co', source: 'CRAWLER_BOT_TYPOSQUAT', whoisAge: 4 },
  { host: 'tambaram-direct-bus.online', source: 'CRAWLER_BOT_TAMBARAM', whoisAge: 1 },
  { host: 'redbus-tamilnadu-offers.net', source: 'CRAWLER_BOT_TYPOSQUAT', whoisAge: 6 },
  { host: 'perungalathur-omni-pass.com', source: 'CRAWLER_BOT_PERUNGALATHUR', whoisAge: 3 },
  { host: 'srs-travels-chennai.xyz', source: 'CRAWLER_BOT_TYPOSQUAT', whoisAge: 5 },
];

export async function POST(req: NextRequest) {
  try {
    const discovered = [];

    for (const candidate of CRAWLER_PROBE_CANDIDATES) {
      const risk = scoreDomain({
        host: candidate.host,
        whoisAgeDays: candidate.whoisAge,
      });

      const upserted = await prisma.domain.upsert({
        where: { host: candidate.host },
        update: {
          riskScore: risk.score,
          verdict: risk.verdict,
          reasons: JSON.stringify(risk.reasons),
          whoisAgeDays: candidate.whoisAge,
          lastChecked: new Date(),
        },
        create: {
          host: candidate.host,
          source: candidate.source,
          riskScore: risk.score,
          verdict: risk.verdict,
          reasons: JSON.stringify(risk.reasons),
          whoisAgeDays: candidate.whoisAge,
          lastChecked: new Date(),
        },
      });

      discovered.push({
        id: upserted.id,
        host: upserted.host,
        riskScore: upserted.riskScore,
        verdict: upserted.verdict,
        source: upserted.source,
        whoisAgeDays: upserted.whoisAgeDays,
        reasons: risk.reasons,
      });
    }

    // Update overall system audit log
    await prisma.auditLog.create({
      data: {
        actor: 'AUTOMATED_CRAWLER_WORKER',
        action: 'CRAWLER_SWEEP_EXECUTED',
        entity: 'DOMAIN',
        meta: JSON.stringify({ domainsProcessed: discovered.length }),
      },
    });

    return NextResponse.json({
      data: {
        scannedCount: discovered.length,
        discovered,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'CRAWLER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
