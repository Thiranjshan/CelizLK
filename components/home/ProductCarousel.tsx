'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';
import useAutoAdvanceScroll from '@/components/common/useAutoAdvanceScroll';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  viewAllHref?: string;
  ctaHref?: string;
  ctaLabel?: string;
  products?: Product[];
  tiles?: CarouselTile[];
}

export interface CarouselTile {
  id: string;
  name: string;
  image: string;
  href: string;
  kind?: 'category' | 'brand';
  showName?: boolean;
  isShopAll?: boolean;
}

function renderDualTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    return <span className="title-lead">{title}</span>;
  }
  const firstPart = words.slice(0, words.length - 1).join(' ');
  const lastWord = words[words.length - 1];
  return (
    <>
      <span className="title-lead">{firstPart}</span>{' '}
      <span className="title-serif-accent">{lastWord}</span>
    </>
  );
}

export default function ProductCarousel({ title, subtitle, eyebrow, viewAllHref, ctaHref, ctaLabel, products = [], tiles = [] }: ProductCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  useAutoAdvanceScroll(viewportRef, '.homepage-product-carousel-card');
  const visibleProducts = products.slice(0, 10);
  const visibleTiles = tiles;

  let defaultActionLabel = 'View All';
  const lower = title.toLowerCase();
  if (lower.includes('collection') || lower.includes('categor')) {
    defaultActionLabel = 'More Categories?';
  } else if (lower.includes('just in') || lower.includes('arrival')) {
    defaultActionLabel = 'More New Arrivals?';
  } else if (lower.includes('feature') || lower.includes('product')) {
    defaultActionLabel = 'More Products?';
  }

  const actionHref = ctaHref ?? viewAllHref;
  const actionLabel = ctaLabel ?? (actionHref ? defaultActionLabel : '');

  return (
    <section
      className="homepage-product-carousel"
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
    >
      <div className="homepage-product-carousel-heading">
        {eyebrow && (
          <span className="homepage-carousel-eyebrow">
            <span className="eyebrow-accent-line" />
            {eyebrow}
            <span className="eyebrow-accent-line" />
          </span>
        )}
        <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="homepage-carousel-title">
          {renderDualTitle(title)}
        </h2>
        {subtitle && <p className="homepage-carousel-subheading">{subtitle}</p>}
      </div>
      <div
        className="homepage-product-carousel-viewport"
        ref={viewportRef}
        tabIndex={0}
        aria-label={`Scrollable ${title} products`}
      >
        <div className="homepage-product-carousel-track">
          {visibleProducts.length > 0
            ? visibleProducts.map((product) => (
              <div className="homepage-product-carousel-card" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))
            : visibleTiles.map((tile) => {
              const isCategoryTile = tile.kind === 'category';
              const isBrandTile = tile.kind === 'brand';
              const isShopAllTile = Boolean(tile.isShopAll);

              return (
                <div
                  className={`homepage-product-carousel-card homepage-tile-carousel-card ${isBrandTile ? 'homepage-brand-tile-carousel-card' : ''} ${isCategoryTile ? 'homepage-category-tile-carousel-card' : ''} ${isShopAllTile ? 'homepage-shop-all-tile-carousel-card' : ''}`}
                  key={tile.id}
                >
                  <Link
                    href={tile.href}
                    className={`homepage-tile-carousel-link ${isBrandTile ? 'homepage-brand-tile-carousel-link' : ''} ${isCategoryTile ? 'homepage-category-tile-carousel-link' : ''} ${isShopAllTile ? 'homepage-shop-all-tile-carousel-link' : ''}`}
                  >
                    <span className="homepage-tile-carousel-image">
                      <img src={tile.image} alt={tile.name} loading="lazy" />
                    </span>
                    {tile.showName !== false ? (
                      <>
                        <strong>{tile.name}</strong>
                        {isShopAllTile ? <span className="homepage-shop-all-tile-explore">Explore</span> : null}
                      </>
                    ) : null}
                  </Link>
                </div>
              );
            })}
        </div>
      </div>

      {actionHref && actionLabel ? (
        <div className="homepage-carousel-bottom-action">
          <Link href={actionHref} className="homepage-carousel-cta-btn">
            <span>{actionLabel}</span>
            <ArrowRight className="cta-arrow-icon" size={16} />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
