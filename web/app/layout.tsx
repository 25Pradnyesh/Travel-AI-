import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travel AI — Turn Travel Reels Into Places Worth Visiting",
  description:
    "Travel AI extracts destinations and locations from travel content, turning social media inspiration into structured travel intelligence.",
  openGraph: {
    title: "Travel AI — Turn Travel Reels Into Places Worth Visiting",
    description:
      "Travel AI extracts destinations and locations from travel content, turning social media inspiration into structured travel intelligence.",
    type: "website",
    siteName: "Travel AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel AI — Turn Travel Reels Into Places Worth Visiting",
    description:
      "Travel AI extracts destinations and locations from travel content, turning social media inspiration into structured travel intelligence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
