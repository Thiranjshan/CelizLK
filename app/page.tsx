import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, Truck, Headphones, Award, ArrowRight, Zap, HeadphonesIcon, BatteryCharging, Watch, Cable } from 'lucide-react';

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function HomePage() {
  // Fetch featured products and categories
  const rawFeaturedProducts = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    take: 8,
    include: { category: true },
  });

  const featuredProducts = rawFeaturedProducts.map((p) => ({
    ...p,
    images: JSON.parse(p.images),
    specs: JSON.parse(p.specs),
    createdAt: p.createdAt.toISOString(),
  }));

  const categories = [
    { name: 'Wireless Earbuds', slug: 'earbuds', icon: HeadphonesIcon, desc: 'ANC & TWS Bluetooth audio' },
    { name: 'Fast Chargers', slug: 'chargers', icon: Zap, desc: '65W GaN & PD Power Adapters' },
    { name: 'Power Banks', slug: 'power-banks', icon: BatteryCharging, desc: '10,000 to 30,000 mAh' },
    { name: 'Smartwatches', slug: 'smartwatches', icon: Watch, desc: 'AMOLED & Fitness Trackers' },
    { name: 'Accessories', slug: 'accessories', icon: Cable, desc: 'Cables, Mounts & Cases' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              
              <h1>
                Upgrade Your Tech with <span>Premium Gadgets</span>
              </h1>
              <p>
                Discover authentic wireless earbuds, ultra-fast GaN chargers, long-lasting power banks, and stylish smartwatches — delivered islandwide in Sri Lanka with trusted warranty.
              </p>

              <div className="hero-cta-group">
                <Link href="/products" className="btn-primary">
                  <span>Explore Catalog</span>
                  <ArrowRight size={18} />
                </Link>
                
              </div>
            </div>

            <div className="hero-image-card">
              <img
                src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop"
                alt="Celiz LK Featured SoundPulse Pro ANC Earbuds"
              />
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: 'rgba(15, 10, 31, 0.85)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#C084FC', fontWeight: 700, textTransform: 'uppercase' }}>Featured Arrival</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>Celiz SoundPulse Pro ANC</div>
                </div>
                <div style={{ background: 'var(--accent-purple)', padding: '0.35rem 0.85rem', borderRadius: 8, fontWeight: 800, fontSize: '0.9rem' }}>
                  LKR 11,990
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section className="trust-bar">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon"><Award size={22} /></div>
              <div>
                <div className="trust-title">100% Authentic</div>
                <div className="trust-desc">Genuine tech gadgets with warranty</div>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon"><Truck size={22} /></div>
              <div>
                <div className="trust-title">Fast & Safe Delivery</div>
                <div className="trust-desc">Islandwide courier service</div>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon"><Headphones size={22} /></div>
              <div>
                <div className="trust-title">Trusted Support</div>
                <div className="trust-desc">Direct WhatsApp & phone assistance</div>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon"><ShieldCheck size={22} /></div>
              <div>
                <div className="trust-title">Secure Payments</div>
                <div className="trust-desc">PayHere card + Cash on Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section style={{ padding: '4rem 0 2rem 0' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <div className="section-subtitle">Find high-performance gadgets tailored to your daily needs</div>
            </div>
          </div>

          <div className="cat-card-grid">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <Link key={cat.slug} href={`/category/${cat.slug}`} className="cat-card">
                  <div className="cat-icon">
                    <IconComp size={24} />
                  </div>
                  <div>
                    <div className="cat-name">{cat.name}</div>
                    <div className="cat-desc">{cat.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section style={{ padding: '3rem 0 5rem 0' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Tech Gadgets</h2>
              <div className="section-subtitle">Hand-picked top sellers with limited-time discount pricing</div>
            </div>

            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
              <span>View All Products</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Special Promotional Banner */}
      <section className="container" style={{ marginBottom: '5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #150726 0%, #3B0A6B 100%)', borderRadius: 20, padding: '3.5rem 2.5rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', boxShadow: 'var(--shadow-lg)' }}>
          <div>
            <span style={{ background: 'var(--accent-purple)', padding: '0.3rem 0.8rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 800 }}>PROMO OFFER</span>
            <h3 style={{ fontSize: '2.2rem', color: 'white', margin: '0.75rem 0 0.5rem 0' }}>Celiz NitroCharge 65W GaN Charger</h3>
            <p style={{ color: '#D1D5DB', maxWidth: 520, fontSize: '1rem' }}>
              Power up your laptop, phone, and tablet simultaneously. Compact, ultra-safe, and 3x faster than standard brick chargers.
            </p>
          </div>
          <div>
            <Link href="/product/celiz-nitrocharge-65w-gan-fast-charger" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}>
              <span>Order Now for LKR 7,490</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
