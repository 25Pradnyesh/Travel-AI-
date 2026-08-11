"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-xl">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2"
        >
          <Compass className="h-5 w-5 text-blue-500" />

          <span className="text-sm font-semibold tracking-tight text-white">
            Travel AI
          </span>
        </motion.div>

        <div className="hidden items-center gap-7 md:flex">
          {["Features", "Roadmap", "GitHub"].map((item) => (
            <motion.a
              key={item}
              href="#"
              whileHover={{ y: -1 }}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {item}
            </motion.a>
          ))}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
