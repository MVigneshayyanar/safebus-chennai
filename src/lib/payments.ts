/**
 * Payment integration with Razorpay test mode.
 * Falls back to mock mode when Razorpay keys are absent.
 */

import { randomBytes } from 'crypto';
import { createHmac } from 'crypto';

const isRazorpayConfigured = () => {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'MOCK';
  keyId?: string;
}

export interface PaymentVerification {
  valid: boolean;
  orderId: string;
  paymentId: string;
}

/**
 * Create a payment order
 */
export async function createOrder(params: {
  amount: number;
  currency?: string;
  receipt?: string;
  payeeMerchantId?: string;
}): Promise<OrderResult> {
  const { amount, currency = 'INR', receipt } = params;

  if (isRazorpayConfigured()) {
    // Real Razorpay test mode
    const Razorpay = (await import('razorpay')).default;
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    return {
      orderId: order.id,
      amount,
      currency,
      provider: 'RAZORPAY',
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  // Mock mode
  const mockOrderId = `mock_order_${randomBytes(8).toString('hex')}`;
  return {
    orderId: mockOrderId,
    amount,
    currency,
    provider: 'MOCK',
  };
}

/**
 * Verify payment signature (Razorpay webhook or mock)
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): PaymentVerification {
  const { orderId, paymentId, signature } = params;

  if (isRazorpayConfigured()) {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    return {
      valid: expectedSignature === signature,
      orderId,
      paymentId,
    };
  }

  // Mock mode - always valid for mock orders
  return {
    valid: orderId.startsWith('mock_order_'),
    orderId,
    paymentId,
  };
}

/**
 * Process a mock payment (simulates immediate success)
 */
export async function processMockPayment(orderId: string): Promise<{
  paymentId: string;
  signature: string;
  status: 'PAID';
}> {
  await new Promise(r => setTimeout(r, 300));
  
  const paymentId = `mock_pay_${randomBytes(8).toString('hex')}`;
  const signature = createHmac('sha256', 'mock_secret')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return {
    paymentId,
    signature,
    status: 'PAID',
  };
}

/**
 * Verify payee matches a registered operator
 */
export function verifyPayee(params: {
  upiVpa?: string;
  merchantId?: string;
  registeredUpiVpa?: string;
  registeredMerchantId?: string;
}): { match: boolean; status: 'MATCH' | 'MISMATCH' | 'UNKNOWN' } {
  const { upiVpa, merchantId, registeredUpiVpa, registeredMerchantId } = params;

  if (!upiVpa && !merchantId) return { match: false, status: 'UNKNOWN' };
  
  if (upiVpa && registeredUpiVpa) {
    return {
      match: upiVpa.toLowerCase() === registeredUpiVpa.toLowerCase(),
      status: upiVpa.toLowerCase() === registeredUpiVpa.toLowerCase() ? 'MATCH' : 'MISMATCH',
    };
  }
  
  if (merchantId && registeredMerchantId) {
    return {
      match: merchantId === registeredMerchantId,
      status: merchantId === registeredMerchantId ? 'MATCH' : 'MISMATCH',
    };
  }

  return { match: false, status: 'UNKNOWN' };
}
