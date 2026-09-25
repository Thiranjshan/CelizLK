'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';

interface ProductCarouselProps {
  title: string;
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

export default function ProductCarousel({ title, viewAllHref, ctaHref, ctaLabel, products = [], tiles = [] }: ProductCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const hintPlayedRef = useRef(false);
  const hintingRef = useRef(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleHintRef = useRef<((delay: number) => void) | null>(null);
  const visibleProducts = products.slice(0, 10);
  const visibleTiles = tiles;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 6;
    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  }, []);

  function clearTimers() {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    hintTimerRef.current = null;
    animationFrameRef.current = null;
    inactivityTimerRef.current = null;
    hintingRef.current = false;
    if (viewportRef.current) {
      viewportRef.current.style.scrollSnapType = '';
    }
  }

  function markInteraction() {
    clearTimers();
    if (!visibleRef.current) return;

    inactivityTimerRef.current = setTimeout(() => {
      scheduleHintRef.current?.(0);
    }, 5000);
  }

  const scrollPrev = () => {
    markInteraction();
    if (!viewportRef.current) return;
    const card = viewportRef.current.querySelector<HTMLElement>('.homepage-product-carousel-card');
    const scrollAmount = card ? card.offsetWidth * 1.5 : 260;
    viewportRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollNext = () => {
    markInteraction();
    if (!viewportRef.current) return;
    const card = viewportRef.current.querySelector<HTMLElement>('.homepage-product-carousel-card');
    const scrollAmount = card ? card.offsetWidth * 1.5 : 260;
    viewportRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport || typeof IntersectionObserver === 'undefined') return;

    checkScrollability();

    const scheduleHint = (delay: number) => {
      if (!visibleRef.current || hintingRef.current || hintTimerRef.current) return;
      hintTimerRef.current = setTimeout(() => {
        hintTimerRef.current = null;
        if (!visibleRef.current || hintingRef.current) return;

        const originalPosition = viewport.scrollLeft;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        const distance = Math.min(36, Math.max(0, maxScroll));
        const targetPosition = originalPosition > distance
          ? originalPosition - distance
          : Math.min(maxScroll, originalPosition + distance);

        hintPlayedRef.current = true;
        if (targetPosition === originalPosition) return;

        hintingRef.current = true;
        viewport.style.scrollSnapType = 'none';
        const startedAt = performance.now();
        const leftDuration = 420;
        const returnStart = 260;
        const returnDuration = 500;
        const leftPositionAtReturn = originalPosition + (targetPosition - originalPosition) * (1 - Math.pow(1 - returnStart / leftDuration, 3));

        const animate = (now: number) => {
          if (!visibleRef.current || !hintingRef.current) return;
          const elapsed = now - startedAt;

          if (elapsed < returnStart) {
            const progress = elapsed / leftDuration;
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            viewport.scrollLeft = originalPosition + (targetPosition - originalPosition) * easedProgress;
          } else {
            const progress = Math.min(1, (elapsed - returnStart) / returnDuration);
            const easedProgress = progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            viewport.scrollLeft = leftPositionAtReturn + (originalPosition - leftPositionAtReturn) * easedProgress;
            if (progress >= 1) {
              viewport.scrollLeft = originalPosition;
              animationFrameRef.current = null;
              hintingRef.current = false;
              viewport.style.scrollSnapType = '';
              checkScrollability();
              return;
            }
          }

          animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      }, delay);
    };

    scheduleHintRef.current = scheduleHint;
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      clearTimers();
      if (entry.isIntersecting) {
        checkScrollability();
        scheduleHint(hintPlayedRef.current ? 5000 : 1200);
      }
    }, { threshold: 0.35 });

    observer.observe(section);
    return () => {
      observer.disconnect();
      clearTimers();
      scheduleHintRef.current = null;
      visibleRef.current = false;
    };
  }, [checkScrollability]);

  const actionHref = ctaHref ?? viewAllHref;
  const actionLabel = ctaLabel ?? (viewAllHref ? 'View all' : '');

  return (
    <section
      className="homepage-product-carousel"
      ref={sectionRef}
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
      onPointerDown={markInteraction}
      onPointerMove={markInteraction}
      onTouchStart={markInteraction}
      onWheel={markInteraction}
      onKeyDown={markInteraction}
    >
      <div className="homepage-product-carousel-heading">
        <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}>{title}</h2>
        <div className="homepage-product-carousel-actions">
          {actionHref && actionLabel ? (
            <Link href={actionHref} className="homepage-product-carousel-view-all">
              <span>{actionLabel}</span>
              <ArrowRight size={16} />
            </Link>
          ) : null}
          <div className="homepage-carousel-nav-group" aria-label={`${title} carousel controls`}>
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollLeft}
              className="homepage-carousel-nav-btn"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollRight}
              className="homepage-carousel-nav-btn"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <div
        className="homepage-product-carousel-viewport"
        ref={viewportRef}
        onScroll={() => {
          if (!hintingRef.current) markInteraction();
          checkScrollability();
        }}
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
    </section>
  );
}
