import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { compareSync } from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password required' } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !compareSync(password, user.passwordHash)) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, { status: 401 });
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'OFFICER',
      name: user.name,
    });

    const response = NextResponse.json({
      data: { user: { id: user.id, email: user.email, role: user.role, name: user.name }, token },
    });

    response.cookies.set('safebus_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
