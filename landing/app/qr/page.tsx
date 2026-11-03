'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { generateQrMatrix, matrixToSvg } from '../../lib/qr';

export default function QrPage() {
  const [url, setUrl] = useState('https://vamo.travel');
  const [copied, setCopied] = useState(false);
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    // Read from env or current window location
    const target =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://vamo.travel');
    setUrl(target);
    try {
      const matrix = generateQrMatrix(target);
      const svg = matrixToSvg(matrix, 12, 4);
      setSvgContent(svg);
    } catch {
      // Quiet fallback
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'vamo-qr.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <main className="min-h-screen bg-[#070d12] text-[#fbf4e3] flex flex-col items-center justify-center p-6 relative selection:bg-[#a6dcf8]/30">
      {/* Background radial atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(166, 220, 248, 0.12) 0%, rgba(7, 13, 18, 0) 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* Brand header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a1118]/80 border border-[#fbf4e3]/15 text-sm tracking-widest font-semibold hover:border-[#fbf4e3]/30 transition-all mb-8"
        >
          <span>VAMO</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e53935]" />
          <span className="text-[#a6dcf8] text-xs font-normal">PROTOTYPE</span>
        </Link>

        <h1 className="font-serif italic text-4xl sm:text-5xl text-[#fbf4e3] mb-3 leading-tight">
          Scan to open VAMO
        </h1>
        <p className="text-[#cfc8b8] text-sm max-w-xs mb-8">
          Point your phone camera to open the showcase prototype or waitlist.
        </p>

        {/* QR container */}
        <div className="p-6 rounded-3xl bg-[#0a1118]/90 border border-[#fbf4e3]/15 shadow-2xl backdrop-blur-xl mb-6">
          {svgContent ? (
            <div
              className="w-64 h-64 [&>svg]:w-full [&>svg]:h-full rounded-2xl overflow-hidden"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="w-64 h-64 bg-[#081218] rounded-2xl flex items-center justify-center text-sm text-[#cfc8b8]">
              Generating QR...
            </div>
          )}
        </div>

        {/* URL Pill */}
        <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#101c27] border border-[#fbf4e3]/10 text-xs text-[#cfc8b8] mb-6">
          <span className="truncate text-left font-mono">{url}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 px-3 py-1 rounded-md bg-[#fbf4e3]/10 hover:bg-[#fbf4e3]/20 text-[#fbf4e3] font-medium transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="px-4 py-2 rounded-lg bg-[#a6dcf8]/15 hover:bg-[#a6dcf8]/25 text-[#a6dcf8] font-medium transition-colors"
          >
            Download SVG
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-[#cfc8b8] hover:text-[#fbf4e3] transition-colors"
          >
            Back to Showcase &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}

