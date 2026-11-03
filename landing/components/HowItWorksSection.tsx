'use client';

import React from 'react';

const STEPS = [
  {
    num: '01',
    title: 'Drop an Instagram Reel',
    desc: 'Found an inspiring travel video without a location tag? Simply copy the link and paste it into VAMO.',
    tags: ['Zero Auth Required', 'Public Reels', 'Direct Share'],
  },
  {
    num: '02',
    title: 'Visual Landmark & Scene Analysis',
    desc: 'The pipeline extracts keyframes, inspects visual features, and matches distinctive landmarks, topography, and architecture against reference models.',
    tags: ['Gemini Vision', 'Landmark Matching', 'OpenStreetMap'],
  },
  {
    num: '03',
    title: 'Instant Intelligence Dossier',
    desc: 'Receive verified GPS coordinates, Open-Meteo 10-year historical weather normals, seasonal temperature windows, and a transparent daily budget breakdown.',
    tags: ['OpenStreetMap POIs', 'Open-Meteo Normals', 'Daily Budget Tiers'],
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20"
      aria-label="How VAMO Works"
    >
      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-widest font-mono text-[#a6dcf8] px-3 py-1 rounded-full bg-[#101c27] border border-[#a6dcf8]/20">
          Workflow
        </span>
        <h2 className="font-serif italic text-3xl sm:text-5xl text-[#fbf4e3] mt-3">
          How It Works
        </h2>
        <p className="text-[#cfc8b8] text-sm max-w-md mx-auto mt-3">
          Three transparent steps from viral social media clip to structured travel plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="p-6 sm:p-8 rounded-3xl glass-panel relative flex flex-col justify-between group hover:border-[#fbf4e3]/25 transition-all"
          >
            <div>
              <span className="font-serif italic text-4xl text-[#a6dcf8]/70 block mb-4">
                {step.num}
              </span>
              <h3 className="text-lg font-semibold text-[#fbf4e3] mb-2">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#cfc8b8] leading-relaxed mb-6">
                {step.desc}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#fbf4e3]/10">
              {step.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#070d12]/80 text-[#cfc8b8] border border-[#fbf4e3]/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

