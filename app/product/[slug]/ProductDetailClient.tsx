'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Product } from '@/lib/types';
import { useStore } from '@/lib/store';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

interface ProductSpecSection {
  title: string;
  points: string[];
}

interface FeatureHighlight {
  value: string;
  title: string;
  description: string;
}

function Icon({
  name,
  size = 16,
  style,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const paths: Record<string, React.ReactNode> = {
    search: <path d="m14.5 14.5-3.2-3.2m1.2-4.05a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" />,
    user: (
      <>
        <circle cx="8" cy="5" r="2.5" />
        <path d="M3.5 14v-1.25A3.75 3.75 0 0 1 7.25 9h1.5a3.75 3.75 0 0 1 3.75 3.75V14" />
      </>
    ),
    bag: (
      <>
        <path d="M3 5.5h10l-.5 8h-9z" />
        <path d="M5.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
      </>
    ),
    arrow: <path d="M3 8h9m-3.5-3.5L12 8l-3.5 3.5" />,
    chevron: <path d="m6 4 4 4-4 4" />,
    minus: <path d="M3.5 8h9" />,
    plus: <path d="M8 3.5v9M3.5 8h9" />,
    check: <path d="m3.5 8.25 3 3 6-6.5" />,
    share: (
      <>
        <circle cx="4" cy="8" r="1.5" />
        <circle cx="12" cy="4" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <path d="m5.35 7.3 5.3-2.6m-5.3 4 5.3 2.6" />
      </>
    ),
    shield: (
      <>
        <path d="M8 1.75 13 3.8v3.7c0 3.15-2.05 5.65-5 6.75-2.95-1.1-5-3.6-5-6.75V3.8z" />
        <path d="m5.75 8 1.5 1.5 3-3" />
      </>
    ),
    delivery: (
      <>
        <path d="M1.5 4h8v7h-8zm8 2h2.5l2.5 2.5V11h-5z" />
        <circle cx="4" cy="12" r="1.25" />
        <circle cx="12" cy="12" r="1.25" />
      </>
    ),
    lock: (
      <>
        <rect height="7" rx="1" width="10" x="3" y="7" />
        <path d="M5.5 7V4.75a2.5 2.5 0 0 1 5 0V7" />
      </>
    ),
    support: (
      <>
        <path d="M2.5 9V7a5.5 5.5 0 0 1 11 0v2" />
        <path d="M4.5 8H3.3A1.3 1.3 0 0 0 2 9.3v1.4A1.3 1.3 0 0 0 3.3 12h1.2zm7 0h1.2A1.3 1.3 0 0 1 14 9.3v1.4a1.3 1.3 0 0 1-1.3 1.3h-1.2z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3">
        {paths[name]}
      </g>
    </svg>
  );
}

function parseProductSpecs(specs: string): ProductSpecSection[] {
  if (!specs) return [];
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

function extractFeatures(specs: string): {
  features: FeatureHighlight[];
  detailedSections: ProductSpecSection[];
} {
  const fallbackFeatures: FeatureHighlight[] = [
    { value: '10mm', title: 'Oversized drivers', description: 'Rich, balanced sound with deep bass' },
    { value: '32h', title: 'Total playtime', description: 'Listen longer with the compact charging case' },
    { value: '3 EQ', title: 'Signature modes', description: 'Soundcore, Bass Booster, and Podcast' },
    { value: '5.2', title: 'Bluetooth', description: 'Fast, stable pairing wherever you listen' },
  ];

  if (!specs) {
    return { features: fallbackFeatures, detailedSections: [] };
  }

  try {
    const parsed = JSON.parse(specs) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const extracted: FeatureHighlight[] = [];
      const remaining: ProductSpecSection[] = [];

      for (const [key, rawVal] of Object.entries(parsed)) {
        const lowerKey = key.toLowerCase();
        const strVal = String(rawVal);

        if (lowerKey.includes('driver')) {
          extracted.push({
            value: strVal.split(' ')[0] || strVal,
            title: 'Oversized drivers',
            description: strVal.includes(' ') ? strVal : 'Dynamic acoustic high-fidelity drivers',
          });
        } else if (lowerKey.includes('battery')) {
          extracted.push({
            value: strVal.endsWith('h') ? strVal : `${strVal}h`,
            title: 'Total playtime',
            description: 'Extended endurance with compact charging support',
          });
        } else if (lowerKey.includes('bluetooth') || lowerKey.includes('bt_')) {
          extracted.push({
            value: strVal.replace(/^v/, ''),
            title: 'Bluetooth',
            description: 'Fast, stable wireless pairing wherever you listen',
          });
        } else if (lowerKey.includes('water')) {
          extracted.push({
            value: strVal.split(' ')[0] || strVal,
            title: 'Water resistance',
            description: strVal.length > 5 ? strVal : 'Certified resistance against moisture and sweat',
          });
        } else if (lowerKey.includes('charging') || lowerKey.includes('power') || lowerKey.includes('watt')) {
          extracted.push({
            value: strVal.split(' ')[0] || 'Fast',
            title: 'Power delivery',
            description: strVal,
          });
        } else if (lowerKey.includes('anc')) {
          extracted.push({
            value: rawVal ? 'ANC' : 'Pure',
            title: 'Active noise cancelling',
            description: rawVal ? 'Dynamic background noise reduction' : 'Passive isolation acoustics',
          });
        } else {
          remaining.push({
            title: key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            points: Array.isArray(rawVal) ? rawVal.map(String) : [String(rawVal)],
          });
        }
      }

      if (extracted.length > 0) {
        return {
          features: extracted.slice(0, 4),
          detailedSections: remaining,
        };
      }
    }
  } catch {
  }

  const allSections = parseProductSpecs(specs);
  if (allSections.length > 0) {
    const extracted: FeatureHighlight[] = [];
    const remaining: ProductSpecSection[] = [];

    allSections.forEach((section) => {
      section.points.forEach((point) => {
        if (extracted.length < 4) {
          const match = point.match(/^([^:]+):\s*(.+)$/);
          if (match) {
            extracted.push({
              value: match[2].split(' ')[0] || '•',
              title: match[1].trim(),
              description: match[2].trim(),
            });
            return;
          }
        }
        remaining.push({ title: section.title, points: [point] });
      });
    });

    if (extracted.length >= 2) {
      return { features: extracted, detailedSections: remaining };
    }
    return { features: fallbackFeatures, detailedSections: allSections };
  }

  return { features: fallbackFeatures, detailedSections: [] };
}

function formatTitle(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstPart: name, lastPart: '' };
  }
  const splitIndex = Math.max(1, parts.length - 2);
  return {
    firstPart: parts.slice(0, splitIndex).join(' '),
    lastPart: parts.slice(splitIndex).join(' '),
  };
}

