import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { scoreDomain, ALLOWLIST } from '@/lib/risk';

export async function GET(req: NextRequest) {
  try {
    const d = req.nextUrl.searchParams.get('d');
    if (!d) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Domain parameter (d) required' } }, { status: 400 });
    }

    // Normalize input (could be URL, host, punycode)
    let host: string;
    try {
      if (d.includes('://')) {
        host = new URL(d).hostname;
      } else if (d.includes('/')) {
        host = new URL(`https://${d}`).hostname;
      } else {
        host = d.toLowerCase().trim();
      }
    } catch {
      host = d.toLowerCase().trim().replace(/[^a-z0-9.-]/g, '');
    }

    // Check database first
    let existingDomain = await prisma.domain.findUnique({ where: { host } });

    // Check if domain is in official allowlist
    const isAllowlisted = ALLOWLIST.some(a => a.replace(/^www\./, '') === host.replace(/^www\./, ''));

    // Check if any operator matches
    const operatorMatch = await prisma.operator.findFirst({
      where: {
        OR: [
          { registeredUpiVpa: { contains: host.split('.')[0] } },
          { name: { contains: host.split('.')[0] } },
        ],
        status: 'VERIFIED',
      },
    });

    // If existing in DB and allowlisted or verified, or if score was already computed properly (> 0)
    if (existingDomain && (isAllowlisted || existingDomain.riskScore > 30)) {
      const reasons = JSON.parse(existingDomain.reasons);
      
      let lookalikeOf: string | undefined;
      for (const r of reasons) {
        if (r.signal === 'lookalike' && r.description) {
          const match = r.description.match(/imitates?\s+"?([^"]+)"?/i);
          if (match) lookalikeOf = match[1];
        }
      }

      return NextResponse.json({
        data: {
          host,
          verdict: existingDomain.verdict,
          riskScore: existingDomain.riskScore,
          reasons,
          operatorMatch: operatorMatch ? { publicId: operatorMatch.publicId, name: operatorMatch.name } : null,
          lookalikeOf,
          whoisAgeDays: existingDomain.whoisAgeDays,
          tlsIssuer: existingDomain.tlsIssuer,
          firstSeen: existingDomain.firstSeen,
          lastChecked: existingDomain.lastChecked,
        },
      });
    }

    // Domain not in database - perform live scoring
    // Check shared entities
    const sharedEntities = await prisma.entity.findMany({
      where: { kind: 'DOMAIN', value: { contains: host.split('.')[0] }, blocklisted: true },
    });

    const riskResult = scoreDomain({
      host,
      whoisAgeDays: null, // Would do live WHOIS in production
      tlsIssuer: null,
      tlsAgeDays: null,
      sharedEntities: {
        domains: sharedEntities.map(e => e.value),
      },
    });

    // Store or update the result
    await prisma.domain.upsert({
      where: { host },
      update: {
        verdict: riskResult.verdict,
        riskScore: riskResult.score,
        reasons: JSON.stringify(riskResult.reasons),
        lastChecked: new Date(),
      },
      create: {
        host,
        verdict: riskResult.verdict,
        riskScore: riskResult.score,
        reasons: JSON.stringify(riskResult.reasons),
        source: 'SEARCH',
      },
    }).catch(() => {});

    return NextResponse.json({
      data: {
        host,
        verdict: riskResult.verdict,
        riskScore: riskResult.score,
        reasons: riskResult.reasons,
        operatorMatch: null,
        lookalikeOf: riskResult.lookalikeOf,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
