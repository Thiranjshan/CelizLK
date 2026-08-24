'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

interface Payment { status: string; transferReference?: string | null; transferAmount?: number | null; transferDate?: string | null; transferSubmittedAt?: string | null; failureReason?: string | null; }
interface Order { id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; total: number; createdAt: string; customerName: string; customerPhone: string; customerEmail: string; shippingAddress: { addressLine1?: string; addressLine2?: string; city?: string; district?: string; postalCode?: string }; payments: Payment[]; bankTransferInstructions: { bankName: string; accountName: string; accountNumber: string; branch: string; currency: string }; items: { id: string; productName?: string | null; quantity: number; unitPrice: number; lineSubtotal: number }[]; }

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useStore((state) => state.accessToken);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferNote, setTransferNote] = useState('');
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
      const response = await fetch(`/api/orders/${id}/payment`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ transferReference, transferAmount, transferDate, transferNote }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit payment details.');
      setMessage('Payment details submitted. Awaiting verification.');
      setOrder((current) => current ? { ...current, paymentStatus: 'PENDING', payments: current.payments.map((payment) => ({ ...payment, status: 'PENDING', transferReference, transferAmount: Number(transferAmount), transferDate, transferSubmittedAt: new Date().toISOString(), failureReason: null })) } : current);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to submit payment details.'); } finally { setSubmitting(false); }
  }

  if (!token) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><h2>Sign in to view this order</h2><Link className="btn-primary" href="/login">Sign in</Link></div>;
  if (error) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><p>{error}</p><Link href="/account/orders">Back to orders</Link></div>;
  if (!order) return <div className="container" style={{ padding: '5rem 1.25rem' }}>Loading order...</div>;
  const address = order.shippingAddress;
  const paymentLabel = order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod;
  const payment = order.payments?.[0];
  const paymentLabelStatus = order.paymentStatus === 'PAID' ? 'Paid' : order.paymentMethod === 'BANK_TRANSFER' && payment?.status === 'FAILED' ? 'Payment requires attention' : order.paymentMethod === 'BANK_TRANSFER' && payment?.transferSubmittedAt ? 'Awaiting verification' : order.paymentMethod === 'BANK_TRANSFER' ? 'Payment pending' : 'Payment due on delivery';

  return <div className="container" style={{ maxWidth: 900, padding: '3rem 1.25rem 5rem' }}><Link href="/account/orders">Back to orders</Link><h1 style={{ margin: '1rem 0 .4rem' }}>Order #{order.orderNumber}</h1><p style={{ color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleString()}</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', marginTop: '1.5rem' }}><section className="admin-form-panel"><h2>Order status</h2><p style={{ fontWeight: 800 }}>{order.status}</p><p>Payment: {paymentLabel}</p><p>Payment status: <strong>{paymentLabelStatus}</strong></p><p>Total: <strong>LKR {order.total.toLocaleString()}</strong></p></section><section className="admin-form-panel"><h2>Delivery</h2><p>{order.customerName}</p><p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p><p>{address.city}, {address.district} {address.postalCode || ''}</p><p>{order.customerPhone}</p><p>{order.customerEmail}</p></section></div>{order.paymentMethod === 'BANK_TRANSFER' && <section className="admin-form-panel"><h2>Bank transfer</h2><p>Expected amount: <strong>LKR {order.total.toLocaleString()}</strong></p><p>Bank: {order.bankTransferInstructions.bankName} · Account: {order.bankTransferInstructions.accountName} · {order.bankTransferInstructions.accountNumber} · {order.bankTransferInstructions.branch}</p>{payment?.status === 'FAILED' && <p style={{ color: 'var(--error)' }}>Payment requires attention: {payment.failureReason}</p>}{payment?.transferSubmittedAt && payment.status === 'PENDING' && <p>Payment details submitted. Awaiting verification.</p>}{(payment?.status === 'PENDING' && !payment.transferSubmittedAt || payment?.status === 'FAILED') && <form onSubmit={submitTransfer} style={{ display: 'grid', gap: '.75rem', marginTop: '1rem' }}><label>Transfer reference<input className="form-input" required value={transferReference} onChange={(event) => setTransferReference(event.target.value)} /></label><label>Transfer amount<input className="form-input" required type="number" min="0.01" step="0.01" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} /></label><label>Transfer date<input className="form-input" required type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} /></label><label>Note<input className="form-input" value={transferNote} onChange={(event) => setTransferNote(event.target.value)} /></label><button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Transfer Details'}</button></form>}{message && <p style={{ color: 'var(--success)' }}>{message}</p>}</section>}<section className="admin-form-panel"><h2>Items</h2>{order.items.map((item) => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '.8rem 0', borderBottom: '1px solid var(--border-color)' }}><span>{item.productName || 'Product'} × {item.quantity}</span><strong>LKR {item.lineSubtotal.toLocaleString()}</strong></div>)}</section></div>;
}
