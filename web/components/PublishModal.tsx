"use client";

import { motion } from "framer-motion";
import { Check, Facebook, Gift, Instagram, Loader2, Music2, Send, Trophy, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import type { AppConfig, Clip, PublishResult } from "@/lib/types";

type Props = {
  clip: Clip | null;
  config: AppConfig | null;
  results: PublishResult[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { destinations: string[]; rewards: boolean; title?: string; description: string; schedule_at: string | null; visibility: string }) => void;
};

const icons: Record<string, React.ReactNode> = {
  youtube: <Youtube className="h-5 w-5" />,
  tiktok: <Music2 className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  rewards: <Gift className="h-5 w-5" />,
};

export function PublishModal({ clip, config, results, submitting, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [rewards, setRewards] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");

  useEffect(() => {
    if (!clip) return;
    setSelected([]);
    setRewards(false);
    setTitle(clip.title);
    setDescription(clip.reason);
    setSchedule("");
  }, [clip]);

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <Modal open={Boolean(clip)} title="Publish & submit" subtitle={clip ? `“${clip.title}”` : ""} onClose={onClose}>
      {clip && (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">Destinations</p>
            {(config?.destinations ?? []).map((destination) => {
              const active = destination.id === "rewards" ? rewards : selected.includes(destination.id);
              return (
                <button
                  key={destination.id}
                  onClick={() => destination.id === "rewards" ? setRewards((value) => !value) : toggle(destination.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    active ? "border-accent/60 bg-accent/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-accent/20 text-white" : "bg-white/5 text-white/50"}`}>
                    {icons[destination.id] ?? <Trophy className="h-5 w-5" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{destination.name}</span>
                    <span className="block text-[11px] text-white/40">{destination.description}</span>
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${destination.configured ? "border-lime/30 text-lime" : "border-white/10 text-white/35"}`}>
                    {destination.configured ? "connected" : "setup needed"}
                  </span>
                  {active && <Check className="h-4 w-4 text-lime" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <Input label="Caption / title" value={title} onChange={setTitle} />
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Schedule</span>
                <input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">Visibility</span>
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent">
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </label>
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-white/5 bg-black/20 p-3">
              {results.map((result, index) => (
                <div key={`${result.destination}-${index}`} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${["published", "submitted", "scheduled"].includes(result.status) ? "bg-lime" : result.status === "error" ? "bg-red-400" : "bg-white/30"}`} />
                  <span className="font-medium uppercase text-white/70">{result.destination}</span>
                  <span className="text-white/40">{result.detail}</span>
                </div>
              ))}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={submitting || (!selected.length && !rewards)}
            onClick={() => onSubmit({
              destinations: selected,
              rewards,
              title,
              description,
              schedule_at: schedule ? new Date(schedule).toISOString() : null,
              visibility,
            })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-ink transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Publishing…" : "Publish & submit"}
          </motion.button>
          <p className="text-center text-[11px] text-white/30">Credentials are read from your server environment. Nothing is posted without a connected account.</p>
        </div>
      )}
    </Modal>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent" />
    </label>
  );
}
