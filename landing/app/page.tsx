import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { DemoVideoSection } from '../components/DemoVideoSection';
import { ScreenshotsSection } from '../components/ScreenshotsSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { WorksTodaySection } from '../components/WorksTodaySection';
import { WaitlistSection } from '../components/WaitlistSection';
import { Footer } from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070d12] text-[#fbf4e3] flex flex-col relative selection:bg-[#a6dcf8]/30">
      {/* -------------------------------------------------------------
          Top Navigation Bar
         ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#070d12]/70 border-b border-[#fbf4e3]/10">
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
            <span className="font-sans font-bold text-lg tracking-[0.22em] text-[#fbf4e3] group-hover:text-white transition-colors">
              VAMO
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e53935]" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#cfc8b8]">
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
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#fbf4e3] hover:bg-white text-[#070d12] transition-transform duration-200 hover:scale-105"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          Section 1: Hero
         ------------------------------------------------------------- */}
      <section
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden py-20"
        aria-label="Hero"
      >
        {/* Dynamic 13-photo background slideshow */}
        <HeroSlideshow />

        <div className="relative z-30 max-w-4xl mx-auto flex flex-col items-center justify-center">
          {/* Heading: Drop a reel. Find the place. */}
          <h1 className="font-serif italic text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.05] mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            <span className="block text-[#fbf4e3]">Drop a reel.</span>
            <span className="block text-gradient-gold">Find the place.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-xl text-sm sm:text-base text-[#fbf4e3] leading-relaxed mb-10 font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            AI destination detection for travel reels. Identify landmarks, explore historical climate normals, and build verified travel dossiers without geo-tags.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/waitlist"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#fbf4e3] hover:bg-white text-[#070d12] font-semibold text-sm tracking-wide transition-all duration-200 hover:scale-105 shadow-xl shadow-black/40 text-center"
            >
              Join the Waitlist
            </Link>
            <a
              href="#demo-video"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full glass-panel hover:bg-[#101c27] text-[#fbf4e3] font-medium text-sm transition-all duration-200 border border-[#fbf4e3]/15 flex items-center justify-center gap-2"
            >
              <span>Watch Demo</span>
              <span className="text-xs">&#9660;</span>
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 2: Demo Video
         ------------------------------------------------------------- */}
      <DemoVideoSection />

      {/* -------------------------------------------------------------
          Section 3: Phone Frame Screenshots (5 shots)
         ------------------------------------------------------------- */}
      <ScreenshotsSection />

      {/* -------------------------------------------------------------
          Section 4: How It Works in 3 Steps
         ------------------------------------------------------------- */}
      <HowItWorksSection />

      {/* -------------------------------------------------------------
          Section 5: Works Today / Coming Next (Honest Status)
         ------------------------------------------------------------- */}
      <WorksTodaySection />

      {/* -------------------------------------------------------------
          Section 6: Waitlist Form + GitHub + Contact
         ------------------------------------------------------------- */}
      <WaitlistSection />

      {/* -------------------------------------------------------------
          Section 7: Footer
         ------------------------------------------------------------- */}
      <Footer />
    </div>
  );
}
