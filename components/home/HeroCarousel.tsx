'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselSlide {
  id: string;
  image: string;
  buttonLabel: string;
  buttonLink: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1 < slides.length ? prevIndex + 1 : 0));
  }, [slides.length]);


  const goToNextClamped = useCallback(() => {
    setCurrentIndex((prevIndex) => Math.min(slides.length - 1, prevIndex + 1));
  }, [slides.length]);

  const goToPrevClamped = useCallback(() => {
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(handleNext, 6000); // 6s autoplay
    return () => clearInterval(interval);
  }, [isHovered, handleNext]);

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

    // Detect horizontal swipe (horizontal movement > vertical movement and > 40px)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swiped left -> next slide
        goToNextClamped();
      } else {
        // Swiped right -> prev slide
        goToPrevClamped();
      }
    }
  };

  return (
    <div 
      className="hero-carousel-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Slides Inner */}
      <div 
        className="hero-carousel-inner"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div 
            key={slide.id} 
            className="hero-carousel-slide"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="hero-carousel-overlay" />
            
            <Link href={slide.buttonLink} className="hero-carousel-cta">
              {slide.buttonLabel}
            </Link>
          </div>
        ))}
      </div>

      {/* Nav Buttons */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={goToPrevClamped} 
            className="hero-carousel-nav-btn prev"
            aria-label="Previous Slide"
            disabled={currentIndex === 0}
            style={{ opacity: currentIndex === 0 ? 0.45 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={goToNextClamped} 
            className="hero-carousel-nav-btn next"
            aria-label="Next Slide"
            disabled={currentIndex === slides.length - 1}
            style={{ opacity: currentIndex === slides.length - 1 ? 0.45 : 1, cursor: currentIndex === slides.length - 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots Indicator */}
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
        </>
      )}
    </div>
  );
}
