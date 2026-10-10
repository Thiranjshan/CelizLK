'use client';

import { useEffect, type RefObject } from 'react';

const AUTO_ADVANCE_INTERVAL = 3000;

export default function useAutoAdvanceScroll(
  ref: RefObject<HTMLElement | null>,
  itemSelector: string,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    let isVisible = false;
    let isPaused = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const stopAutoAdvance = () => {
      isPaused = true;
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    };

    const advance = () => {
      if (!isVisible || isPaused || reducedMotion.matches || element.scrollWidth <= element.clientWidth + 4) return;

      const item = element.querySelector<HTMLElement>(itemSelector);
      if (!item) return;

      const styles = window.getComputedStyle(element);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const distance = item.getBoundingClientRect().width + gap;
      const maxScroll = element.scrollWidth - element.clientWidth;

      if (element.scrollLeft >= maxScroll - 6) {
        element.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        element.scrollBy({ left: distance, behavior: 'smooth' });
      }
    };

    const updateAutoAdvance = () => {
      if (!isVisible || isPaused || reducedMotion.matches || element.scrollWidth <= element.clientWidth + 4) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        return;
      }

      if (!intervalId) {
        intervalId = setInterval(advance, AUTO_ADVANCE_INTERVAL);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      updateAutoAdvance();
    }, { threshold: 0.15 });

    const resizeObserver = new ResizeObserver(updateAutoAdvance);
    const handleMotionPreferenceChange = () => updateAutoAdvance();
    observer.observe(element);
    resizeObserver.observe(element);
    reducedMotion.addEventListener('change', handleMotionPreferenceChange);
    element.addEventListener('pointerdown', stopAutoAdvance);
    element.addEventListener('touchstart', stopAutoAdvance, { passive: true });
    element.addEventListener('wheel', stopAutoAdvance, { passive: true });
    element.addEventListener('keydown', stopAutoAdvance);
    element.addEventListener('focusin', stopAutoAdvance);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      reducedMotion.removeEventListener('change', handleMotionPreferenceChange);
      if (intervalId) clearInterval(intervalId);
      element.removeEventListener('pointerdown', stopAutoAdvance);
      element.removeEventListener('touchstart', stopAutoAdvance);
      element.removeEventListener('wheel', stopAutoAdvance);
      element.removeEventListener('keydown', stopAutoAdvance);
      element.removeEventListener('focusin', stopAutoAdvance);
    };
  }, [itemSelector, ref]);
}
