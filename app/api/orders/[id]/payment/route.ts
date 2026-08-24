import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { submitBankTransferDetails } from '@/lib/orders';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  try {
    const body = await request.json();
    const { id } = await params;
    const payment = await submitBankTransferDetails(id, user.id, { transferReference: body.transferReference, transferAmount: body.transferAmount, transferDate: body.transferDate, bankName: body.bankName, transferNote: body.transferNote, proofUrl: body.proofUrl });
    return NextResponse.json(payment);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const messages: Record<string, string> = { ORDER_NOT_FOUND: 'Order not found.', ORDER_FORBIDDEN: 'You cannot submit payment details for this order.', INVALID_PAYMENT_METHOD: 'This order does not use bank transfer.', PAYMENT_NOT_FOUND: 'Payment not found.', PAYMENT_ALREADY_PAID: 'This payment is already confirmed.', INVALID_PAYMENT_STATE: 'Payment is not accepting transfer details.', PAYMENT_ALREADY_SUBMITTED: 'Payment details are already awaiting review.', INVALID_TRANSFER_REFERENCE: 'Transfer reference is required.', INVALID_TRANSFER_AMOUNT: 'Transfer amount must be greater than zero.', INVALID_TRANSFER_DATE: 'Transfer date is invalid.' };
    const status = code === 'ORDER_NOT_FOUND' || code === 'PAYMENT_NOT_FOUND' ? 404 : code === 'ORDER_FORBIDDEN' ? 403 : code.startsWith('INVALID_TRANSFER') ? 400 : 409;
    return NextResponse.json({ error: messages[code] || 'Unable to submit payment details.' }, { status });
  }
}
