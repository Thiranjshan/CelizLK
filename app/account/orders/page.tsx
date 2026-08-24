'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Order } from '@/lib/types';

export default function OrdersPage() {
  const token = useStore((state) => state.accessToken); const user = useStore((state) => state.user); const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { if (token) fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.ok ? response.json() : []).then(setOrders).catch(() => setOrders([])); }, [token]);
  if (!user) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><h2>Sign in to view orders</h2><Link className="btn-primary" href="/login">Sign in</Link></div>;
  return <div className="container" style={{ maxWidth: 900, padding: '4rem 1.25rem' }}><h1>Order history</h1>{orders.length === 0 ? <p style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>No orders yet.</p> : <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>{orders.map((order) => <div key={order.id} style={{ padding: '1.25rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><strong>{order.orderNumber}</strong><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleDateString()} · {order.status}</div></div><div style={{ textAlign: 'right' }}><strong style={{ color: 'var(--primary-indigo)' }}>LKR {order.total.toLocaleString()}</strong><div><Link href={`/checkout/success?orderNumber=${order.orderNumber}`} style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 600 }}>View Details & Receipt</Link></div></div></div>)}</div>}</div>;
}