"use client";

import { motion } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, Clapperboard, Download,
  Film, FolderLock, Link2, Play, Scissors, Sparkles, WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const sourceZip = "https://github.com/ghostfacethegreat/clipforge/archive/refs/heads/feat/clipforge-brand-studio.zip";
const supportUrl = process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL;

const workflow = [
  {
    number: "01",
    title: "Bring your footage",
    description: "Upload a video file or paste a source link you own or are authorized to edit.",
    detail: "ClipForge creates a local job and prepares the source for analysis.",
    icon: Link2,
  },
  {
    number: "02",
    title: "Find the moments",
    description: "Local Whisper transcription and moment scoring surface promising sections.",
    detail: "Review the transcript and ranked candidates. Scores are suggestions, not a promise of reach.",
    icon: WandSparkles,
  },
  {
    number: "03",
    title: "Polish and export",
    description: "Reframe for vertical feeds, style captions, trim, preview, and download.",
    detail: "Keep the final say on every clip. Publishing and campaign submission are separate actions.",
    icon: Scissors,
  },
];

const features = [
  {
    icon: WandSparkles,
    title: "Moment discovery",
    body: "Word-level transcription and scoring help surface hooks, pacing changes, keywords, and pauses worth reviewing.",
    tag: "LOCAL AI",
  },
  {
    icon: Film,
    title: "Vertical-ready edits",
    body: "Turn selected moments into portrait 9:16 videos with caption styling and optional face-aware framing.",
    tag: "1080 × 1920",
  },
  {
    icon: Clapperboard,
    title: "Your edit, your call",
    body: "Adjust trims, titles, captions, framing, and focus before exporting a final clip.",
    tag: "HUMAN REVIEW",
  },
  {
    icon: FolderLock,
    title: "Local-first workflow",
    body: "The self-hosted app keeps project files on your machine. Back up your work and protect your source media.",
    tag: "YOUR MACHINE",
  },
];

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const step = workflow[activeStep];

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none fixed -left-40 top-32 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[140px]" />
      <div className="pointer-events-none fixed -right-40 top-0 h-[520px] w-[520px] rounded-full bg-lime/5 blur-[140px]" />

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080a12]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="ClipForge home">
            <span className="brand-mark">
              <img src="/clipforge-identity.jpg" alt="" />
            </span>
            <span>
              <span className="block text-[15px] font-black tracking-[0.16em]">CLIPFORGE</span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.24em] text-white/35">The creator clipping studio</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-[12px] font-medium text-white/55 lg:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#workflow" className="transition hover:text-white">How it works</a>
            <a href="#get-started" className="transition hover:text-white">Download</a>
            <a href="#support" className="transition hover:text-white">Support</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/studio" className="hidden rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/5 sm:inline-flex">
              Open studio
            </Link>
            <a href={sourceZip} className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2.5 text-xs font-bold text-[#10120c] shadow-[0_0_34px_rgba(185,247,84,0.16)] transition hover:-translate-y-0.5 hover:bg-[#d4ff8c]">
              <Download className="h-3.5 w-3.5" /> Get ClipForge
            </a>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-lime">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
              Local-first AI video workflow
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl xl:text-[76px]">
              Long video.
              <span className="mt-2 block text-gradient">Better moments.</span>
              <span className="mt-2 block">Your next clip.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-7 text-white/55 sm:text-base">
              ClipForge helps creators turn long-form footage into short vertical edits with AI-assisted moment discovery, captions, reframing, and a hands-on editor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="group inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-bold text-[#10120c] transition hover:-translate-y-0.5 hover:bg-[#d4ff8c]">
                <Play className="h-4 w-4 fill-current" /> Open the studio <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a href={sourceZip} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.035] px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.07]">
                <Download className="h-4 w-4" /> Download source
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-white/40">
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> Whisper transcription</span>
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> No paid AI API required for core flow</span>
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> Human-controlled exports</span>
            </div>
            <p className="mt-5 max-w-lg text-[10px] leading-5 text-white/30">
              Self-hosted developer preview. Start the local API before opening the studio. Process only footage you own or are authorized to use.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.12 }} className="relative mx-auto w-full max-w-[520px]">
            <div className="poster-halo" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[#11131b] p-2 shadow-[0_36px_110px_rgba(0,0,0,0.55)]">
              <div className="relative overflow-hidden rounded-[23px] bg-[#171923]">
                <img
                  src="/clipforge-identity.jpg"
                  alt="ClipForge's glowing one-eyed starburst mascot above a dark cloaked figure"
                  className="brand-poster"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080a12] via-transparent to-black/10" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-lime">Made to find the moment</span>
                    <p className="mt-1 text-2xl font-black tracking-tight">CLIPFORGE</p>
                    <p className="text-[10px] text-white/55">Cut the noise. Keep the story.</p>
                  </div>
                  <div className="rounded-full border border-white/20 bg-black/35 p-3 backdrop-blur-xl">
                    <Sparkles className="h-5 w-5 text-lime" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-5 top-16 hidden rounded-2xl border border-white/10 bg-[#10131b]/90 p-3 shadow-2xl backdrop-blur-xl sm:block">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-white/70"><span className="h-2 w-2 rounded-full bg-lime" /> TRANSCRIPT READY</div>
              <div className="mt-2 flex h-7 items-end gap-1">
                {Array.from({ length: 18 }, (_, i) => <span key={i} className="w-1 rounded-full bg-lime/70" style={{ height: `${8 + ((i * 11) % 20)}px` }} />)}
              </div>
            </div>
            <div className="absolute -right-3 bottom-24 hidden rounded-2xl border border-white/10 bg-[#10131b]/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Output format</p>
              <p className="mt-1 text-sm font-bold">9:16 vertical</p>
              <p className="text-[10px] text-lime">1080 × 1920 target</p>
            </div>
          </motion.div>
        </section>

        <section className="border-y border-white/[0.06] bg-white/[0.018]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-5 py-7 sm:px-8 md:grid-cols-4">
            {[
              ["01", "Transcribe locally", "Whisper-powered"],
              ["02", "Rank moments", "Review candidates"],
              ["03", "Style captions", "Edit the details"],
              ["04", "Export clips", "Your final approval"],
            ].map(([n, title, detail]) => (
              <div key={n} className="flex items-start gap-3">
                <span className="font-mono text-xs text-lime">{n}</span>
                <div><p className="text-xs font-bold">{title}</p><p className="mt-1 text-[10px] text-white/35">{detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime">A focused creator toolkit</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Everything between the long take and the short.</h2>
            <p className="mt-4 text-sm leading-6 text-white/45">AI handles the repetitive first pass. You decide what deserves to be published.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article key={feature.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.06 }} className="feature-card group">
                  <div className="flex items-start justify-between gap-4">
                    <span className="feature-icon"><Icon className="h-5 w-5" /></span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-white/35">{feature.tag}</span>
                  </div>
                  <h3 className="mt-7 text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-white/45">{feature.body}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="scroll-mt-28 border-y border-white/[0.06] bg-[#0c0f18]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime">Three simple stages</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">From source to short-form.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/45">A guided workflow keeps the technical work organized without taking creative control away from you.</p>
              <div className="mt-8 space-y-2">
                {workflow.map((item, index) => (
                  <button key={item.number} onClick={() => setActiveStep(index)} aria-pressed={activeStep === index} className={`workflow-step ${activeStep === index ? "workflow-step-active" : ""}`}>
                    <span className="font-mono text-xs text-lime">{item.number}</span>
                    <span className="flex-1 text-left text-sm font-semibold">{item.title}</span>
                    <ArrowRight className="h-4 w-4 text-white/30" />
                  </button>
                ))}
              </div>
            </div>
            <motion.div key={step.number} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="workflow-panel">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime">Stage {step.number}</span>
              <h3 className="mt-5 text-2xl font-black tracking-tight">{step.title}</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">{step.description}</p>
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-lime/15 bg-lime/[0.055] p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <p className="text-xs leading-6 text-white/65">{step.detail}</p>
              </div>
              <div className="mt-10 flex items-center gap-2 text-[10px] text-white/30">
                <span className="h-px flex-1 bg-white/10" />
                SELECT A STAGE TO EXPLORE
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </motion.div>
          </div>
        </section>

        <section id="get-started" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#171629] via-[#111421] to-[#0d1118] p-7 sm:p-10 lg:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime">Start on your machine</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Your studio. Your footage. Your exports.</h2>
                <p className="mt-4 text-sm leading-7 text-white/50">Download the source snapshot and follow the setup guide. ClipForge currently runs as a self-hosted application; a managed cloud service and paid software plans are not enabled yet.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href={sourceZip} className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-xs font-bold text-[#10120c] transition hover:bg-[#d4ff8c]"><Download className="h-4 w-4" /> Download source ZIP</a>
                  <a href="https://github.com/ghostfacethegreat/clipforge#quick-start" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs font-semibold text-white/75 transition hover:bg-white/5">Setup instructions <ArrowUpRight className="h-3.5 w-3.5" /></a>
                </div>
                <p className="mt-5 text-[10px] leading-5 text-white/30">Requires Python, Node.js, and FFmpeg. The studio route connects to the local API on port 8000.</p>
              </div>
              <div className="flex w-full max-w-[290px] flex-col gap-3">
                {["Python 3.11+", "Node.js 18+", "FFmpeg / FFprobe"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65"><Check className="h-4 w-4 text-lime" /> {item}</div>)}
                <Link href="/studio" className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#10120c] transition hover:bg-lime">Open ClipForge Studio <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section id="support" className="mx-auto max-w-7xl scroll-mt-28 px-5 pb-24 sm:px-8">
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime">Independent project</p>
              <h2 className="mt-3 text-xl font-bold">Help keep ClipForge moving.</h2>
              <p className="mt-2 max-w-xl text-xs leading-6 text-white/40">Support is optional and voluntary. A contribution is not a software purchase or a promise of future features.</p>
            </div>
            {supportUrl ? (
              <a href={supportUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-lime/25 bg-lime/10 px-5 py-3 text-xs font-bold text-lime transition hover:bg-lime/15">Buy Me a Coffee <ArrowUpRight className="h-4 w-4" /></a>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-semibold text-white/35" title="Set NEXT_PUBLIC_BUY_ME_A_COFFEE_URL to enable this button">Support link awaiting setup</span>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-[10px] text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="brand-mark brand-mark-small"><img src="/clipforge-identity.jpg" alt="" /></span>
            <span className="font-bold tracking-[0.16em] text-white/65">CLIPFORGE</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <a className="transition hover:text-white" href="https://github.com/ghostfacethegreat/clipforge" target="_blank" rel="noreferrer">GitHub</a>
            <Link className="transition hover:text-white" href="/studio">Studio</Link>
            <a className="transition hover:text-white" href="#get-started">Download</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
