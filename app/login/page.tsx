'use client';

import Image from 'next/image';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container" style={{ maxWidth: 520, padding: '5rem 1.25rem', textAlign: 'center' }}>Loading sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const googleAuthHref = returnTo ? `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}` : '/api/auth/google';

  const setUser = useStore((state) => state.setUser);
  const setAccessToken = useStore((state) => state.setAccessToken);
  const addToast = useStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      addToast('error', decodeURIComponent(error));
    }
  }, [addToast, searchParams]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setUser(data.user);
      setAccessToken(data.accessToken);
      const targetPath = returnTo?.startsWith('/') ? returnTo : '/';
      router.replace(targetPath);
      addToast('success', 'Welcome back.');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  const signupHref = returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : '/signup';

  return (
    <AuthForm
      title="Welcome back"
      submitLabel="Sign in"
      loading={loading}
      onSubmit={submit}
      googleAuthHref={googleAuthHref}
      fields={{ email, setEmail, password, setPassword }}
      footer={
        <span>
          New to Celiz? <Link href={signupHref}>Create an account</Link>
        </span>
      }
    />
  );
}

function AuthForm({ title, submitLabel, loading, onSubmit, googleAuthHref, fields, footer }: { title: string; submitLabel: string; loading: boolean; onSubmit: (event: React.FormEvent) => void; googleAuthHref: string; fields: { email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void }; footer: React.ReactNode }) {
  return <div className="container" style={{ maxWidth: 520, padding: '4rem 1.25rem' }}><div className="auth-card"><h1>{title}</h1><p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 2rem' }}>Access your orders and faster checkout.</p><div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}><a href={googleAuthHref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: '#fff', color: '#1f2937', border: '1px solid #d1d5db', borderRadius: 999, padding: '0.8rem 1rem', fontWeight: 600, textDecoration: 'none' }}><Image src="/google-logo.png" alt="Google" width={18} height={18} style={{ display: 'block' }} />Continue with Google</a></div><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}><span style={{ flex: 1, height: 1, background: '#e5e7eb' }} /><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>or</span><span style={{ flex: 1, height: 1, background: '#e5e7eb' }} /></div><form onSubmit={onSubmit}><div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" required value={fields.email} onChange={(event) => fields.setEmail(event.target.value)} /></div><div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" required value={fields.password} onChange={(event) => fields.setPassword(event.target.value)} /></div><button className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? 'Signing in...' : submitLabel}</button></form><p style={{ marginTop: '1.5rem', textAlign: 'center' }}>{footer}</p></div></div>;
}