import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import ProductCard from '@/components/ProductCard';
import ProductFilterDropdowns from '@/components/ProductFilterDropdowns';
import Link from 'next/link';

export const revalidate = 30;

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string | string[];
    brand?: string | string[];
    sort?: string;
    featured?: string;
    newArrivals?: string;
  }>;
}

function normalizeValues(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function buildProductsUrl({
  category,
  brand,
  sort,
  featured,
  newArrivals,
}: {
  category?: string[];
  brand?: string[];
  sort?: string;
  featured?: string;
  newArrivals?: string;
}) {
  const searchParams = new URLSearchParams();

  category?.forEach((slug) => searchParams.append('category', slug));
  brand?.forEach((slug) => searchParams.append('brand', slug));
  if (sort) searchParams.set('sort', sort);
  if (featured) searchParams.set('featured', featured);
  if (newArrivals) searchParams.set('newArrivals', newArrivals);

  const queryString = searchParams.toString();
  return queryString ? `/products?${queryString}` : '/products';
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, brand, sort, featured, newArrivals } = await searchParams;
  const selectedCategories = normalizeValues(category);
  const selectedBrands = normalizeValues(brand);
  const isFeaturedView = featured === 'true';
  const isNewArrivalView = newArrivals === 'true';
  const showSidebar = !isFeaturedView && !isNewArrivalView;

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ]);

  const selectedCategoryIds = selectedCategories.length
    ? categories.filter((item) => selectedCategories.includes(item.slug)).map((item) => item.id)
    : [];
  const selectedBrandIds = selectedBrands.length
    ? brands.filter((item) => selectedBrands.includes(item.slug)).map((item) => item.id)
    : [];

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (selectedCategoryIds.length) where.categoryId = { in: selectedCategoryIds };
  if (selectedBrandIds.length) where.brandId = { in: selectedBrandIds };
  if (isFeaturedView) where.isFeatured = true;
  if (isNewArrivalView) where.isNewArrival = true;

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'price-asc') orderBy = { price: 'asc' };
  if (sort === 'price-desc') orderBy = { price: 'desc' };

  const rawProducts = await prisma.product.findMany({
    where,
    orderBy,
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
    <div className="container shop-all-page">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>
          {isFeaturedView ? 'Featured Products' : isNewArrivalView ? 'New Arrivals' : 'Product Catalog'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Browse our complete range of certified high-tech Sri Lanka gadgets
        </p>
      </div>

      <div className="shop-all-toolbar">
        {showSidebar ? (
          <div className="shop-all-filter-panel">
            <ProductFilterDropdowns
              categories={categories}
              brands={brands}
              selectedCategories={selectedCategories}
              selectedBrands={selectedBrands}
              sort={sort}
              featured={featured}
              newArrivals={newArrivals}
            />
            {(selectedCategories.length || selectedBrands.length) && (
              <Link href="/products" className="shop-all-clear-link">Reset</Link>
            )}
          </div>
        ) : null}

        <div className="shop-all-sort-bar">
          <div className="shop-all-result-count">
            Showing <strong>{products.length}</strong> items
          </div>

          <div className="shop-all-sort-links">
            <span>Sort by:</span>
            <div className="shop-all-sort-list">
              <Link
                href={buildProductsUrl({ category: selectedCategories, brand: selectedBrands, sort: 'newest', featured: isFeaturedView ? 'true' : undefined, newArrivals: isNewArrivalView ? 'true' : undefined })}
                className={sort === 'newest' || !sort ? 'active' : ''}
              >
                Newest
              </Link>
              <span>| Price: </span>
              <Link
                href={buildProductsUrl({ category: selectedCategories, brand: selectedBrands, sort: 'price-asc', featured: isFeaturedView ? 'true' : undefined, newArrivals: isNewArrivalView ? 'true' : undefined })}
                className={sort === 'price-asc' ? 'active' : ''}
              >
                Low to High
              </Link>
              <span>:</span>
              <Link
                href={buildProductsUrl({ category: selectedCategories, brand: selectedBrands, sort: 'price-desc', featured: isFeaturedView ? 'true' : undefined, newArrivals: isNewArrivalView ? 'true' : undefined })}
                className={sort === 'price-desc' ? 'active' : ''}
              >
                High to Low
              </Link>
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="collection-empty">
          <h3>No products match your filter criteria</h3>
          <p>Try clearing your category or brand selection.</p>
          <Link href="/products" className="btn-primary">View All Products</Link>
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
