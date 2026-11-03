'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/pradnesh-deshmukh/travel-ai';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'inquiries@vamo.travel';

  return (
    <footer className="w-full border-t border-[#fbf4e3]/10 bg-[#070d12] text-[#cfc8b8] text-xs py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold tracking-[0.2em] text-[#fbf4e3]">
              VAMO
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e53935]" />
            <span className="text-[11px] font-mono text-[#a6dcf8]/80">PROTOTYPE</span>
          </div>
          <p className="text-[11px] text-[#cfc8b8]/60 mt-1 max-w-sm text-center md:text-left">
            Independent open research prototype. Not affiliated with Instagram, Meta, or tourism boards.
          </p>
        </div>

        <div className="text-center md:text-right space-y-1">
          <p className="text-[11px] text-[#cfc8b8]/70">
            Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-[#fbf4e3] underline">OpenStreetMap</a> · Weather by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#fbf4e3] underline">Open-Meteo</a>
          </p>
          <p className="text-[11px] text-[#cfc8b8]/50">
            Photos via Wikimedia Commons &amp; CC contributors.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 pt-2 text-[11px]">
            <Link href="/qr" className="hover:text-[#fbf4e3] transition-colors">
              Mobile QR Code
            </Link>
            <span>·</span>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#fbf4e3] transition-colors">
              Source Code (GitHub)
            </a>
            <span>·</span>
            <a href={`mailto:${contactEmail}`} className="hover:text-[#fbf4e3] transition-colors">
              Contact Team
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
