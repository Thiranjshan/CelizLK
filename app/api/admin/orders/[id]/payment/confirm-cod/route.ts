import { NextResponse } from 'next/server';
import { getAdminFromRequest, hasAdminPermission, writeAudit } from '@/lib/admin-auth';
import { confirmCodPayment } from '@/lib/orders';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!hasAdminPermission(admin.role, ['ORDER_MANAGER'])) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  try {
    const { id } = await params;
    const payment = await confirmCodPayment(id, admin.id);
    console.info(`COD payment confirmed - Payment: ${payment.id}, Admin: ${admin.id}`);
    await writeAudit(admin.id, 'CONFIRM_COD_PAYMENT', 'PAYMENT', payment.id, { orderId: id });
    return NextResponse.json(payment);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const messages: Record<string, string> = { ORDER_NOT_FOUND: 'Order not found.', PAYMENT_NOT_FOUND: 'Payment not found.', INVALID_PAYMENT_METHOD: 'This order does not use COD.', PAYMENT_ALREADY_PAID: 'COD payment is already confirmed.', INVALID_PAYMENT_STATE: 'Payment is not eligible for confirmation.', INVALID_ORDER_STATE: 'This order is not eligible for COD payment confirmation.', ORDER_CANCELLED: 'Cancelled orders cannot receive COD confirmation.', PAYMENT_CONFLICT: 'Payment changed by another admin. Refresh and try again.' };
    return NextResponse.json({ error: messages[code] || 'Unable to confirm COD payment.' }, { status: code === 'ORDER_NOT_FOUND' || code === 'PAYMENT_NOT_FOUND' ? 404 : 409 });
  }
}