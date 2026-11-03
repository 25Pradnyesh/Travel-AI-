'use client';

import React from 'react';

const WORKS_TODAY = [
  {
    title: 'Visual Landmark & Landscape Recognition',
    detail: 'Identifies prominent geological landmarks, natural scenery, and architecture from video keyframes via Gemini Vision.',
    verified: true,
  },
  {
    title: 'Open-Meteo Historical Climate Normals',
    detail: 'Calculates real 10-year monthly averages: precipitation, temperature ranges, and best visiting windows.',
    verified: true,
  },
  {
    title: 'OpenStreetMap POIs & Surrounding Spots',
    detail: 'Pinpoints confirmed coordinates and nearby points of interest within travel radius.',
    verified: true,
  },
  {
    title: 'Estimated Daily Travel Cost Model',
    detail: 'Statistical daily budget estimates across 3 tiers (Budget, Mid-range, Comfortable) using World Bank ICP ratios (not live scraping).',
    verified: true,
  },
  {
    title: 'In-App Offline Demo Mode',
    detail: 'Complete offline presentation capability with pre-analyzed sample destinations (Jeju, Rome, Kyoto) and zero network requirement.',
    verified: true,
  },
  {
    title: 'Private & Ephemeral by Design',
    detail: 'Zero permanent video storage. Reels are decoded in-memory and discarded post-analysis.',
    verified: true,
  },
];

const COMING_NEXT = [
  {
    title: 'Native Share Sheet Extension',
    detail: 'Send reels straight from Instagram into VAMO on iOS and Android without manual URL copying.',
    status: 'In Design',
  },
  {
    title: 'Live Hotel & Flight Price Scraping',
    detail: 'Real-time accommodation and airline fares to replace statistical model estimates.',
    status: 'Planned',
  },
  {
    title: 'Multi-Clip Trip Clustering',
    detail: 'Group multiple analyzed reels into an organized multi-stop route or weekend itinerary.',
    status: 'Roadmap',
  },
  {
    title: 'TikTok & YouTube Shorts Ingestion',
    detail: 'Broaden video platform coverage beyond Instagram Reels.',
    status: 'Planned',
  },
  {
    title: 'Direct Transit & Booking Links',
    detail: 'Deep links to local rail operators and flight search routes.',
    status: 'Planned',
  },
];

export function WorksTodaySection() {
  return (
    <section
      id="status"
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20"
      aria-label="Capabilities and Roadmap"
    >
      <div className="text-center mb-14">
        <span className="text-xs uppercase tracking-widest font-mono text-[#a6dcf8] px-3 py-1 rounded-full bg-[#101c27] border border-[#a6dcf8]/20">
          Honest Status
        </span>
        <h2 className="font-serif italic text-3xl sm:text-5xl text-[#fbf4e3] mt-3">
          Works Today &amp; Coming Next
        </h2>
        <p className="text-[#cfc8b8] text-sm max-w-lg mx-auto mt-3">
          VAMO is an active research prototype. No exaggerated claims, no store badges, and no invented user counts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Column 1: Works Today */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#a6dcf8]/25 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#fbf4e3]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] inline-block shadow-[0_0_8px_#2D6A4F]" />
              <h3 className="text-lg font-semibold text-[#fbf4e3]">Works Today</h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#2D6A4F]/20 text-[#74c69d] border border-[#2D6A4F]/40">
              Verified
            </span>
          </div>

          <ul className="space-y-4 flex-1">
            {WORKS_TODAY.map((item) => (
              <li key={item.title} className="flex items-start gap-3 text-xs sm:text-sm">
                <span className="text-[#a6dcf8] text-base leading-none mt-0.5">&#10003;</span>
                <div>
                  <strong className="text-[#fbf4e3] font-medium block">
                    {item.title}
                  </strong>
                  <span className="text-[#cfc8b8] text-xs leading-relaxed block mt-0.5">
                    {item.detail}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Coming Next */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[#fbf4e3]/15 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#fbf4e3]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e8a838] inline-block shadow-[0_0_8px_#e8a838]" />
              <h3 className="text-lg font-semibold text-[#fbf4e3]">Coming Next</h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#e8a838]/20 text-[#f6d365] border border-[#e8a838]/40">
              In Development
            </span>
          </div>

          <ul className="space-y-4 flex-1">
            {COMING_NEXT.map((item) => (
              <li key={item.title} className="flex items-start gap-3 text-xs sm:text-sm">
                <span className="text-[#e8a838] text-base leading-none mt-0.5">&#8594;</span>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-[#fbf4e3] font-medium">
                      {item.title}
                    </strong>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#fbf4e3]/10 text-[#cfc8b8]">
                      {item.status}
                    </span>
                  </div>
                  <span className="text-[#cfc8b8] text-xs leading-relaxed block mt-0.5">
                    {item.detail}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

