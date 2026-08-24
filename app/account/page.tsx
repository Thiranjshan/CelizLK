'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ArrowRight, KeyRound, LogOut, MapPin, Package, Settings, ShieldCheck, UserRound } from 'lucide-react';

const settingsLinks = [
  { href: '/account#profile', label: 'Profile details', description: 'Update your name and contact information', icon: UserRound },
  { href: '/account/addresses', label: 'Delivery addresses', description: 'Manage the addresses used at checkout', icon: MapPin },
  { href: '/account#security', label: 'Password & security', description: 'Keep your account access protected', icon: KeyRound },
];

export default function AccountPage() {
  const router = useRouter(); const user = useStore((state) => state.user); const logout = useStore((state) => state.logout); const [signingOut, setSigningOut] = useState(false);
  if (!user) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><h2>Sign in to view your account</h2><p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>Your orders and saved details will appear here.</p><Link className="btn-primary" href="/login">Sign in</Link></div>;
  async function signOut() { setSigningOut(true); try { await fetch('/api/auth/logout', { method: 'POST' }); } finally { logout(); router.push('/'); } }
  const initials = user.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <div className="container" style={{ maxWidth: 1040, padding: '3.5rem 1.25rem 5rem' }}>
    <div style={{ marginBottom: '2rem' }}><div style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Customer space</div><h1 style={{ fontSize: '2.5rem', marginTop: '0.35rem' }}>My account</h1><p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>Manage your Celiz profile, orders, and account security.</p></div>
    <section style={{ background: 'var(--brand-gradient)', borderRadius: 'var(--radius-lg)', padding: '2rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center', fontSize: '1.25rem', fontWeight: 900 }}>{initials}</div><div><div style={{ color: '#E9D5FF', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{user.role === 'ADMIN' ? 'Administrator' : 'Celiz customer'}</div><h2 style={{ color: 'white', marginTop: '0.15rem' }}>{user.fullName}</h2><div style={{ color: '#E2D9F3', marginTop: '0.15rem' }}>{user.email}</div></div></div>
      <button className="btn-secondary" onClick={signOut} disabled={signingOut} style={{ background: 'white', color: 'var(--primary-indigo)', border: 0 }}><LogOut size={17} /> {signingOut ? 'Signing out...' : 'Sign out'}</button>
    </section>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
      <Link href="/account/orders" style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ color: 'var(--accent-purple)', background: 'rgba(109, 40, 217, 0.1)', padding: '0.7rem', borderRadius: 'var(--radius-md)' }}><Package size={22} /></div><div style={{ flex: 1 }}><strong>Order history</strong><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Track your Celiz purchases</div></div><ArrowRight size={18} color="var(--text-muted)" /></Link>
      <Link href="/cart" style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ color: 'var(--success)', background: 'var(--success-bg)', padding: '0.7rem', borderRadius: 'var(--radius-md)' }}><ShieldCheck size={22} /></div><div style={{ flex: 1 }}><strong>Ready to checkout?</strong><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Review your current shopping bag</div></div><ArrowRight size={18} color="var(--text-muted)" /></Link>
    </div>
    <section style={{ marginTop: '2.5rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}><Settings size={20} color="var(--accent-purple)" /><h2 style={{ fontSize: '1.35rem' }}>Account settings</h2></div><div style={{ display: 'grid', gap: '0.75rem' }}>{settingsLinks.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><Icon size={20} color="var(--primary-indigo)" /><div style={{ flex: 1 }}><strong>{label}</strong><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>{description}</div></div><ArrowRight size={18} color="var(--text-muted)" /></Link>)}</div></section>
    <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', borderLeft: '3px solid var(--accent-purple)', background: 'rgba(109, 40, 217, 0.05)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Need help? <Link href="/contact" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>Contact Celiz support</Link> for order or delivery assistance.</div>
  </div>;
}