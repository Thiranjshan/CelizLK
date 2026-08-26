import Link from 'next/link';
import { Award, ShieldCheck, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: '4rem 1.25rem 6rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '1.5rem', textAlign: 'center' }}>
        About Celiz LK
      </h1>
      <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem', lineHeight: 1.6 }}>
        Your trusted technology gadget partner in Sri Lanka. Sourcing only 100% genuine products with warranty, direct support, and secure delivery.
      </p>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', marginBottom: '4rem' }}>
        <h2 id="story" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '1rem' }}>
          Our Story
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem', fontSize: '0.95rem' }}>
          Founded in Sri Lanka, Celiz LK was born out of a simple need: to provide customers with a reliable, transparent, and premium destination for genuine technology gadgets and accessories. In a marketplace filled with duplicates and low-quality counterfeits, we set out to build a platform that values authenticity above all else.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
          Today, Celiz LK serves tech enthusiasts across the island, shipping wireless audio, GaN fast chargers, smartwatch wearables, and lifestyle gear directly to your doorstep. We are committed to maintaining a strict quality audit on all our items and backing them with authentic warranties.
        </p>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '2rem', textAlign: 'center' }}>
        Our Core Promises
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: '#FFFFFF' }}>
          <div style={{ color: 'var(--accent-purple)', marginBottom: '0.75rem', display: 'inline-flex' }}><ShieldCheck size={32} /></div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-headline)' }}>100% Genuine</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Every product is sourced directly from official manufacturers or authorized brand distributors.</p>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: '#FFFFFF' }}>
          <div style={{ color: 'var(--accent-purple)', marginBottom: '0.75rem', display: 'inline-flex' }}><Award size={32} /></div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-headline)' }}>Official Warranty</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Shop with absolute peace of mind. Every gadget carries an official local replacement warranty.</p>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: '#FFFFFF' }}>
          <div style={{ color: 'var(--accent-purple)', marginBottom: '0.75rem', display: 'inline-flex' }}><Heart size={32} /></div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-headline)' }}>Customer First</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Fast communication, direct WhatsApp support assistance, and a transparent refund process.</p>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/products" className="btn-primary" style={{ padding: '0.8rem 2rem' }}>
          Explore Our Products
        </Link>
      </div>
    </div>
  );
}
