import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { confirmBankTransfer } from '@/lib/orders';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  try {
    const { id } = await params;
    const result = await confirmBankTransfer(id, admin.id);
    console.info(`Bank transfer confirmed - Order: ${id}, Admin: ${admin.id}`);
    await writeAudit(admin.id, 'CONFIRM_BANK_TRANSFER', 'PAYMENT', result.payment.id, { orderId: id });
    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const messages: Record<string, string> = { ORDER_NOT_FOUND: 'Order not found.', INVALID_PAYMENT_METHOD: 'This order does not use bank transfer.', PAYMENT_NOT_FOUND: 'Payment not found.', PAYMENT_ALREADY_PAID: 'Payment is already confirmed.', PAYMENT_ALREADY_REJECTED: 'Payment has already been rejected.', INVALID_PAYMENT_STATE: 'Payment is not eligible for confirmation.', PAYMENT_CONFLICT: 'Payment changed by another admin. Refresh and try again.', ORDER_CONFLICT: 'Order changed by another admin. Refresh and try again.' };
    return NextResponse.json({ error: messages[code] || 'Unable to confirm bank transfer.' }, { status: code === 'ORDER_NOT_FOUND' || code === 'PAYMENT_NOT_FOUND' ? 404 : 409 });
  }
}
