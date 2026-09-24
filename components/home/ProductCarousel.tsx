'use client';

import { useRef } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

  function clearTimers() {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    hintTimerRef.current = null;
    animationFrameRef.current = null;
    inactivityTimerRef.current = null;
    hintingRef.current = false;
  }

  function markInteraction() {
    clearTimers();
    if (!visibleRef.current) return;

    inactivityTimerRef.current = setTimeout(() => {
      scheduleHintRef.current?.(0);
    }, 5000);
  }

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport || typeof IntersectionObserver === 'undefined') return;

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
      if (entry.isIntersecting) scheduleHint(hintPlayedRef.current ? 5000 : 1200);
    }, { threshold: 0.35 });

    observer.observe(section);
    return () => {
      observer.disconnect();
      clearTimers();
      scheduleHintRef.current = null;
      visibleRef.current = false;
    };
  }, []);

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
        {actionHref && actionLabel ? (
          <div className="homepage-product-carousel-actions">
            <Link href={actionHref} className="homepage-product-carousel-view-all">
              <span>{actionLabel}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}
      </div>
      <div className="homepage-product-carousel-viewport" ref={viewportRef} onScroll={() => { if (!hintingRef.current) markInteraction(); }} tabIndex={0} aria-label={`Scrollable ${title} products`}>
        <div className="homepage-product-carousel-track">
          {visibleProducts.length > 0
            ? visibleProducts.map((product) => (
              <div className="homepage-product-carousel-card" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))
            : visibleTiles.map((tile) => (
              <div
                className={`homepage-product-carousel-card homepage-tile-carousel-card ${tile.kind === 'brand' ? 'homepage-brand-tile-carousel-card' : ''}`}
                key={tile.id}
              >
                <Link href={tile.href} className={`homepage-tile-carousel-link ${tile.kind === 'brand' ? 'homepage-brand-tile-carousel-link' : ''}`}>
                  <span className="homepage-tile-carousel-image"><img src={tile.image} alt={tile.name} loading="lazy" /></span>
                  {tile.showName !== false ? <strong>{tile.name}</strong> : null}
                </Link>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
