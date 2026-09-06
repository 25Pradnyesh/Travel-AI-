"use client";

import { motion } from "framer-motion";
import { ArrowRight, Link as LinkIcon, Loader2 } from "lucide-react";

interface HeroProps {
  url: string;
  onUrlChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  error: string;
}

export default function Hero({
  url,
  onUrlChange,
  onAnalyze,
  isLoading,
  error,
}: HeroProps) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[180px]" />
        <div className="absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[180px]" />
      </div>

      <div className="mx-auto w-full max-w-5xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 font-medium uppercase tracking-widest text-blue-400"
        >
          Travel Discovery
        </motion.p>

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

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mx-auto mt-8 max-w-2xl text-lg text-zinc-400"
        >
          Your next trip is hiding in your feed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mx-auto mt-10 w-full max-w-2xl"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div
              className={`flex flex-1 items-center gap-3 rounded-full border bg-white/[0.04] px-5 py-4 backdrop-blur-xl transition ${
                error
                  ? "border-red-500/50"
                  : "border-white/10 focus-within:border-blue-500/50"
              } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <LinkIcon className="h-5 w-5 shrink-0 text-zinc-500" />

              <input
                type="url"
                value={url}
                disabled={isLoading}
                onChange={(event) => {
                  onUrlChange(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isLoading) {
                    onAnalyze();
                  }
                }}
                placeholder="Paste an Instagram Reel URL (e.g. https://www.instagram.com/reel/...)"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
              />
            </div>

            <motion.button
              whileHover={isLoading ? {} : { scale: 1.03 }}
              whileTap={isLoading ? {} : { scale: 0.97 }}
              onClick={onAnalyze}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-75 disabled:cursor-not-allowed min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>

          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center justify-center gap-2 text-xs text-blue-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span>Analyzing Reel... Running location intelligence pipeline</span>
            </motion.div>
          ) : error ? (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-left text-sm text-red-400"
            >
              {error}
            </motion.p>
          ) : (
            <p className="mt-3 text-xs text-zinc-600">
              Public Instagram Reels only
            </p>
          )}
        </motion.div>
      </div>

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
