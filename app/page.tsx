import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/home/HeroCarousel';
import { Award, ShieldCheck, Truck, Headphones, MessageCircle, ArrowRight } from 'lucide-react';

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function HomePage() {
  // 1. Fetch Carousel Slides (Data-driven list of slide objects)
  const carouselSlides = [
    {
      id: 'soundcore-liberty-4-nc',
      label: 'NEW ARRIVAL',
      title: 'Soundcore Liberty 4 NC',
      description: 'Advanced noise cancelling. Premium sound. All day comfort.',
      image: '/soundcore-liberty-4-nc.jpg',
      buttonText: 'Shop Now',
      buttonLink: '/category/earbuds',
    },
    {
      id: 'nitrocharge-65w',
      label: 'PROMO OFFER',
      title: 'Celiz NitroCharge 65W GaN',
      description: 'Power up your laptop, phone, and tablet simultaneously. Compact, ultra-safe, and 3x faster than standard brick chargers.',
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop',
      buttonText: 'Order Now',
      buttonLink: '/product/celiz-nitrocharge-65w-gan-fast-charger',
    },
    {
      id: 'vector-horizon',
      label: 'FEATURED PRODUCT',
      title: 'Celiz Vector Horizon AMOLED',
      description: 'Vibrant always-on AMOLED screen, bluetooth calls, 24/7 fitness tracker, and 10-day battery life.',
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop',
      buttonText: 'Explore Wearable',
      buttonLink: '/product/celiz-vector-horizon-amoled-smartwatch',
    }
  ];

  // 2. Fetch Categories from DB
  const dbCategories = await prisma.category.findMany();
  
  // Category mapping for premium Unsplash imagery and sublabels
  const categoryMap: Record<string, { image: string; label: string }> = {
    'earbuds': { 
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop', 
      label: 'Earbuds & Headphones' 
    },
    'chargers': { 
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop', 
      label: 'Fast charging essentials' 
    },
    'power-banks': { 
      image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=800&auto=format&fit=crop', 
      label: 'Power for everyday' 
    },
    'smartwatches': { 
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop', 
      label: 'Stay smart, stay connected' 
    },
    'accessories': { 
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800&auto=format&fit=crop', 
      label: 'Cases, holders & more' 
    },
  };

  const categories = dbCategories.map((cat) => {
    const details = categoryMap[cat.slug] || {
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
      label: 'Explore Catalog'
    };
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: details.image,
      desc: details.label,
    };
  });

  // 3. Fetch New Arrivals (marked isNewArrival: true)
  let rawNewArrivals = await prisma.product.findMany({
    where: { isNewArrival: true, isActive: true },
    take: 3,
    include: { category: true },
  });

  // Fallback to latest products if none are marked isNewArrival
  if (rawNewArrivals.length === 0) {
    rawNewArrivals = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { category: true },
    });
  }

  const newArrivals = rawNewArrivals.map((p) => ({
    ...p,
    images: JSON.parse(p.images),
    specs: JSON.parse(p.specs),
    createdAt: p.createdAt.toISOString(),
  }));

  // 4. Fetch Featured Products (marked isFeatured: true)
  const rawFeaturedProducts = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    take: 3,
    include: { category: true },
  });

  const featuredProducts = rawFeaturedProducts.map((p) => ({
    ...p,
    images: JSON.parse(p.images),
    specs: JSON.parse(p.specs),
    createdAt: p.createdAt.toISOString(),
  }));

  // Trusted brands display values
  const trustedBrands = [
    'ANKER', 'soundcore', 'DJI', 'SAMSUNG', 'baseus', 'UGREEN',
    'hoco.', 'JOYROOM', 'oraimo', 'REMAX', 'WIWU'
  ];

  return (
    <div style={{ background: '#FFFFFF' }}>
      <div className="container">
        {/* Hero Carousel Banner Section */}
        <HeroCarousel slides={carouselSlides} />

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
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="cat-card" style={{ background: 'var(--bg-surface)' }}>
                <div style={{ width: '100%', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-headline)' }}>{cat.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{cat.desc}</p>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '1.1rem' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

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

        {/* Genuine products. Trusted brands. Section */}
        <section style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', marginBottom: '4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr', gap: '3rem', alignItems: 'center' }} className="brands-trust-layout">
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-headline)', lineHeight: 1.3 }}>Genuine products.<br />Trusted brands.</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                We carefully source genuine products from trusted brands, giving you the confidence to shop with Celiz LK.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem 2.5rem', alignItems: 'center', justifyContent: 'center' }}>
              {trustedBrands.map((brand) => (
                <span 
                  key={brand} 
                  style={{ fontSize: '1.15rem', fontWeight: 900, color: '#D4D4D8', letterSpacing: '0.05em', textTransform: 'uppercase', fontStyle: 'italic' }}
                >
                  {brand}
                </span>
              ))}
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
