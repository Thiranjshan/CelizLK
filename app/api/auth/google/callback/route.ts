import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { createAccessToken, issueRefreshToken, refreshCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stateCookieName = 'google_oauth_state';

function getSafeReturnTo(value: string | null) {
  const candidate = value?.trim() || '/';
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
}

function redirectToLogin(request: NextRequest, message: string) {
  const base = process.env.APP_URL || request.url;

  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, base));
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const stateFromQuery = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const googleError = request.nextUrl.searchParams.get('error');
  const googleErrorDescription = request.nextUrl.searchParams.get('error_description');
  const stateCookie = request.cookies.get(stateCookieName)?.value;

  if (!clientId || !clientSecret) {
    return redirectToLogin(request, 'Google sign-in is not configured.');
  }

  if (googleError) {
    const detail = googleErrorDescription ? decodeURIComponent(googleErrorDescription) : googleError;
    return redirectToLogin(request, `Google sign-in was denied or failed: ${detail}`);
  }

  if (!stateCookie) {
    return redirectToLogin(request, 'Google sign-in state is missing or expired. Please try again.');
  }

  if (!stateFromQuery || !code) {
    return redirectToLogin(request, 'Google sign-in was cancelled or failed. Please try again.');
  }

  let storedState: { state?: string; returnTo?: string } | null = null;

  try {
    storedState = JSON.parse(Buffer.from(stateCookie, 'base64url').toString('utf8')) as { state?: string; returnTo?: string };
  } catch {
    return redirectToLogin(request, 'Google sign-in state is invalid. Please try again.');
  }

  if (!storedState?.state || storedState.state !== stateFromQuery) {
    return redirectToLogin(request, 'Google sign-in request was rejected for security reasons.');
  }

  try {
    const oauthClient = new OAuth2Client({ clientId, clientSecret, redirectUri });
    const { tokens } = await oauthClient.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return redirectToLogin(request, 'Google sign-in did not return an ID token.');
    }

    const ticket = await oauthClient.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub || typeof payload.email_verified !== 'boolean') {
      return redirectToLogin(request, 'Google account information is incomplete.');
    }

    const email = payload.email.trim().toLowerCase();
    const emailVerified = payload.email_verified === true;
    const googleId = payload.sub;

    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } });

      if (existingByEmail && existingByEmail.authProvider === 'LOCAL' && !existingByEmail.googleId) {
        if (!emailVerified) {
          return redirectToLogin(request, 'Google email must be verified before linking to your account.');
        }

        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            authProvider: 'GOOGLE',
            googleId,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
      } else if (existingByEmail && existingByEmail.authProvider === 'GOOGLE') {
        user = existingByEmail;
      }
    }

    if (!user) {
      if (!emailVerified) {
        return redirectToLogin(request, 'Google email must be verified before creating an account.');
      }

      user = await prisma.user.create({
        data: {
          email,
          fullName: payload.name || payload.given_name || 'Google User',
          authProvider: 'GOOGLE',
          googleId,
          passwordHash: null,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId ?? googleId,
        authProvider: 'GOOGLE',
        isEmailVerified: emailVerified || user.isEmailVerified,
        emailVerifiedAt: emailVerified ? new Date() : user.emailVerifiedAt,
        lastLoginAt: new Date(),
        fullName: user.fullName || payload.name || payload.given_name || 'Google User',
      },
    });

    const accessToken = await createAccessToken(updatedUser);
    const nextPath = getSafeReturnTo(storedState.returnTo ?? null);
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set({
      name: 'celiz_access_token',
      value: accessToken,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });
    response.cookies.set({
      name: stateCookieName,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set(refreshCookie(await issueRefreshToken(updatedUser.id, request)));

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return redirectToLogin(request, 'Google sign-in failed. Please try again.');
  }
}
