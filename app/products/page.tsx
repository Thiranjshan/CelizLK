import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export const revalidate = 30;

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, brand, sort } = await searchParams;

  // Fetch categories for sidebar filter
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ]);

  // Build filter query
  const where: any = { isActive: true };
  if (category) {
    const selectedCat = categories.find((c) => c.slug === category);
    if (selectedCat) where.categoryId = selectedCat.id;
  }
  if (brand) {
    const selectedBrand = brands.find((item) => item.slug === brand);
    if (selectedBrand) where.brandId = selectedBrand.id;
  }

  let orderBy: any = { createdAt: 'desc' };
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
    <div className="container" style={{ padding: '3rem 1.25rem 5rem 1.25rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Product Catalog</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Browse our complete range of certified high-tech Sri Lanka gadgets
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Sidebar Filter */}
        <aside style={{ background: 'var(--bg-white)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            Categories
          </h3>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
            <li>
              <Link
                href="/products"
                style={{
                  fontWeight: !category ? 700 : 500,
                  color: !category ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontSize: '0.925rem',
                }}
              >
                All Products ({products.length})
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/products?category=${cat.slug}${brand ? `&brand=${brand}` : ''}`}
                  style={{
                    fontWeight: category === cat.slug ? 700 : 500,
                    color: category === cat.slug ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    fontSize: '0.925rem',
                  }}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            Brands
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <li>
              <Link
                href={`/products${category ? `?category=${category}` : ''}`}
                style={{
                  fontWeight: !brand ? 700 : 500,
                  color: !brand ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontSize: '0.925rem',
                }}
              >
                All Brands
              </Link>
            </li>
            {brands.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/products?brand=${item.slug}${category ? `&category=${category}` : ''}`}
                  style={{
                    fontWeight: brand === item.slug ? 700 : 500,
                    color: brand === item.slug ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    fontSize: '0.925rem',
                  }}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Product Grid */}
        <div>
          {/* Top Bar Sort & Count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--bg-white)', padding: '0.9rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Showing <strong>{products.length}</strong> items
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span>Sort by:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/products?${category ? `category=${category}&` : ''}${brand ? `brand=${brand}&` : ''}sort=newest`} style={{ fontWeight: sort === 'newest' || !sort ? 700 : 400, color: sort === 'newest' || !sort ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>Newest</Link> |
                <Link href={`/products?${category ? `category=${category}&` : ''}${brand ? `brand=${brand}&` : ''}sort=price-asc`} style={{ fontWeight: sort === 'price-asc' ? 700 : 400, color: sort === 'price-asc' ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>Price: Low to High</Link> |
                <Link href={`/products?${category ? `category=${category}&` : ''}${brand ? `brand=${brand}&` : ''}sort=price-desc`} style={{ fontWeight: sort === 'price-desc' ? 700 : 400, color: sort === 'price-desc' ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>Price: High to Low</Link>
              </div>
            </div>
          </div>

          {products.length === 0 ? (
            <div style={{ background: 'var(--bg-white)', padding: '4rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No products match your filter criteria</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Try clearing your category or brand selection.</p>
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
      </div>
    </div>
  );
}
