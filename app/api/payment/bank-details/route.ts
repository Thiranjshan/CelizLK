import { NextResponse } from 'next/server';
import { bankTransferInstructions } from '@/lib/payment-config';

export async function GET() {
  return NextResponse.json(bankTransferInstructions);
}
