'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ShoppingBag, Zap, ShieldCheck, Truck, ArrowLeft, Check, Plus, Minus } from 'lucide-react';
import { Product } from '@/lib/types';
import { useStore } from '@/lib/store';
import ProductCard from '@/components/ProductCard';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

interface ProductSpecSection {
  title: string;
  points: string[];
}

function parseProductSpecs(specs: string): ProductSpecSection[] {
  try {
    const parsed = JSON.parse(specs) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>).map(([title, value]) => ({
        title: title.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
        points: Array.isArray(value)
          ? value.map((item) => String(item))
          : [String(value)],
      }));
    }
  } catch {
  }

  const sections: ProductSpecSection[] = [];
  const ungroupedPoints: string[] = [];
  let currentSection: ProductSpecSection | null = null;

  for (const rawLine of specs.split(/\r?\n/)) {
    const line = rawLine.trim();
    const heading = line.match(/^\*\*(.+?)\*\*$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);

    if (heading) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: heading[1].trim(), points: [] };
    } else if (bullet) {
      if (currentSection) currentSection.points.push(bullet[1].trim());
      else ungroupedPoints.push(bullet[1].trim());
    } else if (line) {
      if (currentSection) currentSection.points.push(line);
      else ungroupedPoints.push(line);
    }
  }

  if (currentSection) sections.push(currentSection);
  if (ungroupedPoints.length) sections.unshift({ title: 'Technical Specifications', points: ungroupedPoints });
  return sections;
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState('');
  const addToCart = useStore((state) => state.addToCart);
  const setBuyNowItem = useStore((state) => state.setBuyNowItem);
  const user = useStore((state) => state.user);

  const images = Array.isArray(product.images) ? product.images : [];
  const currentImage = images[selectedImageIndex] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleBuyNow = () => {
    if (quantity <= 0 || product.stockQty <= 0) {
      setStockError('This product is out of stock.');
      return;
    }
    setStockError('');

    setBuyNowItem({ product, quantity });

    const checkoutUrl = '/checkout?buyNow=1';
    if (user) {
      router.push(checkoutUrl);
    } else {
      router.push(`/login?returnTo=${encodeURIComponent(checkoutUrl)}`);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.25rem 5rem 1.25rem' }}>
      <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', marginBottom: '5rem', background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        {/* Left Column: Image Gallery */}
        <div>
          <div style={{ width: '100%', height: 420, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#F9FAFB', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <img src={currentImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: selectedImageIndex === idx ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                    opacity: selectedImageIndex === idx ? 1 : 0.6,
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Purchasing */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            {product.brand?.name || 'Gadget'} • {product.category?.name || 'Gadgets'}
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem', color: 'var(--primary-indigo)' }}>
            {product.name}
          </h1>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-light)',  borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-indigo)' }}>
              <span style={{ color: 'var(--accent-purple'}}>LKR</span> {(product.discountPrice ?? product.price).toLocaleString()}
            </span>
            {product.discountPrice && (
              <>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  LKR {product.price.toLocaleString()}
                </span>
                <span className="badge badge-cancelled" style={{ background: '#EF4444', color: 'white' }}>
                  Save {discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Stock availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span className="badge badge-paid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={14} /> In Stock ({product.stockQty} available)
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              • Eligible for Islandwide Fast Express Delivery
            </span>
          </div>

          <div className="product-markdown product-description">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{product.description}</ReactMarkdown>
          </div>

          {/* Quantity Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quantity:</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-white)' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '0.5rem 0.85rem', color: 'var(--text-secondary)' }}
              >
                <Minus size={16} />
              </button>
              <span style={{ fontWeight: 800, padding: '0 1rem', fontSize: '1.05rem' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ padding: '0.5rem 0.85rem', color: 'var(--text-secondary)' }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: stockError ? '0.75rem' : '2.5rem' }}>
            <button
              onClick={() => {
                if (quantity <= 0 || product.stockQty <= 0) {
                  setStockError('This product is out of stock.');
                  return;
                }
                setStockError('');
                addToCart(product, quantity);
              }}
              className="btn-add-cart"
              style={{ padding: '0.9rem', fontSize: '1rem' }}
            >
              <ShoppingBag size={18} />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={handleBuyNow}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '0.9rem', fontSize: '1rem' }}
            >
              <Zap size={18} />
              <span>Buy Now</span>
            </button>
          </div>

          {stockError && (
            <p role="alert" style={{ color: 'var(--error)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '2.5rem' }}>
              {stockError}
            </p>
          )}

          {/* Trust Guarantees */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={18} color="var(--success)" />
              <span><strong>100% Genuine Warranty:</strong> Official Celiz LK authentic product guarantee.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Truck size={18} color="var(--accent-purple)" />
              <span><strong>Express Shipping:</strong> Delivered in 1-3 business days across Sri Lanka.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      {product.specs && (
        <section className="product-specifications-section" style={{ marginBottom: '5rem' }}>

          <div className="product-markdown product-specifications">
            {parseProductSpecs(product.specs).map((section, sectionIndex) => (
              <div className="product-specification-row" key={`${section.title}-${sectionIndex}`}>
                <h3 >{section.title}</h3>
                <ul>
                  {section.points.map((point, pointIndex) => (
                    <li key={`${point}-${pointIndex}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }}>
                        {point}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            You May Also Like
          </h2>
          <div className="products-grid">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
