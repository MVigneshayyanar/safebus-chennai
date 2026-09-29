import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      version: '1.0.0',
      service: 'SafeBus Chennai API',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      version: '1.0.0',
      service: 'SafeBus Chennai API',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
