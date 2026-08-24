'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

interface Payment { method: string; status: string; amount: number; currency: string; transferReference?: string | null; transferAmount?: number | null; transferDate?: string | null; transferSubmittedAt?: string | null; failureReason?: string | null; }
interface TimelineEvent { status: string; label: string; createdAt: string; }
interface OrderItem { id: string; productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number; image?: string | null; }
interface Order { id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; subtotal: number; discount: number; deliveryFee: number; total: number; createdAt: string; customerName: string; customerPhone: string; customerEmail: string; shippingAddress: { addressLine1?: string; addressLine2?: string; city?: string; district?: string; postalCode?: string }; payment: Payment | null; timeline: TimelineEvent[]; bankTransferInstructions: { bankName: string; accountName: string; accountNumber: string; branch: string; currency: string } | null; items: OrderItem[]; }

const statusSteps = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
const statusLabel = (status: string) => status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value: number) => `LKR ${value.toLocaleString()}`;

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useStore((state) => state.accessToken);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [transfer, setTransfer] = useState({ reference: '', amount: '', date: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); return result; })
      .then(setOrder)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load order.'));
  }, [id, token]);

  async function submitTransfer(event: React.FormEvent) {
    event.preventDefault(); setSubmitting(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/orders/${id}/payment`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ transferReference: transfer.reference, transferAmount: transfer.amount, transferDate: transfer.date, transferNote: transfer.note }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit payment details.');
      setMessage('Payment details submitted. Awaiting verification.');
      setOrder((current) => current ? { ...current, paymentStatus: 'PENDING', payment: current.payment ? { ...current.payment, status: 'PENDING', transferReference: transfer.reference, transferAmount: Number(transfer.amount), transferDate: transfer.date, transferSubmittedAt: new Date().toISOString(), failureReason: null } : current.payment } : current);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to submit payment details.'); } finally { setSubmitting(false); }
  }

  if (!token) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><h2>Sign in to view this order</h2><Link className="btn-primary" href="/login">Sign in</Link></div>;
  if (error) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><p role="alert">{error}</p><Link href="/account/orders">Back to orders</Link></div>;
  if (!order) return <div className="container" style={{ padding: '5rem 1.25rem' }}>Loading order...</div>;

  const address = order.shippingAddress;
  const eventByStatus = new Map(order.timeline.map((event) => [event.status, event]));
  const cancelled = order.status === 'CANCELLED';
  const steps = cancelled ? [...statusSteps.filter((step) => eventByStatus.has(step)), 'CANCELLED'] : statusSteps;

  return <div className="container" style={{ maxWidth: 900, padding: '3rem 1.25rem 5rem' }}>
    <Link href="/account/orders">Back to orders</Link>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'end', margin: '1rem 0 1.5rem' }}><div><h1 style={{ margin: 0 }}>Order #{order.orderNumber}</h1><p style={{ color: 'var(--text-secondary)', margin: '.4rem 0 0' }}>Placed {new Date(order.createdAt).toLocaleString()}</p></div><strong style={{ fontSize: '1.2rem' }}>{statusLabel(order.status)}</strong></div>
    <section className="admin-form-panel" style={{ marginBottom: '1rem' }}><h2>Order timeline</h2><div style={{ display: 'grid', gap: '.9rem' }}>{steps.map((step) => { const event = eventByStatus.get(step); const complete = Boolean(event); const current = step === order.status; return <div key={step} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', opacity: complete || current ? 1 : .45 }}><span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', background: current ? 'var(--primary-indigo)' : complete ? 'var(--success)' : 'var(--border-color)', color: 'white', fontWeight: 800 }}>{step === 'CANCELLED' ? 'x' : complete ? '✓' : '·'}</span><div><strong>{event?.label || statusLabel(step)}</strong>{event && <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{new Date(event.createdAt).toLocaleString()}</div>}</div></div>; })}</div></section>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
      <section className="admin-form-panel"><h2>Products</h2>{order.items.map((item) => <div key={item.id} style={{ display: 'flex', gap: '.75rem', alignItems: 'center', padding: '.75rem 0', borderBottom: '1px solid var(--border-color)' }}>{item.image && <img src={item.image} alt="" width="56" height="56" style={{ objectFit: 'cover', borderRadius: 6 }} />}<div style={{ flex: 1 }}><strong>{item.productName}</strong><div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>Qty: {item.quantity} · {money(item.unitPrice)} each</div></div><strong>{money(item.lineTotal)}</strong></div>)}<div style={{ display: 'grid', gap: '.4rem', marginTop: '1rem' }}><div>Subtotal <strong style={{ float: 'right' }}>{money(order.subtotal)}</strong></div>{order.discount > 0 && <div>Discount <strong style={{ float: 'right', color: 'var(--success)' }}>-{money(order.discount)}</strong></div>}<div>Delivery <strong style={{ float: 'right' }}>{order.deliveryFee ? money(order.deliveryFee) : 'FREE'}</strong></div><div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '.6rem', marginTop: '.3rem' }}>Total <strong style={{ float: 'right' }}>{money(order.total)}</strong></div></div></section>
      <section className="admin-form-panel"><h2>Delivery information</h2><p><strong>{order.customerName}</strong><br />{order.customerPhone}<br />{order.customerEmail}</p><p>{address.addressLine1}{address.addressLine2 ? <><br />{address.addressLine2}</> : null}<br />{address.city}, {address.district}{address.postalCode ? ` ${address.postalCode}` : ''}<br />Sri Lanka</p><h2>Payment</h2><p>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : statusLabel(order.paymentMethod)}<br />Status: <strong>{order.payment?.status || order.paymentStatus}</strong></p></section>
    </div>
    {order.paymentMethod === 'BANK_TRANSFER' && order.bankTransferInstructions && <section className="admin-form-panel" style={{ marginTop: '1rem' }}><h2>Bank transfer</h2><p>{order.bankTransferInstructions.bankName} · {order.bankTransferInstructions.accountName} · {order.bankTransferInstructions.accountNumber} · {order.bankTransferInstructions.branch}</p>{order.payment?.status === 'FAILED' && <p role="alert" style={{ color: 'var(--error)' }}>Payment requires attention: {order.payment.failureReason}</p>}{message && <p role="status" style={{ color: 'var(--success)' }}>{message}</p>}{order.payment?.status !== 'PAID' && (!order.payment?.transferSubmittedAt || order.payment.status === 'FAILED') && <form onSubmit={submitTransfer} style={{ display: 'grid', gap: '.75rem' }}><input className="form-input" required placeholder="Transfer reference" value={transfer.reference} onChange={(event) => setTransfer({ ...transfer, reference: event.target.value })} /><input className="form-input" required type="number" min="0" step="0.01" placeholder={`Amount (${money(order.total)})`} value={transfer.amount} onChange={(event) => setTransfer({ ...transfer, amount: event.target.value })} /><input className="form-input" required type="date" value={transfer.date} onChange={(event) => setTransfer({ ...transfer, date: event.target.value })} /><input className="form-input" placeholder="Note (optional)" value={transfer.note} onChange={(event) => setTransfer({ ...transfer, note: event.target.value })} /><button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit payment details'}</button></form>}</section>}
  </div>;
}
