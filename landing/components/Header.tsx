'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  variant?: 'hero' | 'solid';
}

export function Header({ variant = 'hero' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (variant !== 'hero') return;

    const handleScroll = () => {
      // Transition smoothly after user scrolls past top 20px
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  // Variant 'solid' used on dedicated pages like /waitlist where there is no hero image
  if (variant === 'solid') {
    return (
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#070d12]/80 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="VAMO Home"
          >
            <Image
              src="/logo.png"
              alt="VAMO Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-sans font-bold text-[20px] tracking-[0.22em] text-[#fbf4e3] group-hover:text-white transition-colors">
              VAMO
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e53935]" />
          </Link>

          <nav className="flex items-center gap-6 text-[14px] font-medium text-[#cfc8b8]">
            <Link
              href="/"
              className="hover:text-[#fbf4e3] transition-colors flex items-center gap-1.5"
            >
              <span>&larr;</span>
              <span>Back to Overview</span>
            </Link>
            <Link
              href="/qr"
              className="hidden sm:inline-block hover:text-[#a6dcf8] transition-colors"
            >
              Mobile QR
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  // Variant 'hero' seamlessly overlaid above the photographic hero
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out ${
        isScrolled
          ? 'backdrop-blur-md bg-[#070d12]/85'
          : 'bg-gradient-to-b from-black/75 via-black/35 to-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="VAMO Home"
        >
          <Image
            src="/logo.png"
            alt="VAMO Logo"
            width={24}
            height={24}
            className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-sans font-bold text-[20px] tracking-[0.22em] text-[#fbf4e3] group-hover:text-white transition-colors">
            VAMO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e53935]" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#cfc8b8]">
          <a href="#how-it-works" className="hover:text-[#fbf4e3] transition-colors">
            How It Works
          </a>
          <a href="#screens" className="hover:text-[#fbf4e3] transition-colors">
            Screens
          </a>
          <a href="#status" className="hover:text-[#fbf4e3] transition-colors">
            Roadmap
          </a>
          <Link href="/qr" className="hover:text-[#a6dcf8] transition-colors">
            Mobile QR
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/waitlist"
            className="px-5 py-2.5 rounded-full text-[14px] font-semibold bg-[#fbf4e3] hover:bg-white text-[#070d12] transition-transform duration-200 hover:scale-105 shadow-md shadow-black/40"
          >
            Join Waitlist
          </Link>
        </div>
      </div>
    </header>
  );
}
