import { NextResponse } from 'next/server';
import { getBankTransferInstructions } from '@/lib/payment-config';

export async function GET() {
  return NextResponse.json(await getBankTransferInstructions());
}
