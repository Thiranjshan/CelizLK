import Link from 'next/link';
import { Search, RotateCcw } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import ProductCard from '@/components/ProductCard';
import { prisma } from '@/lib/prisma';
import { ProductSearchResult, searchProducts } from '@/lib/product-search';
import Breadcrumbs from '@/components/common/Breadcrumbs';

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}

const PAGE_SIZE = 12;

function getPageHref(query: string, page: number): string {
  return `/search?q=${encodeURIComponent(query)}&page=${page}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page: pageParam } = await searchParams;
  const rawQuery = (Array.isArray(q) ? q[0] : q)?.trim() || '';
  const rawPage = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const parsedPage = Number.parseInt(rawPage || '1', 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const offset = (page - 1) * PAGE_SIZE;

  if (!rawQuery) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <div className="site-header-spacer" aria-hidden="true" />
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />
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

  let query = rawQuery;
  let products: ProductSearchResult[] = [];
  let total = 0;
  let searchFailed = false;

  if (process.env.SEARCH_MODE === 'legacy') {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: rawQuery } },
        { description: { contains: rawQuery } },
        { brandRecord: { name: { contains: rawQuery } } },
      ],
    };

    try {
      const [rawProducts, count] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: PAGE_SIZE,
          include: { category: true, brandRecord: true },
        }),
        prisma.product.count({ where }),
      ]);

      products = rawProducts.map((product) => ({
        ...product,
        brand: product.brandRecord,
        images: JSON.parse(product.images),
        createdAt: product.createdAt.toISOString(),
      }));
      total = count;
    } catch (error) {
      console.error('Error searching products:', error);
      searchFailed = true;
    }
  } else {
    const result = await searchProducts(rawQuery, { limit: PAGE_SIZE, offset });
    query = result.query;
    products = result.products;
    total = result.total;
    searchFailed = result.failed;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (!searchFailed && page > Math.max(1, totalPages)) {
    const lastPage = Math.max(1, totalPages);
    return <meta httpEquiv="refresh" content={`0;url=${getPageHref(query, lastPage)}`} />;
  }

  if (searchFailed) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <div className="site-header-spacer" aria-hidden="true" />
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />
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
      <div className="site-header-spacer" aria-hidden="true" />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Search' },
        { label: `Results for "${query}"` },
      ]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <div style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Search results</div>
          <h1 style={{ marginTop: '0.35rem' }}>Results for &quot;{query}&quot;</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {total} {total === 1 ? 'product' : 'products'} found
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

      {totalPages > 1 && (
        <nav aria-label="Search results pages" className="search-pagination">
          {page > 1 && <Link href={getPageHref(query, page - 1)} rel="prev">Previous</Link>}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={getPageHref(query, page + 1)} rel="next">Next</Link>}
        </nav>
      )}
    </div>
  );
}