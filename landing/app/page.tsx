import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../components/Header';
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
          Top Navigation Bar (Seamless Hero Overlay)
         ------------------------------------------------------------- */}
      <Header variant="hero" />

      {/* -------------------------------------------------------------
          Section 1: Hero
         ------------------------------------------------------------- */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
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
