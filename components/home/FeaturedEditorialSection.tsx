'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { parseProductImages } from '@/lib/product-images';

interface FeaturedEditorialSectionProps {
  products: Product[];
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function FeaturedEditorialSection({ products = [] }: FeaturedEditorialSectionProps) {
  const displayItems = products.slice(0, 8).map((p) => {
    const images = Array.isArray(p.images)
      ? p.images
      : typeof p.images === 'string'
      ? parseProductImages(p.images)
      : [];

    return {
      id: p.id,
      name: p.name,
      category: p.brand?.name || p.category?.name || 'Curated Essential',
      description: p.description,
      price: p.discountPrice ?? p.price,
      slug: p.slug,
      image: images[0],
    };
  });

  if (!displayItems.length) return null;

  return (
    <section className="homepage-featured-section" id="featured-products">
      {/* Centered Dual-Style Section Heading */}
      <div className="homepage-section-heading">
        <p className="homepage-section-eyebrow">
          <span className="eyebrow-accent-line" />
          The Celiz Edit
          <span className="eyebrow-accent-line" />
        </p>
        <h2 className="homepage-section-title">
          <span className="title-lead">Featured</span>{' '}
          <span className="title-serif-accent">Products.</span>
        </h2>
        <p className="homepage-section-desc">
          Standout technology with the craftsmanship, capability, and longevity to earn a place in your day.
        </p>
      </div>

      <div className="homepage-featured-grid" role="region" aria-label="Featured products">
        {displayItems.map((item) => (
          <article className="featured-product-card" key={item.id}>
            <Link
              href={`/product/${item.slug}`}
              className="featured-product-media-link"
              aria-label={`View ${item.name}`}
            >
              {item.image && (
                <>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                  />
                  <div className="featured-product-overlay-gradient" />
                </>
              )}
              <span className="featured-product-arrow-btn" aria-hidden="true">
                <ArrowIcon />
              </span>
            </Link>

            <div className="featured-product-content">
              <div>
                <p className="featured-product-eyebrow">{item.category}</p>
                <h3 className="featured-product-title">{item.name}</h3>
                {item.description && <p className="featured-product-desc">{item.description}</p>}
              </div>
              <div className="featured-product-price-box">
                <p className="featured-product-price">
                  Rs. {item.price.toLocaleString()}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Centered Bottom CTA */}
      <div className="homepage-carousel-bottom-action">
        <Link href="/products?featured=true" className="homepage-carousel-cta-btn">
          <span>More Products?</span>
          <ArrowRight className="cta-arrow-icon" size={16} />
        </Link>
      </div>
    </section>
  );
}
