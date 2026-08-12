"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
    >
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[180px]" />

        <div className="absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[180px]" />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 font-medium uppercase tracking-widest text-blue-400"
        >
          Travel Discovery
        </motion.p>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-black leading-tight md:text-8xl"
        >
          Transform
          <br />
          <span className="text-blue-500">Instagram Reels</span>
          <br />
          Into Real Trips.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mx-auto mt-8 max-w-2xl text-lg text-zinc-400"
        >
          Your next trip is hiding in your feed.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 flex flex-col justify-center gap-4 sm:flex-row"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold transition hover:bg-blue-500"
          >
            Analyze Reel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            className="rounded-full border border-white/20 px-8 py-4 text-lg transition hover:bg-white/10"
          >
            Watch Demo
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.a
        href="#discover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex cursor-pointer flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Scroll
          </span>

          <div className="h-8 w-px bg-gradient-to-b from-zinc-500 to-transparent" />
        </motion.div>
      </motion.a>
    </section>
  );
}
