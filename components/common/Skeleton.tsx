import React from 'react';

export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{
        background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite linear',
        borderRadius: '4px',
        ...style
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card" style={{ border: '1px solid var(--border-color)', padding: 0 }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
        <Skeleton style={{ width: '80%', height: '80%', borderRadius: '8px' }} />
      </div>
      <div className="product-info" style={{ padding: '1.25rem' }}>
        <Skeleton style={{ width: '30%', height: '12px', marginBottom: '0.5rem' }} />
        <Skeleton style={{ width: '90%', height: '16px', marginBottom: '0.4rem' }} />
        <Skeleton style={{ width: '60%', height: '16px', marginBottom: '1rem' }} />
        <Skeleton style={{ width: '50%', height: '20px', marginBottom: '1rem' }} />
        <Skeleton style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="cat-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton style={{ width: '100%', height: '120px', borderRadius: '6px' }} />
      <Skeleton style={{ width: '60%', height: '16px' }} />
      <Skeleton style={{ width: '80%', height: '12px' }} />
    </div>
  );
}

export function CarouselSkeleton() {
  return (
    <div style={{ background: '#F7F7F8', height: '480px', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '3rem', gap: '2rem', margin: '2rem 0' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Skeleton style={{ width: '20%', height: '14px' }} />
        <Skeleton style={{ width: '80%', height: '48px' }} />
        <Skeleton style={{ width: '60%', height: '20px' }} />
        <Skeleton style={{ width: '30%', height: '44px', borderRadius: '8px', marginTop: '1.5rem' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Skeleton style={{ width: '80%', height: '300px', borderRadius: '12px' }} />
      </div>
    </div>
  );
}
