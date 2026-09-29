import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Build graph data from entities and reports
    const entities = await prisma.entity.findMany({
      where: { clusterId: { not: null } },
    });

    const reports = await prisma.report.findMany({
      where: { clusterId: { not: null } },
      select: { id: true, type: true, phone: true, upiId: true, url: true, clusterId: true, amountLost: true },
    });

    // Build nodes and edges
    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeSet = new Set<string>();

    // Add entity nodes
    for (const entity of entities) {
      const nodeId = `${entity.kind}:${entity.value}`;
      if (!nodeSet.has(nodeId)) {
        nodeSet.add(nodeId);
        nodes.push({
          id: nodeId,
          label: entity.value,
          type: entity.kind.toLowerCase(),
          cluster: entity.clusterId,
          reportCount: entity.reportCount,
          blocklisted: entity.blocklisted,
        });
      }
    }

    // Add report nodes and edges
    for (const report of reports) {
      const reportNodeId = `report:${report.id}`;
      if (!nodeSet.has(reportNodeId)) {
        nodeSet.add(reportNodeId);
        nodes.push({
          id: reportNodeId,
          label: `${report.type} (₹${report.amountLost || 0})`,
          type: 'report',
          cluster: report.clusterId,
        });
      }

      // Connect report to entities
      if (report.phone) {
        const phoneNode = `PHONE:${report.phone}`;
        if (nodeSet.has(phoneNode)) {
          edges.push({ source: reportNodeId, target: phoneNode, type: 'phone' });
        }
      }
      if (report.upiId) {
        const upiNode = `UPI:${report.upiId}`;
        if (nodeSet.has(upiNode)) {
          edges.push({ source: reportNodeId, target: upiNode, type: 'upi' });
        }
      }
      if (report.url) {
        try {
          const host = new URL(report.url.startsWith('http') ? report.url : `https://${report.url}`).hostname;
          const domainNode = `DOMAIN:${host}`;
          if (nodeSet.has(domainNode)) {
            edges.push({ source: reportNodeId, target: domainNode, type: 'domain' });
          }
        } catch {}
      }
    }

    // Get cluster metadata
    const clusterIds = [...new Set(entities.map(e => e.clusterId).filter(Boolean))];
    const clusters = clusterIds.map(id => ({
      id,
      reportCount: reports.filter(r => r.clusterId === id).length,
      entityCount: entities.filter(e => e.clusterId === id).length,
      totalLoss: reports.filter(r => r.clusterId === id).reduce((sum, r) => sum + (r.amountLost || 0), 0),
    }));

    return NextResponse.json({
      data: { nodes, edges, clusters },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
