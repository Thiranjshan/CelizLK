import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Health checks must never be served from Next's cache, and must never be
// pre-rendered at build time (there's no database available during build).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DB_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Database check timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function GET() {
  const checks = {
    app: {
      status: 'healthy',
      message: 'Node process is running',
      pid: process.pid,
      uptimeSeconds: Number(process.uptime().toFixed(2)),
    },
    database: {
      status: 'unhealthy',
      message: 'Database not checked yet',
    },
  };

  const appAlive = process.pid > 0 && !!process.versions?.node;
  if (!appAlive) {
    checks.app.status = 'unhealthy';
    checks.app.message = 'Node process is not available';
  }

  try {
    const result = await withTimeout(
      prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`,
      DB_TIMEOUT_MS,
    );
    const databaseReachable = Array.isArray(result) && result.length > 0 && Number(result[0]?.ok) === 1;

    checks.database = {
      status: databaseReachable ? 'healthy' : 'unhealthy',
      message: databaseReachable ? 'Database reachable' : 'Database query did not return the expected result',
    };
  } catch (error) {
    // Full detail goes to server logs only. The public response stays generic
    // so it doesn't hand an attacker connection strings, table names, or
    // internal error text.
    console.error('Health check DB probe failed', error);
    checks.database = {
      status: 'unhealthy',
      message: 'Database connection failed',
    };
  }

  const healthy = checks.app.status === 'healthy' && checks.database.status === 'healthy';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}