import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import BackButton from '@/components/common/BackButton';

export const revalidate = 30;

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug, isActive: true } });

  if (!brand) notFound();

  const rawProducts = await prisma.product.findMany({
    where: { brandId: brand.id, isActive: true },
    orderBy: [{ stockQty: 'desc' }, { createdAt: 'desc' }],
    include: { category: true, brandRecord: true },
  });

  const products = rawProducts.map((product) => ({
    ...product,
    brand: product.brandRecord,
    images: JSON.parse(product.images),
    specs: product.specs,
    createdAt: product.createdAt.toISOString(),
  }));

  return (
    <div className="container collection-page">
      <BackButton label="Back" />
      <div className="collection-heading">
        <h1>{brand.name}</h1>
        <p>Showing <strong>{products.length}</strong> products from {brand.name}</p>
      </div>
      {products.length === 0 ? (
        <div className="collection-empty">
          <h3>No products in this brand yet</h3>
          <p>Check back soon for new products.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}