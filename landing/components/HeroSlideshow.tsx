'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { HERO_PHOTOS } from '../lib/photos';

export function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Preload NEXT photo only into the DOM head
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const nextIdx = (currentIndex + 1) % HERO_PHOTOS.length;
    const nextPhoto = HERO_PHOTOS[nextIdx];

    // Remove any existing preload tag we created
    const existing = document.getElementById('hero-preload-link');
    if (existing) {
      existing.remove();
    }

    const link = document.createElement('link');
    link.id = 'hero-preload-link';
    link.rel = 'preload';
    link.as = 'image';
    link.href = nextPhoto.src;
    document.head.appendChild(link);

    return () => {
      const el = document.getElementById('hero-preload-link');
      if (el) el.remove();
    };
  }, [currentIndex]);

  // Slideshow timer: 5s interval, paused if reduced motion or user paused
  useEffect(() => {
    if (isReducedMotion || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_PHOTOS.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isReducedMotion]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_PHOTOS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + HERO_PHOTOS.length) % HERO_PHOTOS.length);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const currentPhoto = HERO_PHOTOS[currentIndex];

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Photo Render: Current Photo with 100% opacity, zero blur, sharp & rich */}
      {HERO_PHOTOS.map((photo, index) => {
        // Only render active and immediately adjacent to keep DOM footprint minimal
        const isActive = index === currentIndex;
        const isPrev = index === (currentIndex - 1 + HERO_PHOTOS.length) % HERO_PHOTOS.length;
        if (!isActive && !isPrev && !isReducedMotion) {
          return null;
        }

        return (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              transitionDuration: isReducedMotion ? '0ms' : '1000ms',
            }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority={index === 0}
              style={{ objectPosition: photo.objectPosition || 'center center' }}
              className="object-cover scale-100 transform-gpu brightness-[1.02] contrast-[1.05]"
              sizes="100vw"
            />
          </div>
        );
      })}

      {/* Editorial Gradient Overlay: Light top (28%), very light middle (20%), grounding bottom (60%) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(7, 13, 18, 0.28) 0%, rgba(7, 13, 18, 0.20) 45%, rgba(7, 13, 18, 0.62) 85%, rgba(7, 13, 18, 0.95) 100%)',
        }}
      />

      {/* Accessible Photo Caption & Controls in bottom right */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-[#0a1118]/85 border border-[#fbf4e3]/20 backdrop-blur-md text-[11px] sm:text-xs text-[#cfc8b8] shadow-lg max-w-[calc(100vw-32px)]">
        <div className="w-2 h-2 rounded-full bg-[#a6dcf8] animate-pulse shrink-0" />
        <span className="font-medium text-[#fbf4e3] truncate">
          {currentPhoto.name}
        </span>
        <span className="text-[#cfc8b8]/75 hidden xs:inline shrink-0">· {currentPhoto.location}</span>
        <span className="text-[#cfc8b8]/50 shrink-0">
          ({currentIndex + 1}/{HERO_PHOTOS.length})
        </span>

        {!isReducedMotion && (
          <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-[#fbf4e3]/15 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="p-1 text-[#cfc8b8] hover:text-[#fbf4e3] transition-colors"
            >
              &#9664;
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause slideshow' : 'Resume slideshow'}
              className="p-1 text-[#cfc8b8] hover:text-[#fbf4e3] transition-colors"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="p-1 text-[#cfc8b8] hover:text-[#fbf4e3] transition-colors"
            >
              &#9654;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
