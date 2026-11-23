"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 border-b border-white/5 bg-ink/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-lime shadow-glow">
            <Sparkles className="h-5 w-5 text-ink" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">Clipforge</span>
          <span className="ml-2 hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-white/45 sm:inline">
            beta
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-3 py-1.5 text-xs font-medium text-lime sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            Local AI · No API key needed
          </span>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#studio" className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white">Studio</a>
            <a href="#channels" className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white">Channels</a>
            <a href="#rewards" className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white">Rewards</a>
            <a href="#analytics" className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white">Analytics</a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