const thumbLabels = ['Front profile', 'Charging case', 'In the box', 'Side profile', 'Detailed view'];

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState('');

  const addToCart = useStore((state) => state.addToCart);
  const setBuyNowItem = useStore((state) => state.setBuyNowItem);
  const addToast = useStore((state) => state.addToast);
  const user = useStore((state) => state.user);

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1677346414290-d337cbc682a6?auto=format&fit=crop&w=1600&q=90'];

  const currentImage = images[selectedImageIndex] || images[0];

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const { firstPart, lastPart } = formatTitle(product.name);
  const { features, detailedSections } = extractFeatures(product.specs);

  const handleBuyNow = () => {
    if (quantity <= 0 || product.stockQty <= 0) {
      setStockError('This product is currently out of stock.');
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

  const handleAddToCart = () => {
    if (quantity <= 0 || product.stockQty <= 0) {
      setStockError('This product is currently out of stock.');
      return;
    }
    setStockError('');
    addToCart(product, quantity);
    addToast('success', `${product.name} added to your bag.`);
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} at Celiz LK`,
          url,
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      addToast('success', 'Product link copied to clipboard.');
    } catch {
      addToast('error', 'Unable to share or copy the product link.');
    }
  };

  return (
    
    <main className="pdp-page">
      <div className="site-header-spacer" aria-hidden="true" />
      {/* Ambient background glow */}
      <div className="product-glow" aria-hidden="true" />

      <div className="pdp-container">
        <Breadcrumbs
          className="pdp-breadcrumb"
          items={[
            { label: 'Home', href: '/' },
            {
              label: product.category?.name || 'Accessories',
              href: `/products?category=${encodeURIComponent(product.category?.slug || product.category?.name || '')}`,
            },
            { label: product.name },
          ]}
        />

        {/* Main Product Layout Grid */}
        <div className="pdp-main-grid">
          {/* Left Column: Image Gallery */}
          <div className="pdp-media-column">
            <div className="pdp-main-card group">
              <img
                src={currentImage}
                alt={product.name}
                className="pdp-main-image"
              />
              <span className="pdp-badge-top">
                {product.isFeatured ? 'Bestseller' : (discountPercent > 0 ? `Save ${discountPercent}%` : 'Authentic')}
              </span>
              <span className="pdp-badge-bottom">
                {images.length > 1 ? `Image ${selectedImageIndex + 1} of ${images.length}` : 'Tap to explore'}
              </span>
            </div>

            {/* Thumbnails strip */}
            {images.length > 1 && (
              <div className="pdp-thumbs-grid">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`pdp-thumb-btn ${selectedImageIndex === idx ? 'is-active' : ''}`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="pdp-thumb-image"
                    />
                    <span className="pdp-thumb-label">
                      {thumbLabels[idx] || `View ${idx + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details & Purchase Actions */}
          <div className="pdp-info-column">
            {/* Category / Brand Eyebrow */}
            <p className="pdp-eyebrow">
              <span className="pdp-eyebrow-line" />
              {product.brand?.name ? `${product.brand.name} · ` : ''}{product.category?.name || 'Wireless Audio'}
            </p>

            {/* Product Title & Share */}
            <div className="pdp-title-row">
              <h1 className="pdp-title">
                {firstPart}
                {lastPart && (
                  <>
                    <br />
                    <span className="pdp-title-accent">{lastPart}.</span>
                  </>
                )}
              </h1>
              <button
                type="button"
                onClick={handleShare}
                className="pdp-share-btn"
                aria-label={`Share ${product.name}`}
                title="Share product"
              >
                <Icon name="share" size={18} />
              </button>
            </div>

            {/* Description */}
            <div className="pdp-description">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {product.description}
              </ReactMarkdown>
            </div>

            {/* Pricing */}
            <div className="pdp-price-row">
              <p className="pdp-price-current">
                LKR {(product.discountPrice ?? product.price).toLocaleString()}
              </p>
              {product.discountPrice && (
                <>
                  <p className="pdp-price-original">
                    LKR {product.price.toLocaleString()}
                  </p>
                  <span className="pdp-price-badge">
                    Save {discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock Availability */}
            <div className="pdp-stock-row">
              {product.stockQty > 0 ? (
                <>
                  <span className="pdp-stock-badge-in">
                    <Icon name="check" size={14} />
                    In stock
                  </span>
                  <span className="pdp-stock-note">
                    {product.stockQty} available · Ready to dispatch
                  </span>
                </>
              ) : (
                <span className="pdp-stock-badge-out">
                  Out of stock
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="pdp-qty-section">
              <p className="pdp-qty-label">Select quantity</p>
              <div className="pdp-qty-pill">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((curr) => Math.max(1, curr - 1))}
                  className="pdp-qty-btn"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="pdp-qty-num">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stockQty}
                  onClick={() => setQuantity((curr) => curr + 1)}
                  className="pdp-qty-btn"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pdp-actions-grid">
              <button
                type="button"
                onClick={handleAddToCart}
                className="pdp-btn-cart"
              >
                Add to bag
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="pdp-btn-buy"
              >
                Buy now
                <span className="arrow-icon">
                  <Icon name="arrow" size={16} />
                </span>
              </button>
            </div>

            {stockError && (
              <p role="alert" className="pdp-stock-error">
                {stockError}
              </p>
            )}

            {/* Trust Guarantees */}
            <div className="pdp-trust-grid">
              <div className="pdp-trust-item">
                <span className="pdp-trust-icon"><Icon name="shield" size={20} /></span>
                <div>
                  <p className="pdp-trust-title">Genuine guarantee</p>
                  <p className="pdp-trust-desc">Authentic product with official warranty.</p>
                </div>
              </div>
              <div className="pdp-trust-item">
                <span className="pdp-trust-icon"><Icon name="delivery" size={20} /></span>
                <div>
                  <p className="pdp-trust-title">Express delivery</p>
                  <p className="pdp-trust-desc">1–3 business days across Sri Lanka.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Technical Specifications */}
      {product.specs && (
        <section className="product-specifications-section" style={{ marginBottom: '5rem' }}>

          <div className="product-markdown product-specifications">
            <h1 className="product-specifications-title"> More About This Product</h1>
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
        <section className="pdp-related-section" id="related">
          <div className="pdp-related-header">
            <div>
              <p className="pdp-related-eyebrow">Complete your setup</p>
              <h2 className="pdp-related-heading">You may also like</h2>
            </div>
            <Link href="/products" className="pdp-related-shopall">
              Shop all <Icon name="arrow" size={14} />
            </Link>
          </div>

          <div className="pdp-related-grid">
            {relatedProducts.map((relProduct) => {
              const relImages = Array.isArray(relProduct.images) ? relProduct.images : [];
              const relImage = relImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';

              return (
                <article className="group" key={relProduct.id}>
                  <Link
                    href={`/product/${relProduct.slug}`}
                    className="pdp-related-card-media"
                  >
                    <img
                      src={relImage}
                      alt={relProduct.name}
                      className="pdp-related-card-img"
                      loading="lazy"
                    />
                    <span className="pdp-related-card-btn" aria-hidden="true">
                      <Icon name="arrow" size={16} />
                    </span>
                  </Link>
                  <div className="pdp-related-card-meta">
                    <div>
                      <p className="pdp-related-card-cat">{relProduct.category?.name || 'Audio'}</p>
                      <h3 className="pdp-related-card-name">{relProduct.name}</h3>
                    </div>
                    <p className="pdp-related-card-price">
                      LKR {(relProduct.discountPrice ?? relProduct.price).toLocaleString()}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
