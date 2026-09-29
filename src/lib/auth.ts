import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import prisma from './db';
import { compareSync } from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'safebus-dev-jwt-secret');

export interface SessionUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'OFFICER';
  name: string | null;
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'OFFICER',
      name: payload.name as string | null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<SessionUser | null> {
  try {
    let token: string | undefined;
    
    if (req) {
      token = req.cookies.get('safebus_session')?.value;
      if (!token) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      }
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get('safebus_session')?.value;
    }
    
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

export async function authenticateAdmin(req: NextRequest): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const user = await getSessionUser(req);
  if (!user) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 }) };
  }
  if (user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 }) };
  }
  return { user };
}

export async function authenticateOfficer(req: NextRequest): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const user = await getSessionUser(req);
  if (!user) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 }) };
  }
  return { user };
}

export async function authenticateApiKey(req: NextRequest): Promise<{ client: any } | { error: NextResponse }> {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'API key required (x-api-key header)' } }, { status: 401 }) };
  }

  const clients = await prisma.apiClient.findMany();
  const matchedClient = clients.find(c => compareSync(apiKey, c.apiKeyHash));
  
  if (!matchedClient) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } }, { status: 401 }) };
  }

  return { client: matchedClient };
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number = 60, windowMs: number = 60000): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  
  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         '127.0.0.1';
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
    { status: 429 }
  );
}
