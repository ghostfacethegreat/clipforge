"use client";

import { motion } from "framer-motion";
import { Check, Link2, Loader2, Radio, RefreshCw, Trash2, Youtube } from "lucide-react";
import { useState } from "react";
import type { AppConfig, AutoPublish, Channel, ClipOptions } from "@/lib/types";

type Props = {
  config: AppConfig | null;
  channels: Channel[];
  busy: boolean;
  onAdd: (url: string, options: ClipOptions, auto: AutoPublish) => void;
  onPatch: (id: string, patch: Partial<Channel>) => void;
  onDelete: (id: string) => void;
  onScan: (id: string) => void;
};

export function ChannelsPanel({ config, channels, busy, onAdd, onPatch, onDelete, onScan }: Props) {
  const [url, setUrl] = useState("");
  const [autoPost, setAutoPost] = useState(false);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [campaign, setCampaign] = useState("");

  const connect = () => {
    if (!url.trim()) return;
    onAdd(url.trim(), {
      count: 6, min_duration: 12, max_duration: 45,
      caption_style: "hype", keywords: "", focus: "auto",
    }, {
      enabled: autoPost,
      destinations,
      rewards: Boolean(campaign),
      campaign_id: campaign || null,
      max_clips: 3,
    });
    setUrl("");
  };

  const toggle = (id: string) => setDestinations((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <section id="channels" className="scroll-mt-24">
      <SectionTitle icon={<Radio className="h-4 w-4" />} title="Channels" subtitle="Connect a YouTube channel once. Every new upload gets clipped and posted automatically." />

      <div className="glass rounded-2xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 focus-within:border-accent">
            <Youtube className="h-4 w-4 text-white/35" />
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/@handle" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/25" />
          </div>
          <button onClick={connect} disabled={!url.trim() || busy} className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Connect channel
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setAutoPost((value) => !value)} className={`flex items-center gap-2 text-xs ${autoPost ? "text-lime" : "text-white/45"}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${autoPost ? "border-lime bg-lime text-ink" : "border-white/25"}`}>{autoPost && <Check className="h-3 w-3" />}</span>
            Auto-post new clips
          </button>
          {autoPost && (
            <>
              {(config?.destinations ?? []).filter((item) => item.id !== "rewards").map((destination) => (
                <button key={destination.id} onClick={() => toggle(destination.id)} className={`rounded-full border px-3 py-1 text-[11px] ${destinations.includes(destination.id) ? "border-lime bg-lime/10 text-lime" : "border-white/10 text-white/40"}`}>
                  {destination.name}
                </button>
              ))}
              <select value={campaign} onChange={(event) => setCampaign(event.target.value)} className="input max-w-[220px] py-1.5 text-xs">
                <option value="">No rewards campaign</option>
                {(config?.campaigns ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {channels.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-white/35 md:col-span-2">
            No channels connected yet. Paste a channel URL above and Clipforge will watch it for new uploads.
          </div>
        )}
        {channels.map((channel, index) => (
          <motion.div key={channel.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{channel.name || channel.url.split("/").pop()}</p>
                <p className="mt-0.5 truncate text-[11px] text-white/35">{channel.url}</p>
              </div>
              <button onClick={() => onPatch(channel.id, { active: !channel.active })} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] ${channel.active ? "border-lime/30 bg-lime/10 text-lime" : "border-white/10 text-white/40"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${channel.active ? "bg-lime" : "bg-white/30"}`} />
                {channel.active ? "watching" : "paused"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/40">
              <span className="rounded-full bg-white/5 px-2.5 py-1">{channel.seen_videos.length} videos seen</span>
              <span className="rounded-full bg-white/5 px-2.5 py-1">{Number(channel.options.count ?? 6)} clips / video</span>
              {channel.auto_publish.enabled && <span className="rounded-full bg-accent/10 px-2.5 py-1 text-accent">auto-post · {channel.auto_publish.destinations.length || 0} platforms</span>}
            </div>
            {channel.last_scan && <p className="mt-2 text-[10px] text-white/25">Last scan {new Date(channel.last_scan).toLocaleString()}</p>}
            {channel.error && <p className="mt-2 text-[11px] text-red-300">{channel.error}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => onScan(channel.id)} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/60 hover:border-white/25 hover:text-white"><RefreshCw className="h-3 w-3" /> Scan now</button>
              <button onClick={() => onDelete(channel.id)} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/40 hover:border-red-400/40 hover:text-red-300"><Trash2 className="h-3 w-3" /> Remove</button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>
      </div>
    </div>
  );
}
