'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface Payment { method: string; status: string; amount: number; currency: string; transferReference?: string | null; transferAmount?: number | null; transferDate?: string | null; transferSubmittedAt?: string | null; bankName?: string | null; transferNote?: string | null; proofUrl?: string | null; failureReason?: string | null; verifiedAt?: string | null; verifiedByAdminId?: string | null; }
interface Item { id: string; productName?: string | null; productSku?: string | null; quantity: number; unitPrice: number; lineSubtotal: number; }
interface Event { id: string; eventType: string; previousOrderStatus?: string | null; newOrderStatus?: string | null; previousPaymentStatus?: string | null; newPaymentStatus?: string | null; actorType: string; actorId?: string | null; description: string; createdAt: string; }
interface Order { id: string; orderNumber: string; createdAt: string; status: string; paymentStatus: string; paymentMethod: string; total: number; subtotal: number; shippingFee: number; customerName: string; customerEmail: string; customerPhone: string; shippingAddress: { addressLine1?: string; addressLine2?: string; city?: string; district?: string; postalCode?: string }; items: Item[]; payment: Payment[]; events: Event[]; }

export default function AdminOrderDetailPage() {
  return <AdminAuthGate active="orders">{(_, token) => <OrderDetail token={token} />}</AdminAuthGate>;
}

function OrderDetail({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  async function load() {
    const response = await fetch(`/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to load order.');
    setOrder(result);
  }
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to load order.'); return result; })
      .then((result) => { if (!cancelled) setOrder(result); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load order.'); });
    return () => { cancelled = true; };
  }, [id, token]);

  async function action(url: string, method: string, body?: object) {
    setBusy(true); setError('');
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Action failed.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Action failed.'); } finally { setBusy(false); }
  }

  if (!order) return <><Link href="/admin/orders">Back to orders</Link>{error ? <div className="admin-error">{error}</div> : <p>Loading order...</p>}</>;
  const payment = order.payment[0];
  const nextStatuses: Record<string, string> = { CONFIRMED: 'PROCESSING', PROCESSING: 'PACKED', PACKED: 'SHIPPED', SHIPPED: 'DELIVERED' };
  const nextStatus = nextStatuses[order.status];
  const address = order.shippingAddress;

  return <>
    <div className="admin-header"><div><Link href="/admin/orders">Back to orders</Link><div className="admin-kicker">Order detail</div><h1>{order.orderNumber}</h1><p>{new Date(order.createdAt).toLocaleString()} · {order.status}</p></div></div>
    {error && <div className="admin-error">{error}</div>}
    <div className="admin-detail-grid">
      <section className="admin-form-panel"><h2>Order</h2><p>Status: <strong>{order.status}</strong></p><p>Subtotal: LKR {order.subtotal.toLocaleString()}</p><p>Delivery: LKR {order.shippingFee.toLocaleString()}</p><p>Total: <strong>LKR {order.total.toLocaleString()}</strong></p></section>
      <section className="admin-form-panel"><h2>Customer</h2><p><strong>{order.customerName}</strong></p><p>{order.customerEmail}</p><p>{order.customerPhone}</p><p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p><p>{address.city}, {address.district} {address.postalCode || ''}</p></section>
      <section className="admin-form-panel admin-form-wide"><h2>Items</h2><div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id}><td>{item.productName || 'Product unavailable'}</td><td>{item.productSku || '-'}</td><td>{item.quantity}</td><td>LKR {item.unitPrice.toLocaleString()}</td><td>LKR {item.lineSubtotal.toLocaleString()}</td></tr>)}</tbody></table></div></section>
      <section className="admin-form-panel"><h2>Payment</h2><p>Method: <strong>{payment?.method || order.paymentMethod}</strong></p><p>Status: <strong>{payment?.status || order.paymentStatus}</strong></p><p>Expected amount: LKR {order.total.toLocaleString()} {payment && <span>({payment.currency})</span>}</p>{order.paymentMethod === 'BANK_TRANSFER' && <><p>Submitted amount: {payment?.transferAmount ? `LKR ${payment.transferAmount.toLocaleString()}` : 'Not submitted'}</p><p>Reference: {payment?.transferReference || 'Not submitted'}</p><p>Transfer date: {payment?.transferDate ? new Date(payment.transferDate).toLocaleDateString() : 'Not submitted'}</p>{payment?.transferSubmittedAt && <p>Submitted: {new Date(payment.transferSubmittedAt).toLocaleString()}</p>}{payment?.failureReason && <p style={{ color: 'var(--error)' }}>Rejection reason: {payment.failureReason}</p>}</>}{payment?.verifiedAt && <p>Verified: {new Date(payment.verifiedAt).toLocaleString()}</p>}</section>
      <section className="admin-form-panel"><h2>Actions</h2><div className="admin-row-actions">{nextStatus && <button className="admin-outline-button" disabled={busy} onClick={() => action('/api/admin/orders', 'PATCH', { id: order.id, status: nextStatus })}>{nextStatus}</button>}{['CONFIRMED', 'PROCESSING'].includes(order.status) && <button className="admin-danger-button" disabled={busy} onClick={() => action('/api/admin/orders', 'PATCH', { id: order.id, status: 'CANCELLED' })}>Cancel Order</button>}{order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED' && <button className="admin-outline-button" disabled={busy} onClick={() => action(`/api/admin/orders/${order.id}/payment/confirm-cod`, 'POST')}>Mark COD Payment Received</button>}{order.paymentMethod === 'BANK_TRANSFER' && payment?.status === 'PENDING' && payment.transferSubmittedAt && <><button className="admin-outline-button" disabled={busy} onClick={() => action(`/api/admin/orders/${order.id}/payment/verify`, 'POST')}>Confirm Payment</button><input className="admin-inline-input" placeholder="Rejection reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} /><button className="admin-danger-button" disabled={busy || !rejectionReason.trim()} onClick={() => action(`/api/admin/orders/${order.id}/payment/reject`, 'POST', { reason: rejectionReason })}>Reject Payment</button></>}</div></section>
      <section className="admin-form-panel admin-form-wide"><h2>Timeline</h2><div className="admin-stock-list">{order.events.map((event) => <div key={event.id}><div><strong>{event.eventType}</strong><small>{event.description} · {event.actorType}{event.actorId ? ` (${event.actorId})` : ''}</small></div><small>{new Date(event.createdAt).toLocaleString()}</small></div>)}</div></section>
    </div>
  </>;
}
