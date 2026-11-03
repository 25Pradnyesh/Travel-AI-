import type { Metadata } from 'next';
import { WaitlistClient } from './WaitlistClient';

export const metadata: Metadata = {
  title: 'Join the Early Access Waitlist — VAMO',
  description:
    'Be the first to experience VAMO. Early access registration for AI-powered destination recognition and travel dossiers from Instagram Reels.',
  openGraph: {
    title: 'Join the Early Access Waitlist — VAMO',
    description:
      'AI destination detection for travel reels. Reserve your spot for upcoming private testing cohorts.',
    url: '/waitlist',
  },
};

export default function WaitlistPage() {
  return <WaitlistClient />;
}

