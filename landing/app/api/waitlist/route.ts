import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabase-server';

// In-memory sliding rate limiter: max 5 requests per 10 minutes per IP
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const ipRateLimitStore = new Map<string, RateLimitEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitStore.get(ip);

  // Periodic cleanup if store grows large
  if (ipRateLimitStore.size > 10000) {
    for (const [key, val] of ipRateLimitStore.entries()) {
      if (val.resetAt < now) {
        ipRateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    ipRateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

function isValidEmail(email: string): boolean {
  if (!email || email.length < 3 || email.length > 254) {
    return false;
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

export async function POST(request: Request) {
  try {
    // 1. IP extraction & Rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again in a few minutes.',
        },
        { status: 429 }
      );
    }

    // 2. Body parsing
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON request payload.',
        },
        { status: 400 }
      );
    }

    const { email, consent, source, honeypot, website } = body || {};

    // 3. Honeypot check (anti-bot)
    // If a hidden honeypot field was filled out, silently succeed to fool automated bots
    if (honeypot || website) {
      return NextResponse.json(
        {
          success: true,
          message: "You're on the list. We'll let you know when VAMO is ready.",
        },
        { status: 200 }
      );
    }

    // 4. Validate consent
    if (consent !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Consent is required to join the waitlist.',
        },
        { status: 400 }
      );
    }

    // 5. Email normalization & validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email address is required.',
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid email address (e.g. name@example.com).',
        },
        { status: 400 }
      );
    }

    const signupSource =
      typeof source === 'string' && source.trim() ? source.trim().slice(0, 50) : 'website';

    // 6. Supabase Persistence
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      console.error(
        '[Waitlist API] Supabase client unavailable: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Waitlist registration service is currently unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    const { error } = await supabase.from('waitlist_signups').insert({
      email: normalizedEmail,
      consent: true,
      source: signupSource,
      status: 'active',
    });

    if (error) {
      // Postgres unique constraint code 23505
      if (
        error.code === '23505' ||
        error.message.includes('idx_waitlist_signups_email_lower') ||
        error.message.toLowerCase().includes('duplicate key')
      ) {
        return NextResponse.json(
          {
            success: true,
            duplicate: true,
            message: "You're already on the VAMO waitlist. We have your email saved.",
          },
          { status: 200 }
        );
      }

      console.error('[Waitlist API] Error inserting signup:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to process signup at this moment. Please try again later.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "You're on the list. We'll let you know when VAMO is ready.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Waitlist API] Unexpected error:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}

