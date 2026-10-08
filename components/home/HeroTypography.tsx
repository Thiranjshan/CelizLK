'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { HERO_SEQUENCES, HeroSequence } from '@/lib/hero-sequences';

interface HeroTypographyProps {
  /** Optional callback if external syncing with background images is desired */
  onSequenceChange?: (index: number) => void;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function HeroTypography({ onSequenceChange }: HeroTypographyProps) {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'settled' | 'exit'>('enter');
  
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const settleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextSeqTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronized sequence lifecycle: 7.0s total cycle
  // 0.0s - 2.2s: Staggered entry (phase = 'enter')
  // 2.2s - 6.2s: Settled hold (phase = 'settled', still, stable composition)
  // 6.2s - 7.0s: Graceful exit transition (phase = 'exit')
  // 7.0s: Next sequence
  useEffect(() => {
    // 1. Transition to settled after all entrance animations have concluded
    settleTimerRef.current = setTimeout(() => {
      setPhase('settled');
    }, 2200);

    // 2. Transition to exit 800ms before next sequence
    exitTimerRef.current = setTimeout(() => {
      setPhase('exit');
    }, 6200);

    // 3. Switch to next sequence at 7000ms and reset phase to 'enter'
    nextSeqTimerRef.current = setTimeout(() => {
      setPhase('enter');
      setSequenceIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % HERO_SEQUENCES.length;
        if (onSequenceChange) onSequenceChange(nextIndex);
        return nextIndex;
      });
    }, 7000);

    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (nextSeqTimerRef.current) clearTimeout(nextSeqTimerRef.current);
    };
  }, [sequenceIndex, onSequenceChange]);

  const currentSeq: HeroSequence = HERO_SEQUENCES[sequenceIndex];

  return (
    <div
      className="hero-typography-layer"
      aria-live="polite"
      aria-atomic="true"
    >
      <div 
        key={currentSeq.id}
        className={`hero-typography-stage phase-${phase} ${prefersReducedMotion ? 'reduced-motion' : ''}`}
      >

        {/* Small Intro / Eyebrow if present */}
        {currentSeq.intro && (
          <div
            className={`hero-intro-text ${phase !== 'exit' ? 'enter-active' : 'exit-active'}`}
            style={{
              transitionDelay: `${currentSeq.intro.delay}s`,
            }}
          >
            {currentSeq.intro.text}
          </div>
        )}

        {/* Main Typography Group Container */}
        <div className={`hero-title-group layout-${currentSeq.layout}`}>
          {currentSeq.groups.map((group) => {
            const delay = prefersReducedMotion ? 0 : group.delay;
            return (
              <span
                key={group.id}
                className={`hero-text-unit unit-${group.id} variant-${group.variant} anim-${group.animation} ${
                  phase !== 'exit' ? 'enter-active' : 'exit-active'
                } ${group.highlight ? 'unit-highlight' : ''}`}
                style={{
                  transitionDelay: `${delay}s`,
                }}
              >
                {group.text}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
