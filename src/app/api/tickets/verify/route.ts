import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { extractKidFromJWS, verifyTicketSignature } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jws } = body;
    
    if (!jws || typeof jws !== 'string') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'JWS token required' } }, { status: 400 });
    }

    const kid = extractKidFromJWS(jws);
    if (!kid) {
      return NextResponse.json({
        data: { verdict: 'INVALID', reasons: ['Could not extract key ID from token'], ticket: null, operator: null },
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
