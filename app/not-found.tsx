import Link from 'next/link';
import { Compass, Home, ShoppingBag } from 'lucide-react';
import BackButton from '@/components/common/BackButton';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '5rem 1.25rem', maxWidth: 640, textAlign: 'center' }}>
      <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <BackButton fallbackHref="/" label="Go Back" />
      </div>

      <div
        style={{
          background: 'var(--bg-white)',
          padding: 'clamp(2rem, 5vw, 3.5rem) 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(109, 40, 217, 0.08)',
            color: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Compass size={36} />
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '0.85rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-purple)',
            marginBottom: '0.5rem',
          }}
        >
          404 Error
        </span>

        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-headline)' }}>
          Page Not Found
        </h1>

        <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          The page you are looking for doesn&apos;t exist, has been removed, or the link may be broken. Let&apos;s get you back on track!
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <Home size={18} />
            <span>Go to Homepage</span>
          </Link>

          <Link
            href="/products"
            className="btn-primary"
            style={{
              background: 'transparent',
              color: 'var(--primary-indigo)',
              border: '1px solid var(--border-color)',
              padding: '0.75rem 1.5rem',
            }}
          >
            <ShoppingBag size={18} />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
