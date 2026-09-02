'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { BarChart3, Boxes, ClipboardList, LayoutGrid, LogOut, Package, ShieldCheck, Tag, Users } from 'lucide-react';

export interface AdminSession { id: string; email: string; name: string; role: string; }

export default function AdminAuthGate({ children, active }: { children: (session: AdminSession, token: string) => ReactNode; active: string }) {
  const [session, setSession] = useState<{ admin: AdminSession; token: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/refresh', { method: 'POST' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => result && setSession({ admin: result.admin, token: result.accessToken }))
      .catch(() => undefined);
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      setSession({ admin: result.admin, token: result.accessToken });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in.'); } finally { setLoading(false); }
  }

  async function logout() { await fetch('/api/admin/auth/logout', { method: 'POST' }); setSession(null); }

  if (!session) return <main className="admin-shell"><div className="admin-login"><div className="admin-kicker">CeliZ LK operations</div><h1>Admin sign in</h1><p>Secure access to store operations.</p><form onSubmit={login}><label>Email<input name="email" type="email" required autoComplete="username" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" /></label>{error && <div className="admin-error" role="alert">{error}</div>}<button className="btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign in securely'}</button></form></div></main>;

  const links = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: LayoutGrid },
    { href: '/admin/brands', label: 'Brands', icon: Tag },
    { href: '/admin/hero-banners', label: 'Hero Banners', icon: LayoutGrid },
    { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
    { href: '/admin/customers', label: 'Customers', icon: Users },
  ];
  return <main className="admin-shell"><div className="admin-layout"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><ShieldCheck size={21} /> CELIZ LK <span>ADMIN</span></Link><nav>{links.map(({ href, label, icon: Icon }) => <Link key={href} className={active === label.toLowerCase() ? 'active' : ''} href={href}><Icon size={18} /> {label}</Link>)}</nav><button className="admin-logout" onClick={logout}><LogOut size={17} /> Sign out</button></aside><section className="admin-content">{children(session.admin, session.token)}</section></div></main>;
}