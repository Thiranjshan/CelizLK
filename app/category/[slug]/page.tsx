import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/common/BackButton';

export const revalidate = 30;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const rawProducts = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    orderBy: [{ stockQty: 'desc' }, { createdAt: 'desc' }],
    include: { category: true, brandRecord: true },
  });

  const products = rawProducts.map((p) => ({
    ...p,
    brand: p.brandRecord,
    images: JSON.parse(p.images),
    specs: p.specs,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="container" style={{ padding: '3rem 1.25rem 5rem 1.25rem' }}>
      <BackButton label="Back" />

      <div style={{ background: 'var(--brand-gradient)', color: 'white', padding: '2.5rem 2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
        <h1 style={{ fontSize: '2.25rem', color: 'white', marginBottom: '0.5rem' }}>{category.name}</h1>
        <p style={{ color: '#D1D5DB', maxWidth: 650 }}>{category.description}</p>
      </div>

      <div style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
        Showing <strong>{products.length}</strong> items in <strong>{category.name}</strong>
      </div>

      {products.length === 0 ? (
        <div style={{ background: 'var(--bg-white)', padding: '4rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No products in this category yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Check back soon for new arrivals.</p>
          <Link href="/products" className="btn-primary">Browse Other Products</Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
