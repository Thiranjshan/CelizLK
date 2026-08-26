'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselSlide {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  status?: string;
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
          <div key={slide.id} className="hero-carousel-slide">
            <div className="hero-carousel-content">
              <span className="hero-carousel-label">{slide.label}</span>
              <h1 className="hero-carousel-title">{slide.title}</h1>
              <p className="hero-carousel-desc">{slide.description}</p>
              <Link href={slide.buttonLink} className="btn-primary hero-carousel-cta">
                <span>{slide.buttonText}</span>
                <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </Link>
            </div>
            
            <div className="hero-carousel-image-wrap">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="hero-carousel-img"
              />
            </div>
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
