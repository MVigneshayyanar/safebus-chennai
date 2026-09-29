import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateEd25519KeyPair, encryptPrivateKey, generateKid } from '@/lib/crypto';
import { checkPermit, checkGST, checkVahan } from '@/lib/mock-gov';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const operator = await prisma.operator.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        vehicles: true,
        keys: { where: { status: 'ACTIVE' }, select: { kid: true, createdAt: true } },
        _count: { select: { tickets: true } },
      },
    });

    if (!operator) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Operator not found' } }, { status: 404 });
    }

    return NextResponse.json({
      data: { ...operator, hubs: JSON.parse(operator.hubs) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAdmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['VERIFIED', 'PENDING', 'SUSPENDED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } }, { status: 400 });
    }

    const operator = await prisma.operator.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
    if (!operator) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Operator not found' } }, { status: 404 });
    }

    const updated = await prisma.operator.update({
      where: { id: operator.id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        actor: auth.user.email,
        action: `OPERATOR_${status}`,
        entity: 'Operator',
        entityId: operator.publicId,
        meta: JSON.stringify({ previousStatus: operator.status, newStatus: status }),
      },
    });

    // Fire webhook for suspend/reinstate
    if (status === 'SUSPENDED' || (operator.status === 'SUSPENDED' && status === 'VERIFIED')) {
      const event = status === 'SUSPENDED' ? 'operator.suspended' : 'operator.reinstated';
      const clients = await prisma.apiClient.findMany({ where: { webhookUrl: { not: null } } });
      for (const client of clients) {
        await prisma.webhookDelivery.create({
          data: {
            clientId: client.id,
            event,
            payload: JSON.stringify({ operatorId: operator.publicId, name: operator.name, status }),
            status: 'PENDING',
          },
        });
      }
    }

    return NextResponse.json({ data: { ...updated, hubs: JSON.parse(updated.hubs) } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
