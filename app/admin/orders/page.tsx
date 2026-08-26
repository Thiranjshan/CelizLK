'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ClipboardList, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock, Ban, RefreshCw, Banknote, Building2, CreditCard } from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface Order { id: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string; status: string; paymentStatus?: string; total: number; paymentMethod: string; createdAt: string; shippingAddress: { addressLine1?: string; city?: string; district?: string }; }

const FINALIZED = new Set(['COMPLETED', 'CANCELLED', 'REFUNDED', 'DELIVERED']);
const ACTIVE_STATUSES = ['ALL', 'AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED'];
const FINALIZED_STATUSES = ['ALL', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  AWAITING_PAYMENT: { bg: 'rgba(234,179,8,0.12)', color: '#b45309' }, CONFIRMED: { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  PROCESSING: { bg: 'rgba(139,92,246,0.12)', color: '#6d28d9' }, PACKED: { bg: 'rgba(99,102,241,0.12)', color: '#4338ca' },
  SHIPPED: { bg: 'rgba(14,165,233,0.12)', color: '#0369a1' }, DELIVERED: { bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
  COMPLETED: { bg: 'rgba(34,197,94,0.15)', color: '#15803d' }, CANCELLED: { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' }, REFUNDED: { bg: 'rgba(107,114,128,0.12)', color: '#374151' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { bg: 'rgba(107,114,128,0.1)', color: '#374151' };
  return <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{status.replace(/_/g, ' ')}</span>;
}

function PMIcon({ method }: { method: string }) {
  if (method === 'COD') return <Banknote size={14} color="var(--success)" />;
  if (method === 'BANK_TRANSFER') return <Building2 size={14} color="var(--primary-indigo)" />;
  return <CreditCard size={14} color="var(--accent-purple)" />;
}

export default function OrdersPage() { return <AdminAuthGate active="orders">{(_, token) => <OrdersManager token={token} />}</AdminAuthGate>; }

function OrdersManager({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showFinalized, setShowFinalized] = useState(false);
  const [finalFilter, setFinalFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const load = useCallback((options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    return fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => { if (!silent) setLoading(false); });
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function refreshAfterMutation() {
    await load({ silent: true });
  }

  async function updateStatus(order: Order, status: string) {
    setError('');
    const r = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: order.id, status }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); return; }
    await refreshAfterMutation();
  }

  async function confirmBankPayment(orderId: string) {
    setConfirmBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/admin/orders/${orderId}/payment/verify`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setConfirmingId(null);
      await refreshAfterMutation();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to confirm payment.'); }
    finally { setConfirmBusy(false); }
  }

  async function confirmCodPayment(orderId: string) {
    setError('');
    const r = await fetch(`/api/admin/orders/${orderId}/payment/confirm-cod`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    if (!r.ok) { setError(d.error); return; }
    await refreshAfterMutation();
  }

  const nextStatuses: Record<string, string[]> = { CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['PACKED', 'CANCELLED'], PACKED: ['SHIPPED'], SHIPPED: ['DELIVERED'] };

  const activeOrders = useMemo(() => orders.filter((o) => !FINALIZED.has(o.status) && (activeFilter === 'ALL' || o.status === activeFilter)), [orders, activeFilter]);

  const finalizedOrders = useMemo(() => orders.filter((o) => {
    if (!FINALIZED.has(o.status)) return false;
    if (finalFilter !== 'ALL' && o.status !== finalFilter) return false;
    if (dateFilter && new Date(o.createdAt).toISOString().split('T')[0] !== dateFilter) return false;
    return true;
  }), [orders, finalFilter, dateFilter]);

  const pendingBankCount = orders.filter((o) => o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'PENDING' && !FINALIZED.has(o.status)).length;

  return (
    <>
      <header className="admin-header">
        <div>
          <div className="admin-kicker">Operations</div>
          <h1>Orders</h1>
          <p>Review customer orders and move them through the fulfilment flow.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {pendingBankCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
              <AlertCircle size={15} /> {pendingBankCount} bank transfer{pendingBankCount > 1 ? 's' : ''} pending verification
            </div>
          )}
          <button className="admin-refresh" onClick={load} title="Refresh"><RefreshCw size={18} /></button>
          <ClipboardList size={30} color="var(--accent-purple)" />
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {/* Bank Transfer Confirm Modal */}
      {confirmingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', padding: '2.5rem 2rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: 'rgba(234,179,8,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <AlertCircle size={28} color="#b45309" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Confirm Bank Payment?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              You are about to mark this bank transfer as <strong>verified and paid</strong>. This will confirm the order and <strong>cannot be easily undone</strong>. Make sure you have physically verified the payment receipt before proceeding.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="admin-outline-button" onClick={() => setConfirmingId(null)} disabled={confirmBusy}>Cancel</button>
              <button className="btn-primary" style={{ background: '#16a34a', justifyContent: 'center', padding: '0.65rem 1.5rem' }} onClick={() => confirmBankPayment(confirmingId)} disabled={confirmBusy}>
                <CheckCircle2 size={16} /> {confirmBusy ? 'Confirming…' : 'Yes, Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Orders */}
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><h2>Active Orders</h2><p>{activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''} in progress</p></div>
          <select className="admin-filter" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            {ACTIVE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        {loading ? <div className="admin-empty"><Clock size={18} style={{ marginRight: 6 }} />Loading orders…</div> : activeOrders.length ? (
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th>Actions</th></tr></thead>
              <tbody>
                {activeOrders.map((order) => {
                  const isPendingBank = order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PENDING';
                  return (
                    <tr key={order.id}>
                      <td><Link href={`/admin/orders/${order.id}`}><strong>{order.orderNumber}</strong></Link><small>{new Date(order.createdAt).toLocaleString()}</small></td>
                      <td><strong>{order.customerName}</strong><small>{order.customerPhone}</small></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <PMIcon method={order.paymentMethod} />
                          <span style={{ fontSize: '0.82rem' }}>{order.paymentMethod.replace(/_/g, ' ')}</span>
                          {isPendingBank && <span style={{ background: 'rgba(234,179,8,0.14)', color: '#b45309', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 999 }}>⏳ Verify</span>}
                        </div>
                      </td>
                      <td><strong>LKR {order.total.toLocaleString()}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {(nextStatuses[order.status] || []).map((s) => (
                            <button key={s} className="admin-inline-button" onClick={() => updateStatus(order, s)} style={s === 'CANCELLED' ? { color: 'var(--error)' } : {}}>
                              {s === 'CANCELLED' ? <Ban size={12} /> : <CheckCircle2 size={12} />} {s.replace(/_/g, ' ')}
                            </button>
                          ))}
                          {order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED' && (
                            <button className="admin-inline-button" onClick={() => confirmCodPayment(order.id)}><Banknote size={12} /> Mark COD Paid</button>
                          )}
                          {isPendingBank && (
                            <button className="admin-inline-button" style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d', fontWeight: 700 }} onClick={() => setConfirmingId(order.id)}>
                              <CheckCircle2 size={12} /> Confirm Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="admin-empty">No active orders match this filter.</div>}
      </section>

      {/* Finalized Orders */}
      <section className="admin-panel" style={{ marginTop: '1.5rem' }}>
        <div className="admin-panel-heading">
          <div><h2>Completed &amp; Finalized Orders</h2><p>Cancelled, completed, and refunded orders</p></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {showFinalized && (
              <>
                <input type="date" className="admin-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} title="Filter by order date" />
                <select className="admin-filter" value={finalFilter} onChange={(e) => setFinalFilter(e.target.value)}>
                  {FINALIZED_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}
            <button className="admin-outline-button" onClick={() => setShowFinalized((v) => !v)}>
              {showFinalized ? <><ChevronUp size={15} /> Hide</> : <><ChevronDown size={15} /> View Finalized Orders</>}
            </button>
          </div>
        </div>
        {showFinalized && (finalizedOrders.length ? (
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead>
              <tbody>
                {finalizedOrders.map((order) => (
                  <tr key={order.id}>
                    <td><Link href={`/admin/orders/${order.id}`}><strong>{order.orderNumber}</strong></Link></td>
                    <td><strong>{order.customerName}</strong><small>{order.customerPhone}</small></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PMIcon method={order.paymentMethod} /><span style={{ fontSize: '0.82rem' }}>{order.paymentMethod.replace(/_/g, ' ')}</span></div></td>
                    <td>LKR {order.total.toLocaleString()}</td>
                    <td><small>{new Date(order.createdAt).toLocaleDateString()}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="admin-empty">No finalized orders match this filter.</div>)}
      </section>
    </>
  );
}

