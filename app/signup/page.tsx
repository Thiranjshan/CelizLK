'use client';

import Image from 'next/image';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="container" style={{ maxWidth: 520, padding: '5rem 1.25rem', textAlign: 'center' }}>Loading account setup...</div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const setUser = useStore((state) => state.setUser);
  const setAccessToken = useStore((state) => state.setAccessToken);
  const addToast = useStore((state) => state.addToast);

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      addToast('error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setUser(data.user);
      setAccessToken(data.accessToken);
      addToast('success', 'Account created successfully.');
      const targetPath = returnTo?.startsWith('/') ? returnTo : '/account';
      router.replace(targetPath);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';
  const googleAuthHref = returnTo ? `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}` : '/api/auth/google';

  return (
    <div className="container" style={{ maxWidth: 520, padding: '4rem 1.25rem' }}>
      <div className="auth-card">
        <h1>Create your account</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 2rem' }}>Save your details and track every order.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <a href={googleAuthHref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: '#fff', color: '#1f2937', border: '1px solid #d1d5db', borderRadius: 999, padding: '0.8rem 1rem', fontWeight: 600, textDecoration: 'none' }}>
            <Image src="/google-logo.png" alt="Google" width={18} height={18} style={{ display: 'block' }} />
            Continue with Google
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>or</span>
          <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input className="form-input" type="password" minLength={8} required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <button className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Already registered? <Link href={loginHref}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}