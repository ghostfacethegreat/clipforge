"use client";

import { motion } from "framer-motion";
import { BadgeDollarSign, Gift, Loader2, Send, TrendingUp } from "lucide-react";
import { useState } from "react";
import { SectionTitle } from "./ChannelsPanel";
import type { AppConfig, Clip, Submission } from "@/lib/types";

type Props = {
  config: AppConfig | null;
  clips: Clip[];
  submissions: Submission[];
  busy: boolean;
  onSubmit: (campaignId: string, clipId: string) => void;
  onViews: (id: string, views: number) => void;
};

export function RewardsPanel({ config, clips, submissions, busy, onSubmit, onViews }: Props) {
  const [selectedClips, setSelectedClips] = useState<Record<string, string>>({});
  const [goal, setGoal] = useState(10000);
  const [cpm, setCpm] = useState(4);
  const [avgViews, setAvgViews] = useState(25000);

  const viewsNeeded = cpm > 0 ? (goal / cpm) * 1000 : 0;
  const clipsNeeded = avgViews > 0 ? Math.ceil(viewsNeeded / avgViews) : 0;
  const revenuePerClip = (cpm * avgViews) / 1000;

  return (
    <section id="rewards" className="scroll-mt-24">
      <SectionTitle icon={<Gift className="h-4 w-4" />} title="Content Rewards" subtitle="Submit clips to paid campaigns and track views and earnings." />

      <div className="grid gap-3 md:grid-cols-3">
        {(config?.campaigns ?? []).map((campaign, index) => (
          <motion.div key={campaign.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full bg-lime/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-lime">{campaign.category}</span>
              <span className="text-sm font-bold text-white">${campaign.cpm.toFixed(2)}<span className="text-[10px] font-normal text-white/35"> / 1k views</span></span>
            </div>
            <h3 className="mt-3 text-sm font-semibold">{campaign.name}</h3>
            <p className="mt-1 min-h-[32px] text-[11px] leading-relaxed text-white/40">{campaign.description}</p>
            <div className="mt-3 flex gap-2">
              <select value={selectedClips[campaign.id] ?? ""} onChange={(event) => setSelectedClips({ ...selectedClips, [campaign.id]: event.target.value })} className="input min-w-0 flex-1 py-1.5 text-xs">
                <option value="">Select a clip</option>
                {clips.map((clip) => <option key={clip.id} value={clip.id}>{clip.title.slice(0, 40)}</option>)}
              </select>
              <button
                disabled={!selectedClips[campaign.id] || busy}
                onClick={() => onSubmit(campaign.id, selectedClips[campaign.id])}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-lime disabled:opacity-30"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Submit
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-lime" /> Earnings tracking</h3>
          {submissions.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/30">Submitted clips will appear here with views and earnings.</p>
          ) : (
            <div className="space-y-2">
              {submissions.slice(0, 8).map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.title}</p>
                    <p className="text-[10px] text-white/35">{item.campaign_name} · {item.status}</p>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-white/40">
                    Views
                    <input type="number" min={0} defaultValue={item.views} onBlur={(event) => onViews(item.id, Number(event.target.value))} className="input w-24 py-1 text-xs" />
                  </label>
                  <span className="w-16 text-right text-xs font-semibold text-lime">${item.earnings.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><BadgeDollarSign className="h-4 w-4 text-lime" /> Earnings calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <CalcInput label="Income goal ($)" value={goal} onChange={setGoal} />
            <CalcInput label="CPM ($)" value={cpm} onChange={setCpm} />
            <CalcInput label="Avg views / clip" value={avgViews} onChange={setAvgViews} />
            <div className="rounded-xl bg-lime/5 px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-white/35">Revenue per clip</span>
              <span className="text-sm font-bold text-lime">${revenuePerClip.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.03] p-3 text-xs">
            <div><span className="block text-[10px] text-white/35">Views needed</span><span className="font-semibold">{viewsNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            <div><span className="block text-[10px] text-white/35">Clips needed</span><span className="font-semibold">{clipsNeeded.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalcInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-white/35">{label}</span>
      <input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} className="input py-1.5 text-xs" />
    </label>
  );
}
