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

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(handleNext, 6000); // 6s autoplay
    return () => clearInterval(interval);
  }, [isHovered, handleNext]);

  if (!slides || slides.length === 0) return null;

  return (
    <div 
      className="hero-carousel-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            onClick={handlePrev} 
            className="hero-carousel-nav-btn prev"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={handleNext} 
            className="hero-carousel-nav-btn next"
            aria-label="Next Slide"
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
