import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ data: { message: 'Logged out' } });
  response.cookies.set('safebus_session', '', { maxAge: 0, path: '/' });
  return response;
}
