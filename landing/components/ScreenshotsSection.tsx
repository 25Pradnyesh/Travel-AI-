'use client';

import React from 'react';
import Image from 'next/image';

interface PhoneShot {
  src: string;
  step: string;
  title: string;
  caption: string;
  alt: string;
}

const SHOTS: PhoneShot[] = [
  {
    src: '/images/app-screens/1-discovery.webp',
    step: 'Step 01',
    title: 'Drop Reel Link',
    caption: 'Paste any public Instagram travel reel link or explore curated inspiration tags.',
    alt: 'Mobile screen showing VAMO discovery home screen with Reel URL input pill and travel categories',
  },
  {
    src: '/images/app-screens/2-resolution.webp',
    step: 'Step 02',
    title: 'Landmark Recognition',
    caption: 'Engine inspects keyframes, architecture, and scenery to locate the destination in ~6s.',
    alt: 'Mobile screen showing VAMO real-time processing radar and semantic analysis stage progress',
  },
  {
    src: '/images/app-screens/3-destination.webp',
    step: 'Step 03',
    title: 'Verified Destination',
    caption: 'Confirmed destination overview for Jeju Island, South Korea with verified badge and geographic facts.',
    alt: 'Mobile screen showing VAMO Destination Results with Jeju Island, South Korea and Wikipedia summary',
  },
  {
    src: '/images/app-screens/4-dossier.webp',
    step: 'Step 04',
    title: 'Climate & Trip Budget',
    caption: '30-year seasonal climate normals from Open-Meteo and itemized daily expense breakdown.',
    alt: 'Mobile screen showing VAMO Travel Dossier with seasonal weather normals and daily budget tiers',
  },
  {
    src: '/images/app-screens/5-details.webp',
    step: 'Step 05',
    title: 'Place Details & Sights',
    caption: 'Point-of-interest briefing, high-resolution photography, and 1-tap walking directions.',
    alt: 'Mobile screen showing VAMO Place Detail view with Seongsan Ilchulbong coastal cliffs and quick actions',
  },
];

export function ScreenshotsSection() {
  return (
    <section
      id="screens"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20"
      aria-label="Mobile Application Preview"
    >
      <div className="text-center mb-14">
        <span className="text-xs uppercase tracking-widest font-mono text-[#a6dcf8] px-3 py-1 rounded-full bg-[#101c27] border border-[#a6dcf8]/20">
          Mobile Interface
        </span>
        <h2 className="font-serif italic text-3xl sm:text-5xl text-[#fbf4e3] mt-3">
          Designed for Clarity on the Move
        </h2>
        <p className="text-[#cfc8b8] text-sm max-w-xl mx-auto mt-3">
          An editorial aesthetic powered by dark glass atmosphere, high-contrast typography, and instant offline retrieval.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8 justify-items-center">
        {SHOTS.map((shot, idx) => (
          <div key={shot.step} className="flex flex-col items-center w-full max-w-[240px]">
            {/* Phone Bezel Enclosure */}
            <div className="relative w-full aspect-[9/19.5] rounded-[36px] p-2.5 bg-gradient-to-b from-[#2a3848] via-[#121c27] to-[#0a1118] shadow-2xl shadow-black/80 border border-[#fbf4e3]/15 group transition-transform duration-300 hover:-translate-y-1.5">
              {/* Outer screen border */}
              <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-[#070d12] border border-black flex flex-col">
                {/* Dynamic Island Pill */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20 flex items-center justify-end pr-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#0a1118] border border-white/10" />
                </div>

                {/* Screenshot Image */}
                <div className="relative flex-1 w-full h-full">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    priority={idx === 0}
                  />
                </div>
              </div>
            </div>

            {/* Label below phone */}
            <div className="mt-5 text-center w-full">
              <span className="text-xs font-mono text-[#a6dcf8] uppercase tracking-wider">
                {shot.step}
              </span>
              <h3 className="text-sm font-semibold text-[#fbf4e3] mt-1 line-clamp-1">
                {shot.title}
              </h3>
              <p className="text-xs text-[#cfc8b8] mt-1 leading-relaxed">
                {shot.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
