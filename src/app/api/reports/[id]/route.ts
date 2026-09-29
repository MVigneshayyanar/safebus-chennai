import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateOfficer } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: { route: true },
    });

    if (!report) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Report not found' } }, { status: 404 });
    }

    // Find related entities
    const entities = [];
    if (report.phone) {
      const entity = await prisma.entity.findFirst({ where: { kind: 'PHONE', value: report.phone } });
      if (entity) entities.push(entity);
    }
    if (report.upiId) {
      const entity = await prisma.entity.findFirst({ where: { kind: 'UPI', value: report.upiId } });
      if (entity) entities.push(entity);
    }

    // Find cluster reports
    let clusterReports: any[] = [];
    if (report.clusterId) {
      clusterReports = await prisma.report.findMany({
        where: { clusterId: report.clusterId, id: { not: report.id } },
        take: 10,
      });
    }

    return NextResponse.json({
      data: { report, entities, clusterReports },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateOfficer(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['NEW', 'IN_REVIEW', 'CONFIRMED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        actor: auth.user.email,
        action: `REPORT_${status}`,
        entity: 'Report',
        entityId: id,
        meta: JSON.stringify({ type: report.type }),
      },
    });

    return NextResponse.json({ data: report });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
