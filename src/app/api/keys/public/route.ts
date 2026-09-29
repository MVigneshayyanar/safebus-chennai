import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateJWKS } from '@/lib/crypto';

export async function GET() {
  try {
    const keys = await prisma.operatorKey.findMany({
      where: { status: 'ACTIVE' },
      select: { kid: true, publicKeyPem: true, operatorId: true },
    });

    const jwks = await generateJWKS(keys);
    
    return NextResponse.json(jwks, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch keys' } },
      { status: 500 }
    );
  }
}
