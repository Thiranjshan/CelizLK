import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const stateCookieName = 'google_oauth_state';

function getSafeReturnTo(value: string | null) {
  const candidate = value?.trim() || '/';
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('Google sign-in is not configured.')}`, request.url));
  }

  const state = randomBytes(32).toString('hex');
  const returnTo = getSafeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const statePayload = Buffer.from(JSON.stringify({ state, returnTo })).toString('base64url');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set({
    name: stateCookieName,
    value: statePayload,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 5 * 60,
  });

  return response;
}
