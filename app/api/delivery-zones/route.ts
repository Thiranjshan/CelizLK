import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export async function GET(request: Request) {
  const district = new URL(request.url).searchParams.get('district')?.trim();
  const fee = Number(getEnv('DELIVERY_FEE_LKR', '350'));

  return NextResponse.json({
    fee,
    district: district ?? null,
    note: 'Flat delivery fee applies across the country.',
  });
}
