'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  variant?: 'hero' | 'solid';
}

export function Header({ variant = 'hero' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Close mobile menu on viewport resize to desktop (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Variant 'solid' used on dedicated pages like /waitlist where there is no hero image
  if (variant === 'solid') {
    return (
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#070d12]/80 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group"
            aria-label="VAMO Home"
          >
            <Image
              src="/logo.png"
              alt="VAMO Logo"
              width={635}
              height={530}
              priority
              className="h-10 sm:h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-sans font-bold text-[18px] sm:text-[20px] tracking-[0.22em] text-[#fbf4e3] group-hover:text-white transition-colors">
              VAMO
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e53935]" />
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 text-[13px] sm:text-[14px] font-medium text-[#cfc8b8]">
            <Link
              href="/"
              className="min-h-[44px] flex items-center gap-1.5 hover:text-[#fbf4e3] transition-colors"
            >
              <span>&larr;</span>
              <span>Back to Overview</span>
            </Link>
            <Link
              href="/qr"
              className="min-h-[44px] hidden sm:flex items-center hover:text-[#a6dcf8] transition-colors"
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
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out ${isScrolled || isMobileMenuOpen
        ? 'backdrop-blur-md bg-[#070d12]/85'
        : 'bg-gradient-to-b from-black/75 via-black/35 to-transparent'
        }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 sm:gap-2.5 group shrink-0"
          aria-label="VAMO Home"
        >
          <Image
            src="/logo.png"
            alt="VAMO Logo"
            width={635}
            height={530}
            priority
            className="h-10 sm:h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-sans font-bold text-[18px] sm:text-[20px] tracking-[0.22em] text-[#fbf4e3] group-hover:text-white transition-colors">
            VAMO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e53935]" />
        </Link>

        {/* Desktop Navigation (Preserved exactly as-is) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[14px] font-medium text-[#cfc8b8]">
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

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Join Waitlist CTA (Desktop & Mobile) */}
          <Link
            href="/waitlist"
            onClick={closeMobileMenu}
            className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-[14px] font-semibold bg-[#fbf4e3] hover:bg-white text-[#070d12] transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md shadow-black/40 shrink-0"
          >
            Join Waitlist
          </Link>

          {/* Mobile Hamburger Toggle (44x44px minimum touch target) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 text-[#fbf4e3] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6dcf8]"
          >
            <div className="w-5 h-3.5 relative flex flex-col justify-between" aria-hidden="true">
              <span
                className={`block h-0.5 w-full bg-[#fbf4e3] rounded-full transition-all duration-300 ease-in-out transform origin-center ${isMobileMenuOpen ? 'translate-y-[6px] rotate-45' : ''
                  }`}
              />
              <span
                className={`block h-0.5 w-full bg-[#fbf4e3] rounded-full transition-all duration-200 ease-in-out ${isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                  }`}
              />
              <span
                className={`block h-0.5 w-full bg-[#fbf4e3] rounded-full transition-all duration-300 ease-in-out transform origin-center ${isMobileMenuOpen ? '-translate-y-[6px] -rotate-45' : ''
                  }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer & Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop (Tapping outside closes the menu) */}
          <div
            className="fixed inset-0 top-16 sm:top-20 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Menu Dropdown Container */}
          <div
            id="mobile-nav-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="fixed top-16 sm:top-20 left-0 right-0 z-50 bg-[#070d12]/95 backdrop-blur-2xl border-b border-[#fbf4e3]/10 shadow-2xl transition-all duration-300 ease-out"
          >
            <div className="max-w-md mx-auto px-5 py-6 flex flex-col gap-5">
              <nav aria-label="Mobile Navigation Links">
                <ul className="flex flex-col space-y-1">
                  <li>
                    <a
                      href="#how-it-works"
                      onClick={closeMobileMenu}
                      className="min-h-[48px] py-3 px-3.5 flex items-center justify-between rounded-xl text-[16px] font-medium text-[#fbf4e3] hover:text-[#a6dcf8] hover:bg-[#101c27] active:bg-[#101c27] transition-colors"
                    >
                      <span>How It Works</span>
                      <span className="text-[#cfc8b8]/40 text-xs font-mono">&rarr;</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#screens"
                      onClick={closeMobileMenu}
                      className="min-h-[48px] py-3 px-3.5 flex items-center justify-between rounded-xl text-[16px] font-medium text-[#fbf4e3] hover:text-[#a6dcf8] hover:bg-[#101c27] active:bg-[#101c27] transition-colors"
                    >
                      <span>Screens</span>
                      <span className="text-[#cfc8b8]/40 text-xs font-mono">&rarr;</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#status"
                      onClick={closeMobileMenu}
                      className="min-h-[48px] py-3 px-3.5 flex items-center justify-between rounded-xl text-[16px] font-medium text-[#fbf4e3] hover:text-[#a6dcf8] hover:bg-[#101c27] active:bg-[#101c27] transition-colors"
                    >
                      <span>Roadmap</span>
                      <span className="text-[#cfc8b8]/40 text-xs font-mono">&rarr;</span>
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/qr"
                      onClick={closeMobileMenu}
                      className="min-h-[48px] py-3 px-3.5 flex items-center justify-between rounded-xl text-[16px] font-medium text-[#fbf4e3] hover:text-[#a6dcf8] hover:bg-[#101c27] active:bg-[#101c27] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span>Mobile QR</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#a6dcf8]/15 text-[#a6dcf8]">
                          SCAN
                        </span>
                      </span>
                      <span className="text-[#cfc8b8]/40 text-xs font-mono">&rarr;</span>
                    </Link>
                  </li>
                </ul>
              </nav>

              <div className="pt-4 border-t border-[#fbf4e3]/10 flex flex-col gap-2">
                <Link
                  href="/waitlist"
                  onClick={closeMobileMenu}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#fbf4e3] hover:bg-white text-[#070d12] font-semibold text-center text-sm transition-transform active:scale-[0.98] shadow-lg shadow-black/40 flex items-center justify-center gap-2"
                >
                  <span>Join the Waitlist</span>
                  <span className="text-base">&rarr;</span>
                </Link>
                <p className="text-[11px] text-center text-[#cfc8b8]/60 mt-1 font-mono">
                  Private testing cohort &bull; Zero tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
