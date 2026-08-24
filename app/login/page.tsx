'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const setAccessToken = useStore((state) => state.setAccessToken);
  const addToast = useStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
      setUser(data.user); setAccessToken(data.accessToken); router.push(requestedPath?.startsWith('/') ? requestedPath : '/'); addToast('success', 'Welcome back.');
    } catch (error) { addToast('error', error instanceof Error ? error.message : 'Unable to sign in.'); } finally { setLoading(false); }
  }

  return <AuthForm title="Welcome back" submitLabel="Sign in" loading={loading} onSubmit={submit} fields={{ email, setEmail, password, setPassword }} footer={<span>New to Celiz? <Link href="/signup">Create an account</Link></span>} />;
}

function AuthForm({ title, submitLabel, loading, onSubmit, fields, footer }: { title: string; submitLabel: string; loading: boolean; onSubmit: (event: React.FormEvent) => void; fields: { email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void }; footer: React.ReactNode }) {
  return <div className="container" style={{ maxWidth: 520, padding: '5rem 1.25rem' }}><div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}><h1>{title}</h1><p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 2rem' }}>Access your orders and faster checkout.</p><form onSubmit={onSubmit}><div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" required value={fields.email} onChange={(event) => fields.setEmail(event.target.value)} /></div><div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" required value={fields.password} onChange={(event) => fields.setPassword(event.target.value)} /></div><button className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? 'Signing in...' : submitLabel}</button></form><p style={{ marginTop: '1.5rem', textAlign: 'center' }}>{footer}</p></div></div>;
}