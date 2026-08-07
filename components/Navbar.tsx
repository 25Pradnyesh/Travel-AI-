"use client";

import { Compass } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Compass className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold tracking-tight text-white">
            Travel AI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-300">
          <a href="#" className="hover:text-white transition">
            Features
          </a>

          <a href="#" className="hover:text-white transition">
            Roadmap
          </a>

          <a href="#" className="hover:text-white transition">
            GitHub
          </a>

          <button className="rounded-full bg-white text-black px-5 py-2 font-medium hover:scale-105 transition">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
