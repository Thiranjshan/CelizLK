'use client';

import React, { useState, useEffect, useCallback } from 'react';
import HeroTypography from './HeroTypography';

interface CarouselSlide {
  id: string;
  image: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1 < slides.length ? prevIndex + 1 : 0));
  }, [slides.length]);

  useEffect(() => {
    const interval = setInterval(handleNext, 7000);
    return () => clearInterval(interval);
  }, [handleNext]);

  useEffect(() => {
    const updateScrollProgress = () => {
      const hero = document.querySelector('.hero-carousel-container');
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const heroHeight = Math.max(hero.clientHeight, 1);
      const progress = Math.min(1, Math.max(0, (-rect.top) / heroHeight));
      setScrollProgress(progress);
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  if (!slides || slides.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = touchStartRef.current.x - endX;
    const deltaY = touchStartRef.current.y - endY;
    touchStartRef.current = null;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : slides.length - 1));
      } else {
        setCurrentIndex((prevIndex) => (prevIndex + 1 < slides.length ? prevIndex + 1 : 0));
      }
    }
  };

  return (
    <div 
      className="hero-carousel-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="hero-carousel-frame" />
      <div
        className="hero-carousel-inner"
        style={{
          transform: `scale(${1 + scrollProgress * 0.28})`,
          filter: `brightness(${1 - scrollProgress * 0.7}) saturate(${1 - scrollProgress * 0.15})`,
        }}
      >
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className={`hero-carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 1 : 0,
            }}
          >
            <div
              className="hero-carousel-overlay"
              style={{
                background: `linear-gradient(180deg, rgba(0, 0, 0, ${0.18 + scrollProgress * 0.25}) 0%, rgba(0, 0, 0, ${0.34 + scrollProgress * 0.66}) 100%)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Seamless cinematic black fade between hero image and next section */}
      <div className="hero-carousel-bottom-fade" aria-hidden="true" />

      {/* Cinematic Typography Layer (Independent Layer) */}
      <HeroTypography />

      <div
        className="hero-scroll-hint"
        onClick={() => {
          const hero = document.querySelector('.hero-carousel-container');
          if (hero) {
            const nextEl = hero.nextElementSibling;
            if (nextEl) {
              nextEl.scrollIntoView({ behavior: 'smooth' });
              return;
            }
          }
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Scroll to explore"
        style={{
          opacity: Math.max(0, 1 - scrollProgress * 2.2),
          transform: `translate(-50%, ${scrollProgress * 40}px)`,
          pointerEvents: scrollProgress > 0.35 ? 'none' : 'auto',
        }}
      >
        <div className="hero-scroll-content">
          <div className="hero-scroll-mouse" aria-hidden="true">
            <div className="hero-scroll-wheel" />
          </div>
          <span className="hero-scroll-text">SCROLL</span>
          <span className="hero-scroll-subtext">Explore the latest tech</span>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="hero-carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`hero-carousel-dot ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
