'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

interface Address { id: string; label: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string | null; city: string; district: string; postalCode?: string | null; isDefault: boolean; }
const empty = { label: 'Home', recipientName: '', phone: '', addressLine1: '', addressLine2: '', city: '', district: 'Colombo', postalCode: '', isDefault: false };

export default function AddressesPage() {
  const token = useStore((state) => state.accessToken);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  async function load() { const response = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('Unable to load addresses.'); setAddresses(await response.json()); }
  useEffect(() => { if (token) load().catch((reason) => setError(reason.message)); }, [token]);
  if (!token) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><h2>Sign in to manage addresses</h2><Link href="/login" className="btn-primary">Sign in</Link></div>;
  async function save(event: React.FormEvent) { event.preventDefault(); setError(''); const response = await fetch(editing ? `/api/addresses/${editing}` : '/api/addresses', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }); const result = await response.json(); if (!response.ok) { setError(result.error); return; } setForm(empty); setEditing(null); await load(); }
  async function remove(id: string) { const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) setError('Unable to delete address.'); else await load(); }
  async function makeDefault(id: string) { await fetch(`/api/addresses/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); await load(); }
  return <div className="container" style={{ maxWidth: 900, padding: '3rem 1.25rem 5rem' }}><Link href="/account">Back to account</Link><h1 style={{ margin: '1rem 0' }}>Saved addresses</h1>{error && <p role="alert" style={{ color: 'var(--error)' }}>{error}</p>}<form onSubmit={save} style={{ display: 'grid', gap: '.75rem', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-white)' }}><h2>{editing ? 'Edit address' : 'Add address'}</h2>{Object.entries(form).filter(([key]) => key !== 'isDefault').map(([key, value]) => <label key={key}>{key.replace(/([A-Z])/g, ' $1')}<input className="form-input" required={!['addressLine2', 'postalCode'].includes(key)} value={String(value)} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}<label><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} /> Set as default</label><div><button className="btn-primary">{editing ? 'Save changes' : 'Add address'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}</div></form><div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>{addresses.map((address) => <article key={address.id} style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-white)' }}><h2>{address.label} {address.isDefault && <small>(Default)</small>}</h2><p>{address.recipientName} · {address.phone}</p><p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />{address.city}, {address.district} {address.postalCode || ''}</p><button onClick={() => { setEditing(address.id); setForm({ label: address.label, recipientName: address.recipientName, phone: address.phone, addressLine1: address.addressLine1, addressLine2: address.addressLine2 || '', city: address.city, district: address.district, postalCode: address.postalCode || '', isDefault: address.isDefault }); }}>Edit</button>{!address.isDefault && <button onClick={() => makeDefault(address.id)}>Set default</button>}<button onClick={() => remove(address.id)}>Delete</button></article>)}</div></div>;
}
