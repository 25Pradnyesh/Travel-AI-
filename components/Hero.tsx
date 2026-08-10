"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[180px]" />

        <div className="absolute right-1/4 bottom-10 h-96 w-96 rounded-full bg-cyan-500/20 blur-[180px]" />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 text-blue-400 font-medium tracking-widest uppercase"
        >
          AI Powered Travel Discovery
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-black leading-tight"
        >
          Transform
          <br />
          <span className="text-blue-500">Instagram Reels</span>
          <br />
          Into Real Trips.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-8 max-w-2xl text-lg text-zinc-400"
        >
          Discover hidden destinations using OCR, Speech Recognition, Google
          Places and Gemini AI — then save them forever.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col gap-4 justify-center sm:flex-row"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold hover:bg-blue-500 transition"
          >
            Analyze Reel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="rounded-full border border-white/20 px-8 py-4 text-lg hover:bg-white/10 transition"
          >
            Watch Demo
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
