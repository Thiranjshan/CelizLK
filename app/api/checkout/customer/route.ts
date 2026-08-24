import { NextResponse } from 'next/server';
import { createAccessToken, hashPassword, issueRefreshToken, publicUser, refreshCookie, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const emailPattern = /^\S+@\S+\.\S+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');
    if (!emailPattern.test(email) || email.length > 160 || phone.length > 30) return NextResponse.json({ error: 'Please provide valid customer details.' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.lockUntil && existing.lockUntil > new Date()) return NextResponse.json({ error: 'Incorrect password. Please try again or reset your password.' }, { status: 401 });
      if (!password || !existing.passwordHash || !(await verifyPassword(password, existing.passwordHash))) return NextResponse.json({ error: 'Incorrect password. Please try again or reset your password.' }, { status: 401 });
      const updated = await prisma.user.update({ where: { id: existing.id }, data: { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date(), ...(phone ? { phone } : {}) } });
      const response = NextResponse.json({ user: publicUser(updated), accessToken: await createAccessToken(updated), existing: true });
      response.cookies.set(refreshCookie(await issueRefreshToken(updated.id, request)));
      return response;
    }

    if (fullName.length < 2 || fullName.length > 100 || password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Name and password of at least 8 characters are required.' }, { status: 400 });
    const user = await prisma.user.create({ data: { fullName, email, phone: phone || null, passwordHash: await hashPassword(password) } });
    const response = NextResponse.json({ user: publicUser(user), accessToken: await createAccessToken(user), existing: false }, { status: 201 });
    response.cookies.set(refreshCookie(await issueRefreshToken(user.id, request)));
    return response;
  } catch (error) {
    console.error('Checkout customer authentication error:', error);
    return NextResponse.json({ error: 'Unable to continue checkout.' }, { status: 500 });
  }
}