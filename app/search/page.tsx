import Link from 'next/link';
import { Search, RotateCcw } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { prisma } from '@/lib/prisma';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  if (!query) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <Search size={42} color="var(--accent-purple)" style={{ margin: '0 auto 1rem' }} />
        <h1>Search Celiz gadgets</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Enter a product, brand, or gadget category in the search bar above.
        </p>
        <Link href="/products" className="btn-primary" style={{ marginTop: '1.5rem' }}>
          Browse all products
        </Link>
      </div>
    );
  }

  let products;
  try {
    const rawProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { brand: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    products = rawProducts.map((product) => ({
      ...product,
      images: JSON.parse(product.images),
      specs: JSON.parse(product.specs),
      createdAt: product.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <h1>Search is temporarily unavailable</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>
          Please try again in a moment.
        </p>
        <Link href="/products" className="btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.25rem 5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Search results</div>
          <h1 style={{ marginTop: '0.35rem' }}>Results for &quot;{query}&quot;</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </p>
        </div>
        <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
          <RotateCcw size={16} /> Browse all products
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ background: 'var(--bg-white)', padding: '4rem 1.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2>No products found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0.6rem auto 1.5rem' }}>
            We couldn&apos;t find a product, brand, or category matching &quot;{query}&quot;. Try a shorter or different search term.
          </p>
          <Link href="/products" className="btn-primary">View all products</Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}