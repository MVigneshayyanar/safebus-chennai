import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createOrder, processMockPayment, verifyPayee } from '@/lib/payments';
import { z } from 'zod';

const orderSchema = z.object({
  operatorId: z.string(),
  routeId: z.string(),
  amount: z.number().positive(),
  payeeMerchantId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Route to different payment actions
    if (body._action === 'verify-payee') {
      return handleVerifyPayee(body);
    }
    if (body._action === 'webhook') {
      return handleWebhook(body);
    }
    
    // Default: create order
    const data = orderSchema.parse(body);

    // Check operator
    const operator = await prisma.operator.findFirst({
      where: { OR: [{ id: data.operatorId }, { publicId: data.operatorId }] },
    });
    if (!operator) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Operator not found' } }, { status: 404 });
    }
    if (operator.status !== 'VERIFIED') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Operator not verified' } }, { status: 403 });
    }

    // Verify payee matches operator
    if (data.payeeMerchantId && operator.registeredMerchantId) {
      if (data.payeeMerchantId !== operator.registeredMerchantId) {
        return NextResponse.json({ error: { code: 'PAYEE_MISMATCH', message: 'Payment merchant does not match operator registration' } }, { status: 400 });
      }
    }

    const result = await createOrder({
      amount: data.amount,
      payeeMerchantId: operator.registeredMerchantId || undefined,
    });

    // Store payment
    const payment = await prisma.payment.create({
      data: {
        provider: result.provider,
        orderId: result.orderId,
        amount: data.amount,
        payeeMerchantId: operator.registeredMerchantId,
        status: 'CREATED',
      },
    });

    // Auto-complete mock payments
    if (result.provider === 'MOCK') {
      const mockResult = await processMockPayment(result.orderId);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', paymentRefId: mockResult.paymentId },
      });
    }

    return NextResponse.json({
      data: {
        orderId: result.orderId,
        amount: data.amount,
        provider: result.provider,
        keyId: result.keyId,
        paymentId: payment.id,
        status: result.provider === 'MOCK' ? 'PAID' : 'CREATED',
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.issues } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

async function handleVerifyPayee(body: any) {
  const { upiVpa, merchantId, operatorId } = body;
  
  if (!operatorId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'operatorId required' } }, { status: 400 });
  }

  const operator = await prisma.operator.findFirst({
    where: { OR: [{ id: operatorId }, { publicId: operatorId }] },
  });

  if (!operator) {
    return NextResponse.json({ data: { match: false, status: 'UNKNOWN', message: 'Operator not found in registry' } });
  }

  const result = verifyPayee({
    upiVpa,
    merchantId,
    registeredUpiVpa: operator.registeredUpiVpa || undefined,
    registeredMerchantId: operator.registeredMerchantId || undefined,
  });

  return NextResponse.json({
    data: {
      ...result,
      operator: { publicId: operator.publicId, name: operator.name, status: operator.status },
    },
  });
}

async function handleWebhook(body: any) {
  const { orderId, paymentId, signature, status: paymentStatus } = body;

  if (!orderId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orderId required' } }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Order not found' } }, { status: 404 });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { 
      status: paymentStatus === 'PAID' ? 'PAID' : 'FAILED',
      paymentRefId: paymentId,
      rawWebhook: JSON.stringify(body),
    },
  });

  return NextResponse.json({ data: { received: true } });
}
