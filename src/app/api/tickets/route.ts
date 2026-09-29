import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { signTicket, decryptPrivateKey, hashPassengerInfo } from '@/lib/crypto';
import QRCode from 'qrcode';

// Issue ticket
const issueSchema = z.object({
  operatorId: z.string(),
  routeId: z.string(),
  vehicleId: z.string().optional(),
  travelDateTime: z.string(),
  seat: z.string(),
  passengerPhone: z.string(),
  fare: z.number().positive(),
  paymentOrderId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const tickets = await prisma.ticket.findMany({
      where,
      take: limit,
      orderBy: { issuedAt: 'desc' },
      include: {
        operator: { select: { name: true, publicId: true, status: true, trustScore: true } },
        route: { select: { fromCity: true, toCity: true, baseFare: true, fareCapMultiplier: true } },
        vehicle: { select: { registrationNumber: true, type: true } },
      },
    });

    // Generate QR codes for the first few tickets for rapid demo UI display
    const ticketsWithQr = await Promise.all(
      tickets.map(async (t) => {
        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(t.jws, { width: 240, margin: 1 });
        } catch {}
        return {
          ...t,
          qrDataUrl,
        };
      })
    );

    return NextResponse.json({
      data: ticketsWithQr,
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    const body = await req.json();

    // Handle different ticket actions based on the request body
    if (body._action === 'verify') {
      return handleVerify(body);
    }
    if (body._action === 'board') {
      return handleBoard(body);
    }
    
    // Default: issue
    return handleIssue(body);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.issues } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

async function handleIssue(body: any) {
  const data = issueSchema.parse(body);

  // Check operator
  const operator = await prisma.operator.findFirst({
    where: { OR: [{ id: data.operatorId }, { publicId: data.operatorId }] },
    include: { keys: { where: { status: 'ACTIVE' }, take: 1 } },
  });
  if (!operator) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Operator not found' } }, { status: 404 });
  if (operator.status !== 'VERIFIED') return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Operator is not verified' } }, { status: 403 });
  if (!operator.keys.length) return NextResponse.json({ error: { code: 'NO_KEY', message: 'Operator has no active signing key' } }, { status: 400 });

  // Check payment
  const payment = await prisma.payment.findUnique({ where: { orderId: data.paymentOrderId } });
  if (!payment) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Payment not found' } }, { status: 404 });
  if (payment.status !== 'PAID') return NextResponse.json({ error: { code: 'PAYMENT_REQUIRED', message: 'Payment must be completed before ticket issuance' } }, { status: 402 });

  // Check route
  const route = await prisma.route.findUnique({ where: { id: data.routeId } });
  if (!route) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, { status: 404 });

  const key = operator.keys[0];
  const privateKeyPem = decryptPrivateKey(key.privateKeyEncrypted);
  const passengerHash = hashPassengerInfo(data.passengerPhone);
  const ticketNumber = `SB-${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  const payload = {
    tid: ticketNumber,
    oid: operator.publicId,
    kid: key.kid,
    route: `${route.fromCity}-${route.toCity}`,
    dt: data.travelDateTime,
    seat: data.seat,
    ph: passengerHash,
    fare: data.fare,
  };

  const jws = await signTicket(payload, privateKeyPem, key.kid);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      operatorId: operator.id,
      routeId: data.routeId,
      vehicleId: data.vehicleId || null,
      travelDateTime: new Date(data.travelDateTime),
      seat: data.seat,
      passengerHash,
      fare: data.fare,
      paymentId: payment.id,
      status: 'ISSUED',
      jws,
    },
  });

  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(jws, { width: 300, margin: 2 });

  return NextResponse.json({
    data: {
      ticket: { ...ticket, operator: { publicId: operator.publicId, name: operator.name } },
      jws,
      qr: qrDataUrl,
    },
  }, { status: 201 });
}

async function handleVerify(body: any) {
  const { jws } = body;
  if (!jws || typeof jws !== 'string') {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'JWS token required' } }, { status: 400 });
  }

  const { extractKidFromJWS, verifyTicketSignature } = await import('@/lib/crypto');
  
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

  // Verify signature
  const result = await verifyTicketSignature(jws, operatorKey.publicKeyPem);
  if (!result.valid) {
    return NextResponse.json({
      data: { verdict: 'INVALID', reasons: ['Digital signature verification failed - ticket is forged or tampered'], ticket: null, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name } },
    });
  }

  // Check operator status
  if (operatorKey.operator.status === 'SUSPENDED') {
    return NextResponse.json({
      data: { verdict: 'INVALID', reasons: ['Operator is suspended'], ticket: null, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name, status: 'SUSPENDED' } },
    });
  }

  // Check key revocation
  if (operatorKey.status === 'REVOKED') {
    return NextResponse.json({
      data: { verdict: 'REVOKED', reasons: ['Signing key has been revoked'], ticket: null, operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name } },
    });
  }

  // Look up ticket in DB
  const payload = result.payload!;
  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber: payload.tid as string },
    include: { route: true, vehicle: true },
  });

  if (!ticket) {
    return NextResponse.json({
      data: {
        verdict: 'GENUINE',
        reasons: ['Signature verified (ticket not in local database - may be from another region)'],
        ticket: { ticketNumber: payload.tid, route: payload.route, seat: payload.seat, travelDateTime: payload.dt, fare: payload.fare },
        operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name, status: operatorKey.operator.status, trustScore: operatorKey.operator.trustScore },
      },
    });
  }

  // Check ticket status
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

  // Check fare cap
  const route = ticket.route;
  if (route && ticket.fare > route.baseFare * route.fareCapMultiplier) {
    const reasons = ['Signature verified', `Warning: Fare ₹${ticket.fare} exceeds cap of ₹${route.baseFare * route.fareCapMultiplier} for this route`];
    return NextResponse.json({
      data: {
        verdict: 'GENUINE',
        reasons,
        ticket: { ticketNumber: ticket.ticketNumber, route: `${route.fromCity} → ${route.toCity}`, seat: ticket.seat, travelDateTime: ticket.travelDateTime, fare: ticket.fare, status: ticket.status },
        operator: { publicId: operatorKey.operator.publicId, name: operatorKey.operator.name, status: operatorKey.operator.status, trustScore: operatorKey.operator.trustScore },
      },
    });
  }

  return NextResponse.json({
    data: {
      verdict: 'GENUINE',
      reasons: ['Digital signature verified', 'Operator is verified', 'Ticket is valid'],
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
}

async function handleBoard(body: any) {
  const { jws, ticketNumber } = body;
  
  let tn = ticketNumber;
  if (!tn && jws) {
    const { extractKidFromJWS, verifyTicketSignature } = await import('@/lib/crypto');
    const kid = extractKidFromJWS(jws);
    if (kid) {
      const key = await prisma.operatorKey.findUnique({ where: { kid } });
      if (key) {
        const result = await verifyTicketSignature(jws, key.publicKeyPem);
        if (result.valid && result.payload) {
          tn = result.payload.tid;
        }
      }
    }
  }

  if (!tn) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Ticket number or valid JWS required' } }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { ticketNumber: tn }, include: { operator: true, route: true } });
  if (!ticket) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 });
  }

  if (ticket.status === 'BOARDED') {
    // Create duplicate scan alert
    await prisma.scalpingAlert.create({
      data: {
        kind: 'DUPLICATE_SCAN',
        severity: 'HIGH',
        details: JSON.stringify({ ticketNumber: tn, firstBoardedAt: ticket.boardedAt, secondScanAt: new Date().toISOString() }),
        routeId: ticket.routeId,
        operatorId: ticket.operatorId,
      },
    });
    return NextResponse.json({
      data: { verdict: 'ALREADY_USED', reasons: ['Ticket already boarded - duplicate scan alert created'], ticket: { ticketNumber: tn, boardedAt: ticket.boardedAt } },
    });
  }

  if (ticket.status !== 'ISSUED') {
    return NextResponse.json({
      data: { verdict: 'INVALID', reasons: [`Ticket status is ${ticket.status}, cannot board`], ticket: { ticketNumber: tn, status: ticket.status } },
    });
  }

  const updated = await prisma.ticket.update({
    where: { ticketNumber: tn },
    data: { status: 'BOARDED', boardedAt: new Date() },
  });

  return NextResponse.json({
    data: {
      verdict: 'GENUINE',
      reasons: ['Boarding confirmed'],
      ticket: {
        ticketNumber: updated.ticketNumber,
        route: ticket.route ? `${ticket.route.fromCity} → ${ticket.route.toCity}` : 'Unknown',
        seat: updated.seat,
        status: updated.status,
        boardedAt: updated.boardedAt,
      },
    },
  });
}
