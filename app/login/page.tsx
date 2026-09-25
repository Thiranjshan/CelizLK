'use client';

import { Suspense, useState } from 'react';
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

  const setUser = useStore((state) => state.setUser);
  const setAccessToken = useStore((state) => state.setAccessToken);
  const addToast = useStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      fields={{ email, setEmail, password, setPassword }}
      footer={
        <span>
          New to Celiz? <Link href={signupHref}>Create an account</Link>
        </span>
      }
    />
  );
}

function AuthForm({ title, submitLabel, loading, onSubmit, fields, footer }: { title: string; submitLabel: string; loading: boolean; onSubmit: (event: React.FormEvent) => void; fields: { email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void }; footer: React.ReactNode }) {
  return <div className="container" style={{ maxWidth: 520, padding: '4rem 1.25rem' }}><div className="auth-card"><h1>{title}</h1><p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 2rem' }}>Access your orders and faster checkout.</p><form onSubmit={onSubmit}><div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" required value={fields.email} onChange={(event) => fields.setEmail(event.target.value)} /></div><div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" required value={fields.password} onChange={(event) => fields.setPassword(event.target.value)} /></div><button className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>{loading ? 'Signing in...' : submitLabel}</button></form><p style={{ marginTop: '1.5rem', textAlign: 'center' }}>{footer}</p></div></div>;
}