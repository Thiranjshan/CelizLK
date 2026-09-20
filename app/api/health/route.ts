import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    const databaseReachable = Array.isArray(result) && result.length > 0 && Number(result[0]?.ok) === 1;

    checks.database = {
      status: databaseReachable ? 'healthy' : 'unhealthy',
      message: databaseReachable ? 'Database reachable' : 'Database query did not return the expected result',
    };
  } catch (error) {
    console.error('Health check DB probe failed', error);
    checks.database = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  const healthy = checks.app.status === 'healthy' && checks.database.status === 'healthy';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}
