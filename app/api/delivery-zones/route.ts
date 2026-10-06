import { NextResponse } from 'next/server';
import { getStoreSettings } from '@/lib/store-settings';

export async function GET(request: Request) {
  const district = new URL(request.url).searchParams.get('district')?.trim();
  const settings = await getStoreSettings();
  const fee = Number(settings.delivery.fee ?? 350);

  return NextResponse.json({
    fee,
    district: district ?? null,
    note: 'Flat delivery fee applies across the country.',
  });
}
