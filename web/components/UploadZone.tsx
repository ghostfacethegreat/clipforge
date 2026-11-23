"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check, FileVideo, Link2, Loader2, Settings2, UploadCloud, WandSparkles } from "lucide-react";
import { useRef, useState } from "react";
import type { AppConfig, AutoPublish, ClipOptions } from "@/lib/types";

type Props = {
  config: AppConfig | null;
  busy: boolean;
  onUrl: (url: string, options: ClipOptions, autoPublish: AutoPublish) => void;
  onFile: (file: File, options: ClipOptions) => void;
};

const defaultAuto: AutoPublish = { enabled: false, destinations: [], rewards: false, campaign_id: null, max_clips: 3 };

export function UploadZone({ config, busy, onUrl, onFile }: Props) {
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [options, setOptions] = useState<ClipOptions>({
    count: 6,
    min_duration: 12,
    max_duration: 45,
    caption_style: "hype",
    keywords: "",
    focus: "auto",
  });
  const [auto, setAuto] = useState<AutoPublish>(defaultAuto);
  const inputRef = useRef<HTMLInputElement>(null);

  const isChannel = /youtube\.com\/(@|channel\/|c\/|user\/|videos|playlist)/i.test(url);
  const canSubmit = mode === "url" ? url.trim().startsWith("http") : Boolean(file);

  const toggleDestination = (id: string) =>
    setAuto((current) => ({
      ...current,
      destinations: current.destinations.includes(id) ? current.destinations.filter((item) => item !== id) : [...current.destinations, id],
    }));

  return (
    <motion.div
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="glass rounded-3xl p-2 shadow-2xl shadow-black/40"
    >
      <div className="flex gap-1 px-2 pt-1">
        <Tab active={mode === "url"} onClick={() => setMode("url")} icon={<Link2 className="h-3.5 w-3.5" />} label="Paste a link" />
        <Tab active={mode === "file"} onClick={() => setMode("file")} icon={<FileVideo className="h-3.5 w-3.5" />} label="Upload file" />
      </div>

      {mode === "url" ? (
        <div className="relative m-2 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="relative">
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-white/40">Video or channel URL</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 focus-within:border-accent">
                <Link2 className="h-4 w-4 shrink-0 text-white/35" />
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && canSubmit && !busy && onUrl(url.trim(), options, auto)}
                  placeholder="https://www.youtube.com/watch?v=… or @channel"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/25"
                />
              </div>
              <button
                disabled={!canSubmit || busy}
                onClick={() => onUrl(url.trim(), options, auto)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-lime disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                {busy ? "Working…" : "Make clips"}
                {!busy && <ArrowUpRight className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-white/40">
              {isChannel
                ? "Channel detected — use the Channels section below to monitor new uploads automatically."
                : "Paste any public YouTube video link. We download it, find the best moments and render the clips."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/30">
              <Pill>youtube.com/watch?v=…</Pill>
              <Pill>youtu.be/…</Pill>
              <Pill>youtube.com/@handle</Pill>
              <Pill>youtube.com/shorts/…</Pill>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); setFile(event.dataTransfer.files?.[0] ?? null); }}
          onClick={() => !busy && inputRef.current?.click()}
          className={`m-2 flex cursor-pointer flex-col items-center rounded-[20px] border border-dashed px-6 py-10 text-center transition ${dragging ? "border-lime bg-lime/5" : "border-white/15 hover:border-accent/60 hover:bg-accent/5"} ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <UploadCloud className="h-6 w-6 text-white/70" />
          </div>
          <p className="text-sm font-semibold">{file ? file.name : "Drop a video here, or click to browse"}</p>
          <p className="mt-1 text-xs text-white/40">MP4, MOV or WebM</p>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          {file && (
            <button
              disabled={busy}
              onClick={(event) => { event.stopPropagation(); onFile(file, options); }}
              className="mt-4 flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-ink hover:bg-lime"
            >
              Make clips <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowOptions((value) => !value)} className="flex items-center gap-2 text-xs font-medium text-white/60 transition hover:text-white">
            <Settings2 className="h-4 w-4" /> Clip settings
            <span className="text-white/30">{options.count} clips · {options.min_duration}–{options.max_duration}s</span>
          </button>
          <button onClick={() => setShowAuto((value) => !value)} className="flex items-center gap-2 text-xs font-medium text-white/60 transition hover:text-white">
            <UploadCloud className="h-4 w-4" /> Auto-post
            {auto.enabled && <span className="rounded-full bg-lime/10 px-2 py-0.5 text-[10px] text-lime">on</span>}
          </button>
        </div>
      </div>

      {(showOptions || showAuto) && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden border-t border-white/5 px-4 pb-4 pt-4">
          {showOptions && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Number of clips">
                <input type="number" min={1} max={30} value={options.count} onChange={(event) => setOptions({ ...options, count: Number(event.target.value) })} className="input" />
              </Field>
              <Field label="Min length (sec)">
                <input type="number" min={5} max={60} value={options.min_duration} onChange={(event) => setOptions({ ...options, min_duration: Number(event.target.value) })} className="input" />
              </Field>
              <Field label="Max length (sec)">
                <input type="number" min={10} max={180} value={options.max_duration} onChange={(event) => setOptions({ ...options, max_duration: Number(event.target.value) })} className="input" />
              </Field>
              <Field label="Caption style">
                <select value={options.caption_style} onChange={(event) => setOptions({ ...options, caption_style: event.target.value })} className="input">
                  {(config?.caption_styles ?? [{ id: "hype", label: "Hype" }, { id: "clean", label: "Clean" }, { id: "neon", label: "Neon" }]).map((style) => (
                    <option key={style.id} value={style.id}>{style.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Speaker focus">
                <select value={options.focus} onChange={(event) => setOptions({ ...options, focus: event.target.value as ClipOptions["focus"] })} className="input">
                  <option value="auto">Auto detect</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                </select>
              </Field>
              <Field label="Topic keywords">
                <input value={options.keywords} onChange={(event) => setOptions({ ...options, keywords: event.target.value })} placeholder="AI, startup, productivity" className="input" />
              </Field>
            </div>
          )}
          {showAuto && (
            <div className={`${showOptions ? "mt-5 border-t border-white/5 pt-5" : ""} space-y-3`}>
              <button onClick={() => setAuto({ ...auto, enabled: !auto.enabled })} className={`flex items-center gap-2 text-sm font-medium ${auto.enabled ? "text-lime" : "text-white/60"}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${auto.enabled ? "border-lime bg-lime text-ink" : "border-white/25"}`}>
                  {auto.enabled && <Check className="h-3 w-3" />}
                </span>
                Auto-post finished clips
              </button>
              {auto.enabled && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(config?.destinations ?? []).filter((item) => item.id !== "rewards").map((destination) => (
                      <button
                        key={destination.id}
                        onClick={() => toggleDestination(destination.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${auto.destinations.includes(destination.id) ? "border-lime bg-lime/10 text-lime" : "border-white/10 text-white/45 hover:border-white/25"}`}
                      >
                        {destination.name} {!destination.configured && <span className="text-white/25">· setup</span>}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Max clips to post">
                      <input type="number" min={1} max={30} value={auto.max_clips} onChange={(event) => setAuto({ ...auto, max_clips: Number(event.target.value) })} className="input" />
                    </Field>
                    <Field label="Content Rewards campaign">
                      <select
                        value={auto.campaign_id ?? ""}
                        onChange={(event) => setAuto({ ...auto, campaign_id: event.target.value || null, rewards: Boolean(event.target.value) })}
                        className="input"
                      >
                        <option value="">None</option>
                        {(config?.campaigns ?? []).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name} · ${campaign.cpm}/1k</option>)}
                      </select>
                    </Field>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition ${active ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
      {icon} {label}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1">{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      {children}
    </label>
  );
}
