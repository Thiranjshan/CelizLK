'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BarChart3, ClipboardList, Package, RefreshCw, Users, AlertCircle, Building2, CheckCircle2, Clock } from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface PendingBankOrder { id: string; orderNumber: string; customerName: string; total: number; createdAt: string; }
interface DashboardData { metrics: { todayRevenue: number; todayOrders: number; totalProducts: number; totalCustomers: number; lowStock: number; bankTransferReviews: number }; statusCounts: Record<string, number>; recentOrders: { id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: string }[]; lowStock: { id: string; name: string; stockQty: number; price: number }[]; pendingBankOrders?: PendingBankOrder[]; }

export default function AdminDashboardPage() { return <AdminAuthGate active="dashboard">{(_, token) => <Dashboard token={token} />}</AdminAuthGate>; }

function Dashboard({ token }: { token: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'stock'>('orders');

  const load = () => fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } })
    .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })
    .then(setData).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [token]);

  const pendingBank = data?.metrics.bankTransferReviews ?? 0;

  return (
    <>
      <header className="admin-header">
        <div>
          <div className="admin-kicker">Overview</div>
          <h1>Store dashboard</h1>
          <p>Live performance and operational alerts from your database.</p>
        </div>
        <button className="admin-refresh" onClick={load} title="Refresh dashboard"><RefreshCw size={18} /></button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {data && (
        <>
          {/* Metric cards */}
          <div className="admin-metrics">
            <Metric icon={BarChart3} label="Today's revenue" value={`LKR ${data.metrics.todayRevenue.toLocaleString()}`} />
            <Metric icon={ClipboardList} label="Today's orders" value={String(data.metrics.todayOrders)} />
            <Metric icon={Package} label="Active products" value={String(data.metrics.totalProducts)} />
            <Metric icon={Users} label="Customers" value={String(data.metrics.totalCustomers)} />
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
            {([
              { key: 'orders', label: 'Recent Orders', icon: ClipboardList, badge: undefined as number | undefined },
              { key: 'payments', label: 'Payment Verification', icon: Building2, badge: pendingBank as number | undefined },
              { key: 'stock', label: 'Low Stock', icon: AlertTriangle, badge: data.metrics.lowStock as number | undefined },
            ] as const).map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.1rem',
                  fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', border: 'none', background: 'transparent',
                  borderBottom: activeTab === key ? '2px solid var(--accent-purple)' : '2px solid transparent',
                  color: activeTab === key ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  marginBottom: '-2px', transition: 'color 0.15s',
                }}
              >
                <Icon size={15} />
                {label}
                {badge != null && badge > 0 && (
                  <span style={{ background: key === 'payments' ? '#b45309' : 'var(--error)', color: '#fff', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.5rem', minWidth: 18, textAlign: 'center' }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Recent Orders */}
          {activeTab === 'orders' && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><h2>Recent Orders</h2><p>Latest customer activity</p></div>
                <span>{Object.entries(data.statusCounts).map(([s, c]) => `${s}: ${c}`).join(' · ') || 'No orders'}</span>
              </div>
              {data.recentOrders.length ? (
                <div className="admin-table-wrap">
                  <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
                    <tbody>
                      {data.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td><Link href={`/admin/orders/${order.id}`}><strong>{order.orderNumber}</strong></Link><small>{new Date(order.createdAt).toLocaleDateString()}</small></td>
                          <td>{order.customerName}</td>
                          <td><span className="admin-status">{order.status}</span></td>
                          <td>LKR {order.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="admin-empty">No orders found.</div>}
            </section>
          )}

          {/* Tab: Payment Verification */}
          {activeTab === 'payments' && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Payment Verification</h2>
                  <p>Bank transfers awaiting manual receipt verification</p>
                </div>
                {pendingBank > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
                    <AlertCircle size={15} /> {pendingBank} awaiting review
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.82rem', fontWeight: 700 }}>
                    <CheckCircle2 size={15} /> All clear
                  </div>
                )}
              </div>

              {pendingBank > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                    <strong>{pendingBank} order{pendingBank > 1 ? 's' : ''}</strong> ha{pendingBank > 1 ? 've' : 's'} a pending bank transfer that requires manual payment receipt verification before the order can be confirmed and fulfilled.
                  </div>
                  <Link
                    href="/admin/orders"
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start', background: 'var(--accent-purple)', padding: '0.7rem 1.5rem', textDecoration: 'none', justifyContent: 'center' }}
                  >
                    <Building2 size={16} /> Review Pending Payments →
                  </Link>
                </div>
              ) : (
                <div className="admin-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={32} color="var(--success)" />
                  <div>No bank transfers are currently awaiting verification.</div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}><Clock size={13} /> Verification Process</strong>
                When a customer selects Bank Transfer and places an order, they are instructed to send their payment receipt via WhatsApp (0751205996). Once you confirm receipt, go to the order and click <em>"Confirm Payment"</em> to verify and proceed with fulfilment.
              </div>
            </section>
          )}

          {/* Tab: Low Stock */}
          {activeTab === 'stock' && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div><h2>Low Stock</h2><p>Products needing attention</p></div>
                <span className="admin-alert-count">{data.metrics.lowStock}</span>
              </div>
              {data.lowStock.length ? (
                <div className="admin-stock-list">
                  {data.lowStock.map((product) => (
                    <div key={product.id}>
                      <div><strong>{product.name}</strong><small>LKR {product.price.toLocaleString()}</small></div>
                      <b className={product.stockQty === 0 ? 'out' : ''}><AlertTriangle size={13} /> {product.stockQty} left</b>
                    </div>
                  ))}
                </div>
              ) : <div className="admin-empty">Stock levels look healthy.</div>}
            </section>
          )}
        </>
      )}
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return <div className="admin-metric"><Icon size={20} /><div><small>{label}</small><strong>{value}</strong></div></div>;
}