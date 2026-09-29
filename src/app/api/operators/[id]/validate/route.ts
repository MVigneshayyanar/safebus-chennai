import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkPermit, checkGST, checkPAN, checkVahan } from '@/lib/mock-gov';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const operator = await prisma.operator.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: { vehicles: true },
    });

    if (!operator) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Operator not found' } }, { status: 404 });
    }

    const results: any = { permit: null, gst: null, pan: null, vehicles: [] };

    // Validate permit
    results.permit = await checkPermit(operator.permitNumber);

    // Validate GST
    if (operator.gstin) {
      results.gst = await checkGST(operator.gstin);
    }

    // Validate PAN
    if (operator.pan) {
      results.pan = await checkPAN(operator.pan);
    }

    // Validate vehicles
    for (const v of operator.vehicles) {
      results.vehicles.push(await checkVahan(v.registrationNumber));
    }

    // Determine new status
    let newStatus = operator.status;
    let newTrustScore = operator.trustScore;

    if (results.permit.valid && (!operator.gstin || results.gst?.valid)) {
      if (new Date(operator.permitExpiry) > new Date()) {
        newStatus = 'VERIFIED';
        newTrustScore = Math.min(100, operator.trustScore + 10);
      } else {
        newStatus = 'SUSPENDED';
        newTrustScore = Math.max(0, operator.trustScore - 20);
      }
    } else if (!results.permit.valid) {
      newStatus = 'REJECTED';
      newTrustScore = Math.max(0, operator.trustScore - 30);
    }

    const updated = await prisma.operator.update({
      where: { id: operator.id },
      data: { status: newStatus, trustScore: newTrustScore },
    });

    await prisma.auditLog.create({
      data: {
        actor: 'system',
        action: 'OPERATOR_VALIDATED',
        entity: 'Operator',
        entityId: operator.publicId,
        meta: JSON.stringify({ results, previousStatus: operator.status, newStatus }),
      },
    });

    return NextResponse.json({ data: { operator: { ...updated, hubs: JSON.parse(updated.hubs) }, validationResults: results } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
