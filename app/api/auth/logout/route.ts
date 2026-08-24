import { NextRequest, NextResponse } from 'next/server';
import { hashRefreshToken, refreshCookieName } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(refreshCookieName)?.value;
  if (token) await prisma.refreshToken.updateMany({ where: { tokenHash: hashRefreshToken(token) }, data: { revoked: true } });
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: refreshCookieName, value: '', httpOnly: true, expires: new Date(0), path: '/api/auth' });
  return response;
}