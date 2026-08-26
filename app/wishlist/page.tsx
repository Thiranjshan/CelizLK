'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/common/EmptyState';
import { ProductCardSkeleton } from '@/components/common/Skeleton';

export default function WishlistPage() {
  const wishlist = useStore((state) => state.wishlist);
  const hasHydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  if (!hasHydrated || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1.25rem 5rem' }}>
        <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
        <h1 style={{ marginBottom: '2rem' }}>My Wishlist</h1>
        <div className="products-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.25rem 5rem' }}>
      <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
        <ArrowLeft size={16} /> Continue Shopping
      </Link>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-headline)' }}>My Wishlist</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {error ? (
        <EmptyState
          icon={Heart}
          title="Something went wrong"
          description={error}
          actionText="Try Again"
          actionLink="/wishlist"
        />
      ) : wishlistedProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products to your wishlist and they will show up here so you can easily add them to your cart later."
          actionText="Explore Gadgets"
          actionLink="/products"
        />
      ) : (
        <div className="products-grid">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
