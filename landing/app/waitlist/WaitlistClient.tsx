'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export function WaitlistClient() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsDuplicate(false);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setStatus('error');
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (!consent) {
      setStatus('error');
      setErrorMessage('Please check the consent box to receive early access updates.');
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          consent: consent,
          source: 'waitlist_page',
          website: honeypot, // Honeypot field
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to join waitlist. Please try again.');
      }

      if (data?.duplicate) {
        setIsDuplicate(true);
      } else {
        setIsDuplicate(false);
      }

      setStatus('success');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Could not connect to waitlist service. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070d12] text-[#fbf4e3] flex flex-col relative selection:bg-[#a6dcf8]/30">
      {/* Background cinematic radial atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(166, 220, 248, 0.12) 0%, rgba(45, 106, 79, 0.05) 45%, rgba(7, 13, 18, 0) 75%)',
        }}
      />

      {/* -------------------------------------------------------------
          Top Navigation Bar (Seamless Dark Integration)
         ------------------------------------------------------------- */}
      <Header variant="solid" />

      {/* -------------------------------------------------------------
          Main Full-Page Waitlist Experience
         ------------------------------------------------------------- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 max-w-4xl mx-auto w-full text-center">
        {/* Early Access Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101c27] border border-[#a6dcf8]/25 mb-6 shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a6dcf8] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a6dcf8]" />
          </span>
          <span className="text-xs font-mono tracking-wide text-[#a6dcf8] uppercase">
            Private Testing Cohort
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif italic text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
          <span className="block text-[#fbf4e3]">Be First to Experience</span>
          <span className="block text-gradient-gold">Next-Gen Travel AI.</span>
        </h1>

        {/* Supporting Description */}
        <p className="max-w-xl text-sm sm:text-base text-[#cfc8b8] leading-relaxed mb-10 font-sans">
          We are admitting testers in small, verified cohorts. Drop any travel reel link, identify hidden landmarks, and explore historical climate normals before public release.
        </p>

        {/* Form Container */}
        <div className="w-full max-w-xl rounded-3xl glass-panel-elevated p-6 sm:p-10 border border-[#a6dcf8]/30 shadow-2xl relative overflow-hidden">
          {/* Ambient inner card glow */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #a6dcf8 0%, transparent 70%)' }}
          />

          <div className="relative z-10">
            {status === 'success' ? (
              <div className="p-6 rounded-2xl bg-[#2D6A4F]/20 border border-[#2D6A4F]/50 text-center animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-[#2D6A4F] text-[#fbf4e3] flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  &#10003;
                </div>
                <h2 className="text-lg font-semibold text-[#fbf4e3]">
                  {isDuplicate ? "You're already on the VAMO waitlist" : "You're on the early access list"}
                </h2>
                <p className="text-xs sm:text-sm text-[#cfc8b8] mt-2 max-w-md mx-auto leading-relaxed">
                  {isDuplicate
                    ? "We already have your email saved. You'll receive an invitation as soon as the next testing cohort opens for your device."
                    : "Thank you for joining. We'll send your private invitation and download link as testing spots become available."}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('idle');
                      setIsDuplicate(false);
                    }}
                    className="text-xs text-[#a6dcf8] hover:underline font-mono"
                  >
                    Submit another email
                  </button>
                  <span className="hidden sm:inline text-[#fbf4e3]/20">·</span>
                  <Link
                    href="/"
                    className="text-xs text-[#cfc8b8] hover:text-[#fbf4e3] transition-colors"
                  >
                    Return to homepage &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 text-left">
                {/* Honeypot anti-spam */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="w-full flex flex-col sm:flex-row gap-2.5">
                  <label htmlFor="waitlist-page-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="waitlist-page-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={status === 'submitting'}
                    className="flex-1 px-4 py-3.5 rounded-xl bg-[#070d12] border border-[#fbf4e3]/20 text-sm text-[#fbf4e3] placeholder-[#cfc8b8]/50 focus:border-[#a6dcf8] focus:ring-1 focus:ring-[#a6dcf8] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="px-6 py-3.5 rounded-xl bg-[#fbf4e3] hover:bg-white text-[#070d12] font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 shrink-0 cursor-pointer text-center"
                  >
                    {status === 'submitting' ? 'Reserving Spot...' : 'Get Early Access'}
                  </button>
                </div>

                {/* Explicit Consent Checkbox */}
                <div className="w-full flex items-start gap-2.5 px-1 pt-1">
                  <input
                    id="waitlist-page-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'submitting'}
                    className="mt-0.5 w-4 h-4 rounded border-[#fbf4e3]/20 bg-[#070d12] text-[#a6dcf8] focus:ring-[#a6dcf8] focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor="waitlist-page-consent"
                    className="text-xs text-[#cfc8b8] cursor-pointer leading-relaxed select-none"
                  >
                    I agree to receive early access updates and release notifications from VAMO.
                  </label>
                </div>

                {status === 'error' && errorMessage && (
                  <p className="w-full text-xs text-[#e53935] mt-1 text-center" role="alert">
                    {errorMessage}
                  </p>
                )}

                <div className="w-full pt-3 border-t border-[#fbf4e3]/10 mt-2 text-center">
                  <p className="text-[11px] text-[#cfc8b8]/60">
                    No spam. Zero ads. Direct PostgreSQL storage with Row-Level Security.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Editorial Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 w-full max-w-3xl text-left">
          <div className="p-5 rounded-2xl bg-[#0a1118]/60 border border-[#fbf4e3]/10 backdrop-blur-md">
            <span className="text-xs font-mono text-[#a6dcf8] uppercase tracking-wider block mb-2">
              01 · Instant Detection
            </span>
            <h3 className="text-sm font-semibold text-[#fbf4e3] mb-1">
              Multimodal Vision
            </h3>
            <p className="text-xs text-[#cfc8b8] leading-relaxed">
              Analyzes keyframe architecture, skylines, and landmarks in ~6s without user geo-tags.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a1118]/60 border border-[#fbf4e3]/10 backdrop-blur-md">
            <span className="text-xs font-mono text-[#a6dcf8] uppercase tracking-wider block mb-2">
              02 · Honest Intelligence
            </span>
            <h3 className="text-sm font-semibold text-[#fbf4e3] mb-1">
              Climate &amp; Budget
            </h3>
            <p className="text-xs text-[#cfc8b8] leading-relaxed">
              Real 30-year monthly normals from Open-Meteo, Wikipedia dossier facts, and budget ranges.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a1118]/60 border border-[#fbf4e3]/10 backdrop-blur-md">
            <span className="text-xs font-mono text-[#a6dcf8] uppercase tracking-wider block mb-2">
              03 · Zero Tracking
            </span>
            <h3 className="text-sm font-semibold text-[#fbf4e3] mb-1">
              Privacy by Design
            </h3>
            <p className="text-xs text-[#cfc8b8] leading-relaxed">
              OpenStreetMap tile caching with zero trackers, cookies, or monetization surveillance.
            </p>
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------
          Footer
         ------------------------------------------------------------- */}
      <Footer />
    </div>
  );
}

