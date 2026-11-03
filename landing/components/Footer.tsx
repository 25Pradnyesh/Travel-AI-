'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_URL ||
    'https://github.com/25Pradnyesh/Travel-AI-';
  const xUrl =
    process.env.NEXT_PUBLIC_X_URL ||
    'https://x.com/25Pradnyesh';

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

        <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right">
          <div className="space-y-1">
            <p className="text-[11px] text-[#cfc8b8]/70">
              Map data ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#fbf4e3] underline"
              >
                OpenStreetMap
              </a>{' '}
              · Weather by{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#fbf4e3] underline"
              >
                Open-Meteo
              </a>
            </p>
            <p className="text-[11px] text-[#cfc8b8]/50">
              Photos via Wikimedia Commons &amp; CC contributors.
            </p>
          </div>

          {/* Minimal Icon-Based Social Row */}
          <div className="flex items-center gap-4 pt-1">
            <Link
              href="/qr"
              className="text-[11px] text-[#cfc8b8]/80 hover:text-[#fbf4e3] transition-colors mr-1"
            >
              Mobile QR
            </Link>
            <span className="text-[#fbf4e3]/20" aria-hidden="true">·</span>

            {/* Official GitHub Mark */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              title="GitHub Repository"
              className="text-[#cfc8b8] hover:text-[#fbf4e3] p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6dcf8] inline-flex items-center justify-center"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden="true"
                className="w-4 h-4 sm:w-4.5 sm:h-4.5"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>

            {/* Official X Logo */}
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X Profile"
              title="X Profile"
              className="text-[#cfc8b8] hover:text-[#fbf4e3] p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6dcf8] inline-flex items-center justify-center"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden="true"
                className="w-4 h-4 sm:w-4.5 sm:h-4.5"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
