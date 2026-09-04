import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/home/HeroCarousel';
import { Award, ShieldCheck, Truck, Headphones, MessageCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function HomePage() {
  // 1. Fetch Hero Banners from Database
  const banners = await prisma.heroBanner.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      imageUrl: true,
      buttonLabel: true,
      buttonLink: true,
    },
  });

  const carouselSlides = banners.map((banner) => ({
    id: banner.id,
    image: banner.imageUrl,
    buttonLabel: banner.buttonLabel,
    buttonLink: banner.buttonLink,
  }));

  // 2. Fetch Categories from DB
  const dbCategories = await prisma.category.findMany({
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { images: true },
      },
    },
  });
  
  // Keep the existing category descriptions while product images come from the catalog.
  const categoryLabels: Record<string, string> = {
    'earbuds': 'Earbuds & Headphones',
    'chargers': 'Fast charging essentials',
    'power-banks': 'Power for everyday',
    'smartwatches': 'Stay smart, stay connected',
    'accessories': 'Cases, holders & more',
  };

  const categories = dbCategories.map((cat) => {
    const productImages = cat.products[0]?.images;
    let image = '';
    try {
      const parsedImages = productImages ? JSON.parse(productImages) : [];
      image = Array.isArray(parsedImages) && typeof parsedImages[0] === 'string' ? parsedImages[0] : '';
    } catch {
      image = '';
    }

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image,
      desc: categoryLabels[cat.slug] || 'Explore Catalog',
    };
  }).filter((category) => category.image);

  // 3. Fetch New Arrivals (marked isNewArrival: true)
  let rawNewArrivals = await prisma.product.findMany({
    where: { isNewArrival: true, isActive: true },
    take: 3,
    include: { category: true, brandRecord: true },
  });

  // Fallback to latest products if none are marked isNewArrival
  if (rawNewArrivals.length === 0) {
    rawNewArrivals = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { category: true, brandRecord: true },
    });
  }

  const newArrivals = rawNewArrivals.map((p) => ({
    ...p,
    brand: p.brandRecord,
    images: JSON.parse(p.images),
    specs: JSON.parse(p.specs),
    createdAt: p.createdAt.toISOString(),
  }));

  // 4. Fetch Featured Products (marked isFeatured: true)
  const rawFeaturedProducts = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    take: 3,
    include: { category: true, brandRecord: true },
  });

  const featuredProducts = rawFeaturedProducts.map((p) => ({
    ...p,
    brand: p.brandRecord,
    images: JSON.parse(p.images),
    specs: JSON.parse(p.specs),
    createdAt: p.createdAt.toISOString(),
  }));

  const trustedBrands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    take: 12,
  });

  return (
    <div style={{ background: '#FFFFFF' }}>
      <div className="container">
        {/* Hero Carousel Banner Section */}
        <HeroCarousel slides={carouselSlides} />

        {/* Product merchandising sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', margin: '1rem 0 5rem' }} className="homepage-product-grid-wrapper">
          {/* New Arrivals */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-headline)' }}>New Arrivals</h2>
              <Link href="/products?sort=newest" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.9rem' }}>
                <span>View all</span>
                <ArrowRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* Featured Products */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-headline)' }}>Featured Products</h2>
              <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.9rem' }}>
                <span>View all</span>
                <ArrowRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>

         {/* Shop By Category Section */}
        <section style={{ padding: '3rem 0 4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-headline)' }}>Shop by Category</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Find high-performance gadgets tailored to your daily needs</p>
            </div>
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.9rem' }}>
              <span>View all</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="cat-card homepage-category-card">
                <img className="homepage-category-image" src={cat.image} alt={cat.name} />
                <h3 className="homepage-category-name">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </section>

       {/* Genuine products. Trusted brands. Section */}
<section
  style={{
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    marginBottom: '4rem',
  }}
>
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 2.5fr',
      gap: '3rem',
      alignItems: 'center',
    }}
    className="brands-trust-layout"
  >
    {/* Left side - KEEP AS IT IS */}
    <div>
      <h3
        style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: 'var(--text-headline)',
          lineHeight: 1.3,
        }}
      >
        Genuine products.
        <br />
        Trusted brands.
      </h3>

      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginTop: '0.75rem',
          lineHeight: 1.5,
        }}
      >
        We carefully source genuine products from trusted brands, giving you
        the confidence to shop with Celiz LK.
      </p>
    </div>

    {/* Right side - Logo Reel */}
    <div className="brands-logo-reel">
      <div className="brands-logo-track">
        <div className="brands-logo-group">
          {trustedBrands.map((brand) => <Link key={brand.id} href={`/products?brand=${brand.slug}`} aria-label={`Shop ${brand.name}`}>{brand.logoUrl ? <Image src={brand.logoUrl} alt={brand.name} width={90} height={50} /> : <span style={{ width: 90, textAlign: 'center', fontWeight: 700 }}>{brand.name}</span>}</Link>)}
        </div>
        <div className="brands-logo-group" aria-hidden="true">
          {trustedBrands.map((brand) => <Link key={brand.id} href={`/products?brand=${brand.slug}`} tabIndex={-1} aria-hidden="true">{brand.logoUrl ? <Image src={brand.logoUrl} alt="" width={90} height={50} /> : <span style={{ width: 90, textAlign: 'center', fontWeight: 700 }}>{brand.name}</span>}</Link>)}
        </div>
      </div>
    </div>
  </div>
</section>

        {/* Why Celiz LK Promos grid */}
        <section style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '3rem 0', marginBottom: '4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
              <div style={{ color: 'var(--accent-purple)', flexShrink: 0 }}><Award size={24} /></div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-headline)' }}>100% Genuine</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Original products with warranty</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
              <div style={{ color: 'var(--accent-purple)', flexShrink: 0 }}><Truck size={24} /></div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-headline)' }}>Islandwide Delivery</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Fast and secure courier service</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
              <div style={{ color: 'var(--accent-purple)', flexShrink: 0 }}><Headphones size={24} /></div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-headline)' }}>Trusted Support</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>WhatsApp & phone assistance</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
              <div style={{ color: 'var(--accent-purple)', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-headline)' }}>Secure Payments</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Multiple safe payment options</p>
              </div>
            </div>
          </div>
        </section>

        
      </div>
    </div>
  );
}
