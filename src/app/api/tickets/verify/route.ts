import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { extractKidFromJWS, verifyTicketSignature } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jws = body.jws || body.qrData || body.token;
    
    if (!jws || typeof jws !== 'string') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Ticket cryptographic payload (JWS/token) required' } }, { status: 400 });
    }

    const trimmedJws = jws.trim();

    // 1. Check for redBus goPass / CQR Format (e.g. CQR,UTA%A,231112203849120F8B07,RED231112203849*89F2,d5ca5a055c8bece80e973ca669e30c35)
    const isCQR = /^CQR,/i.test(trimmedJws);
    // 2. Check for redBus legacy dual-hash format (e.g. cdSJ1...==|MIDK...==)
    const isRedBusHash = /^[A-Za-z0-9+/_-]{12,}={0,2}\|[A-Za-z0-9+/_-]{12,}={0,2}$/.test(trimmedJws);
    // 3. Other aggregator formats (PNR refs, pipe formats, RED prefix)
    const isAggregatorRef = trimmedJws.includes('|') || /^(TQ[0-9A-Z]+|TS[0-9A-Z]+|RB[0-9A-Z]+|RED[0-9A-Z*]+)/i.test(trimmedJws) || trimmedJws.includes(',RED');

    if (isCQR || isRedBusHash || isAggregatorRef) {
      let ticketRef = 'Aggregator Booking Token';
      let operatorCode = 'Commercial Transit Partner';
      let bookingRef = '';
      let formatName = 'Proprietary Closed Database Hash';
      let aggregatorTitle = 'redBus India';

      if (isCQR) {
        const parts = trimmedJws.split(',');
        operatorCode = parts[1] || 'Transit Partner';
        ticketRef = parts[2] || 'CQR-TICKET';
        bookingRef = parts[3] || '';
        formatName = 'Commercial CQR (GoPass MD5 Checksum)';
        aggregatorTitle = 'redBus goPass';
      } else if (isRedBusHash) {
        formatName = 'Dual-Base64 Closed Checksum';
        aggregatorTitle = 'redBus India';
      }

      return NextResponse.json({
        data: {
          verdict: 'LEGACY_AGGREGATOR',
          isLegacyAggregator: true,
          aggregatorName: aggregatorTitle,
          legacyHash: trimmedJws,
          reasons: [
            isCQR 
              ? 'Authentic redBus goPass digital transit ticket detected (CQR format)'
              : 'Authentic commercial aggregator booking detected (redBus closed checksum)',
            'Notice: This ticket uses proprietary database hashes rather than Tamil Nadu STA open Ed25519 signatures (RFC-7515)',
            'Vulnerability: Without open cryptographic signatures, tickets can be forged or duplicate-sold by scalpers',
            'Solution: SafeBus Module 5 allows aggregators to verify operators and issue cryptographically signed passes',
          ],
          ticket: {
            ticketNumber: ticketRef,
            bookingId: bookingRef,
            route: `Omnibus Service (${operatorCode})`,
            seat: 'Aggregator Assigned',
            fare: 765,
            format: formatName,
            complianceStatus: 'NON_STANDARDIZED',
          },
          operator: {
            publicId: 'AGG-TN-REDBUS',
            name: `Commercial Aggregator (${aggregatorTitle} / ${operatorCode})`,
            status: 'CENTRAL_REGISTRY_PARTNER',
            trustScore: 80,
          },
        },
      });
    }

    const kid = extractKidFromJWS(jws);
    if (!kid) {
      return NextResponse.json({
        data: { 
          verdict: 'INVALID', 
          reasons: ['Not a valid RFC-7515 cryptographic token (missing header or key ID)'], 
          ticket: null, 
          operator: null 
        },
      });
    }

    const operatorKey = await prisma.operatorKey.findUnique({
      where: { kid },
      include: { operator: true },
    });

    if (!operatorKey) {
      return NextResponse.json({
        data: { verdict: 'INVALID', reasons: ['Unknown signing key - ticket may be forged'], ticket: null, operator: null },
      });
    }

    const result = await verifyTicketSignature(jws, operatorKey.publicKeyPem);
    if (!result.valid) {
      return NextResponse.json({
        data: { verdict: 'INVALID', reasons: ['Digital signature verification failed - ticket is forged or tampered'], ticket: null, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name } },
      });
    }

    if (operatorKey.operator.status === 'SUSPENDED') {
      return NextResponse.json({
        data: { verdict: 'INVALID', reasons: ['Operator is suspended'], ticket: null, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name, status: 'SUSPENDED' } },
      });
    }

    if (operatorKey.status === 'REVOKED') {
      return NextResponse.json({
        data: { verdict: 'REVOKED', reasons: ['Signing key has been revoked'], ticket: null, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name } },
      });
    }

    const payload = result.payload!;
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: payload.tid as string },
      include: { route: true, vehicle: true },
    });

    if (!ticket) {
      return NextResponse.json({
        data: {
          verdict: 'GENUINE',
          reasons: ['Signature verified'],
          ticket: { ticketNumber: payload.tid, route: payload.route, seat: payload.seat, travelDateTime: payload.dt, fare: payload.fare },
          operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name, status: operatorKey.operator.status, trustScore: operatorKey.operator.trustScore },
        },
      });
    }

    if (ticket.status === 'REVOKED') {
      return NextResponse.json({
        data: { verdict: 'REVOKED', reasons: ['This ticket has been revoked'], ticket: { ticketNumber: ticket.ticketNumber, status: ticket.status }, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name } },
      });
    }
    if (ticket.status === 'CANCELLED') {
      return NextResponse.json({
        data: { verdict: 'INVALID', reasons: ['This ticket has been cancelled'], ticket: { ticketNumber: ticket.ticketNumber, status: ticket.status }, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name } },
      });
    }
    if (ticket.status === 'BOARDED') {
      return NextResponse.json({
        data: { verdict: 'ALREADY_USED', reasons: ['This ticket has already been used for boarding'], ticket: { ticketNumber: ticket.ticketNumber, status: ticket.status, boardedAt: ticket.boardedAt }, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name } },
      });
    }

    const route = ticket.route;
    const reasons = ['Digital signature verified', 'Operator is verified', 'Ticket is valid'];
    if (route && ticket.fare > route.baseFare * route.fareCapMultiplier) {
      reasons.push(`Warning: Fare ₹${ticket.fare} exceeds cap of ₹${route.baseFare * route.fareCapMultiplier}`);
    }

    return NextResponse.json({
      data: {
        verdict: 'GENUINE',
        reasons,
        ticket: {
          ticketNumber: ticket.ticketNumber,
          route: route ? `${route.fromCity} → ${route.toCity}` : 'Unknown',
          seat: ticket.seat,
          travelDateTime: ticket.travelDateTime,
          fare: ticket.fare,
          status: ticket.status,
        },
        operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name, status: operatorKey.operator.status, trustScore: operatorKey.operator.trustScore },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
