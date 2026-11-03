'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function WaitlistSection() {
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
      setErrorMessage('Please enter a valid email address (e.g., name@domain.com).');
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
          source: 'website',
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
    <section
      id="waitlist"
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-24 scroll-mt-20"
      aria-label="Waitlist and Inquiries"
    >
      <div className="rounded-3xl glass-panel-elevated p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl border border-[#a6dcf8]/30">
        {/* Subtle background ambient glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a6dcf8 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-xl mx-auto">
          <span className="text-xs uppercase tracking-widest font-mono text-[#a6dcf8] px-3 py-1 rounded-full bg-[#101c27] border border-[#a6dcf8]/20">
            Early Access
          </span>

          <h2 className="font-serif italic text-3xl sm:text-5xl text-[#fbf4e3] mt-4 leading-tight">
            Join the Prototype Waitlist
          </h2>
          <p className="text-[#cfc8b8] text-sm mt-3 leading-relaxed">
            We are admitting testers in small cohorts to verify destination accuracy and gather feedback on reel analysis.
          </p>

          {status === 'success' ? (
            <div className="mt-8 p-6 rounded-2xl bg-[#2D6A4F]/20 border border-[#2D6A4F]/50 text-center animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-[#2D6A4F] text-[#fbf4e3] flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                &#10003;
              </div>
              <h3 className="text-base font-semibold text-[#fbf4e3]">
                {isDuplicate ? "You're already on the VAMO waitlist" : "You're on the list"}
              </h3>
              <p className="text-xs text-[#cfc8b8] mt-1.5 max-w-sm mx-auto">
                {isDuplicate
                  ? "We already have your email saved. You'll receive an invitation as soon as the next testing cohort opens."
                  : "Thank you! We'll let you know as soon as testing invites are ready."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setIsDuplicate(false);
                }}
                className="mt-4 text-xs text-[#a6dcf8] hover:underline font-mono"
              >
                Submit another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center gap-4">
              {/* Invisible Honeypot field for bot mitigation */}
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

              <div className="w-full flex flex-col sm:flex-row gap-2 max-w-md">
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="waitlist-email"
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
                  className="px-6 py-3.5 rounded-xl bg-[#fbf4e3] hover:bg-white text-[#070d12] font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {status === 'submitting' ? 'Joining...' : 'Get Early Access'}
                </button>
              </div>

              {/* Explicit Consent Checkbox */}
              <div className="flex items-start gap-2 max-w-md text-left px-1">
                <input
                  id="waitlist-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (status === 'error') setStatus('idle');
                  }}
                  disabled={status === 'submitting'}
                  className="mt-0.5 w-4 h-4 rounded border-[#fbf4e3]/20 bg-[#070d12] text-[#a6dcf8] focus:ring-[#a6dcf8] focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="waitlist-consent" className="text-xs text-[#cfc8b8] cursor-pointer leading-tight select-none">
                  I agree to receive early access updates and release notifications from VAMO.
                </label>
              </div>

              {status === 'error' && errorMessage && (
                <p className="text-xs text-[#e53935] mt-1 text-center" role="alert">
                  {errorMessage}
                </p>
              )}

              <p className="text-[11px] text-[#cfc8b8]/60 mt-1">
                No spam. Zero tracking. Direct PostgreSQL storage with RLS encryption.
              </p>
            </form>
          )}

          {/* Mobile Preview Link */}
          <div className="mt-10 pt-6 border-t border-[#fbf4e3]/10 flex items-center justify-center text-xs text-[#cfc8b8]">
            <Link
              href="/qr"
              className="inline-flex items-center gap-1.5 text-[#a6dcf8] hover:underline"
            >
              <span>Scan QR Code to preview on phone &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
