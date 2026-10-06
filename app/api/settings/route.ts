import { NextResponse } from 'next/server';
import { getStoreSettings } from '@/lib/store-settings';

export async function GET() {
  try {
    return NextResponse.json(await getStoreSettings());
  } catch (error) {
    console.error('Error loading store settings:', error);
    return NextResponse.json({ error: 'Failed to load store settings.' }, { status: 500 });
  }
}
