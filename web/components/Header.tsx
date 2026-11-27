"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Header() {
  return (
    <motion.header initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="sticky top-0 z-30 border-b border-white/5 bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ClipForge home">
          <span className="brand-mark brand-mark-nav"><img src="/clipforge-identity.jpg" alt="" /></span>
          <span className="text-lg font-black tracking-[0.12em]">CLIPFORGE</span>
          <span className="ml-1 hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-white/45 sm:inline">studio</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-3 py-1.5 text-xs font-medium text-lime sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Local AI · Self-hosted
          </span>
          <nav className="flex items-center gap-1">
            <Link href="/#features" className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white md:inline-flex">Features</Link>
            <a href="#studio" className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white">Studio</a>
            <a href="#channels" className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white sm:inline-flex">Channels</a>
            <a href="#rewards" className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition hover:text-white sm:inline-flex">Rewards</a>
            <Link href="/" className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:bg-white/5">Home <ArrowUpRight className="h-3 w-3" /></Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
