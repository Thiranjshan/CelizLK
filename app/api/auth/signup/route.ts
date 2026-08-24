import { NextResponse } from 'next/server';
import { hashPassword, createAccessToken, issueRefreshToken, publicUser, refreshCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (fullName.length < 2 || fullName.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Please provide a valid name, email, and password of at least 8 characters.' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    const user = await prisma.user.create({ data: { fullName, email, passwordHash: await hashPassword(password) } });
    const accessToken = await createAccessToken(user);
    const response = NextResponse.json({ user: publicUser(user), accessToken }, { status: 201 });
    response.cookies.set(refreshCookie(await issueRefreshToken(user.id, request)));
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 });
  }
}