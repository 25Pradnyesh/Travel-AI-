'use client';

import React, { useEffect, useRef, useState } from 'react';

export function DemoVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="demo-video"
      ref={containerRef}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20"
      aria-label="Demo Video"
    >
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest font-mono text-[#a6dcf8] px-3 py-1 rounded-full bg-[#101c27] border border-[#a6dcf8]/20">
          Product Walkthrough
        </span>
        <h2 className="font-serif italic text-3xl sm:text-5xl text-[#fbf4e3] mt-3">
          Watch Reel to Dossier in Seconds
        </h2>
        <p className="text-[#cfc8b8] text-sm max-w-lg mx-auto mt-3">
          From copying an Instagram Reel link to confirmed GPS coordinates, historical climate normals, and daily trip budget.
        </p>
      </div>

      {/* Centered Smartphone Player Enclosure */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a6dcf8 0%, transparent 70%)' }}
        />

        {/* Smartphone Bezel Enclosure (Native 9:20 Aspect Ratio, Zero UI Cropping) */}
        <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-[9/20] rounded-[44px] p-3 bg-gradient-to-b from-[#2a3848] via-[#121c27] to-[#0a1118] shadow-2xl shadow-black/90 border border-[#fbf4e3]/20 group transition-transform duration-300 hover:scale-[1.01]">
          {/* Inner Screen Display (Overflow hidden clips video to screen radius) */}
          <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-[#070d12] border border-black">
            {/* Dynamic Island Pill */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-end pr-2 pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-[#0a1118] border border-white/10" />
            </div>

            {/* Video filling 100% of display area edge-to-edge */}
            {isVisible ? (
              <video
                className="absolute inset-0 w-full h-full object-cover object-center"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/videos/vamo-app-poster.webp"
              >
                <source src="/videos/vamo-app-preview.mp4" type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#070d12] text-xs text-[#cfc8b8] font-mono">
                Loading walkthrough...
              </div>
            )}
          </div>
        </div>

        {/* Walkthrough Milestones */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-[#cfc8b8]">
          <span className="px-3 py-1.5 rounded-full bg-[#101c27] border border-[#fbf4e3]/10">
            01 · Share Travel Reel
          </span>
          <span className="text-[#fbf4e3]/20">→</span>
          <span className="px-3 py-1.5 rounded-full bg-[#101c27] border border-[#fbf4e3]/10">
            02 · Landmark Detection
          </span>
          <span className="text-[#fbf4e3]/20">→</span>
          <span className="px-3 py-1.5 rounded-full bg-[#101c27] border border-[#fbf4e3]/10">
            03 · Verified Dossier &amp; Climate
          </span>
        </div>
      </div>
    </section>
  );
}
