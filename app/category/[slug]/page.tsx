import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/common/Breadcrumbs';

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
     <div className="site-header-spacer" aria-hidden="true" />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Categories', href: '/categories' },
        { label: category.name },
      ]} />

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

      <div className="shop-all-result-count">
        Showing <strong>{products.length}</strong> items in <strong>{category.name}</strong>
      </div>
    </div>
  );
}
