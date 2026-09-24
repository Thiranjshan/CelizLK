'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { ArrowLeft, Plus, Pencil, Trash2, Star } from 'lucide-react';


interface Address { id: string; label: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string | null; city: string; district: string; postalCode?: string | null; isDefault: boolean; }
const empty = { label: 'Home', recipientName: '', phone: '', addressLine1: '', addressLine2: '', city: '', district: 'Colombo', postalCode: '', isDefault: false };

export default function AddressesPage() {
  const token = useStore((state) => state.accessToken);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() { const response = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('Unable to load addresses.'); setAddresses(await response.json()); }
  useEffect(() => {
    if (!token) return;
    async function loadInitialAddresses() {
      try {
        const response = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Unable to load addresses.');
        setAddresses(await response.json());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load addresses.');
      }
    }
    void loadInitialAddresses();
  }, [token]);
  if (!token) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><h2>Sign in to manage addresses</h2><Link href="/login" className="btn-primary">Sign in</Link></div>;
  async function save(event: React.FormEvent) { event.preventDefault(); setError(''); const response = await fetch(editing ? `/api/addresses/${editing}` : '/api/addresses', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }); const result = await response.json(); if (!response.ok) { setError(result.error); return; } setForm(empty); setEditing(null); await load(); }
  async function remove(id: string) { const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) setError('Unable to delete address.'); else await load(); }
  async function makeDefault(id: string) { await fetch(`/api/addresses/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); await load(); }

  return (
    <div className="container" style={{ maxWidth: 900, padding: '3rem 1.25rem 5rem' }}>
      <Link
        href="/account"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          background: 'var(--primary-indigo)',
          borderRadius: 8,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={20} strokeWidth={3} color="#fff" />
      </Link>

      <h1 style={{ margin: '1.5rem 0 1.25rem' }}>Saved addresses</h1>

      {error && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      )}

      {/* Saved addresses list — now on top */}
      <div className="address-list" style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        {addresses.length === 0 && !showForm && (
          <p style={{ color: 'var(--text-secondary)' }}>
            You haven&apos;t saved any addresses yet.
          </p>
        )}

        {addresses.map((address) => (
          <article
            key={address.id}
            style={{
              padding: '1.25rem',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              background: 'var(--bg-white)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '.5rem',
                marginBottom: '.5rem',
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{address.label}</h2>
              {address.isDefault && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.25rem',
                    fontSize: '.72rem',
                    fontWeight: 700,
                    color: 'var(--accent-purple)',
                    background: 'rgba(124,58,237,0.08)',
                    padding: '.15rem .55rem',
                    borderRadius: 999,
                  }}
                >
                  <Star size={11} fill="var(--accent-purple)" />
                  Default
                </span>
              )}
            </div>

            <p style={{ margin: '0 0 .35rem', color: 'var(--text-secondary)', fontSize: '.9rem' }}>
              {address.recipientName} · {address.phone}
            </p>

            <p style={{ margin: '0 0 1rem', lineHeight: 1.6 }}>
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              <br />
              {address.city}, {address.district} {address.postalCode || ''}
            </p>

            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setEditing(address.id);
                  setForm({
                    label: address.label,
                    recipientName: address.recipientName,
                    phone: address.phone,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2 || '',
                    city: address.city,
                    district: address.district,
                    postalCode: address.postalCode || '',
                    isDefault: address.isDefault,
                  });
                  setShowForm(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.35rem',
                  fontSize: '.82rem',
                  fontWeight: 600,
                  padding: '.4rem .75rem',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-white)',
                  cursor: 'pointer',
                }}
              >
                <Pencil size={14} />
                Edit
              </button>

              {!address.isDefault && (
                <button
                  onClick={() => makeDefault(address.id)}
                  style={{
                    fontSize: '.82rem',
                    fontWeight: 600,
                    padding: '.4rem .75rem',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-white)',
                    cursor: 'pointer',
                  }}
                >
                  Set default
                </button>
              )}

              <button
                onClick={() => remove(address.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.35rem',
                  fontSize: '.82rem',
                  fontWeight: 600,
                  padding: '.4rem .75rem',
                  borderRadius: 6,
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  background: 'var(--bg-white)',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Add new address trigger */}
      {!showForm && (
        <button
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setShowForm(true);
          }}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.5rem',
          }}
        >
          <Plus size={16} />
          Add new address
        </button>
      )}

      {/* Add / edit form */}
      {showForm && (
        <form
          onSubmit={save}
          style={{
            display: 'grid',
            gap: '.75rem',
            padding: '1.25rem',
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            background: 'var(--bg-white)',
            marginTop: '.5rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>{editing ? 'Edit address' : 'Add address'}</h2>

          {Object.entries(form)
            .filter(([key]) => key !== 'isDefault')
            .map(([key, value]) => (
              <label key={key}>
                {key.replace(/([A-Z])/g, ' $1')}
                <input
                  className="form-input"
                  required={!['addressLine2', 'postalCode'].includes(key)}
                  value={String(value)}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                />
              </label>
            ))}

          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
            />
            Set as default
          </label>

          <div style={{ display: 'flex', gap: '.6rem' }}>
            <button className="btn-primary">{editing ? 'Save changes' : 'Add address'}</button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
                setShowForm(false);
              }}
              style={{
                padding: '.6rem 1.1rem',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-white)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
