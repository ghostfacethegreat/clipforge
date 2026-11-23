"use client";

import { motion } from "framer-motion";
import { Download, Loader2, Save, Scissors, WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import type { AppConfig, Clip, ClipOptions } from "@/lib/types";
import { formatTime } from "@/lib/types";

type Props = {
  clip: Clip | null;
  config: AppConfig | null;
  duration: number;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Clip>) => void;
};

export function EditorModal({ clip, config, duration, saving, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(1);
  const [style, setStyle] = useState("hype");
  const [focus, setFocus] = useState("auto");
  const [captions, setCaptions] = useState(true);
  const [cacheKey, setCacheKey] = useState(0);

  useEffect(() => {
    if (!clip) return;
    setTitle(clip.title);
    setStart(clip.start);
    setEnd(clip.end);
    setStyle(clip.caption_style);
    setFocus(clip.focus);
    setCaptions(clip.captions_enabled);
    setCacheKey(Date.now());
  }, [clip]);

  const max = duration || Math.max(end, 60);
  const trimmed = Math.max(0, end - start);

  return (
    <Modal open={Boolean(clip)} title="Edit clip" subtitle="Trim, restyle and re-render in one click" onClose={onClose} wide>
      {clip && (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="relative mx-auto max-h-[65vh] overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                key={`${clip.id}-${cacheKey}`}
                src={`${clip.video_url}?v=${cacheKey}`}
                controls
                playsInline
                className="mx-auto max-h-[65vh] w-full object-contain"
              />
            </div>
            <a
              href={clip.video_url}
              download
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/70 transition hover:border-lime/40 hover:text-lime"
            >
              <Download className="h-4 w-4" /> Download MP4
            </a>
          </div>

          <div className="space-y-5">
            <Labeled label="Clip title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </Labeled>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  <Scissors className="h-3.5 w-3.5" /> Trim
                </span>
                <span className="rounded-full bg-lime/10 px-2.5 py-1 text-[11px] font-medium text-lime">
                  {formatTime(trimmed)}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-white/40">
                    <span>Start</span><span>{formatTime(start)}</span>
                  </div>
                  <input type="range" min={0} max={max} step={0.1} value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), end - 2))} className="w-full" />
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-white/40">
                    <span>End</span><span>{formatTime(end)}</span>
                  </div>
                  <input type="range" min={0} max={max} step={0.1} value={end} onChange={(event) => setEnd(Math.max(Number(event.target.value), start + 2))} className="w-full" />
                </div>
              </div>
            </div>

            <Labeled label="Caption style">
              <div className="flex flex-wrap gap-2">
                {(config?.caption_styles ?? [{ id: "hype", label: "Hype" }, { id: "clean", label: "Clean" }, { id: "neon", label: "Neon" }]).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setStyle(option.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      style === option.id ? "border-lime bg-lime/10 text-lime" : "border-white/10 text-white/50 hover:border-white/25"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Labeled>

            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Speaker focus">
                <select value={focus} onChange={(event) => setFocus(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent">
                  <option value="auto">Auto</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Labeled>
              <Labeled label="Captions">
                <button
                  onClick={() => setCaptions((value) => !value)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${captions ? "border-lime/40 bg-lime/5 text-lime" : "border-white/10 text-white/50"}`}
                >
                  {captions ? "Enabled" : "Off"}
                </button>
              </Labeled>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              onClick={() => onSave({ title, start, end, caption_style: style, focus: focus as ClipOptions["focus"], captions_enabled: captions })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-ink transition hover:bg-lime disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
              {saving ? "Re-rendering…" : "Save & re-render"}
              {!saving && <Save className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      {children}
    </label>
  );
}
