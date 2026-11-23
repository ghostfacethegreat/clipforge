"use client";

import { motion } from "framer-motion";
import { BarChart3, Captions, DollarSign, Eye, Send } from "lucide-react";
import { SectionTitle } from "./ChannelsPanel";
import type { Analytics } from "@/lib/types";

export function AnalyticsPanel({ analytics }: { analytics: Analytics | null }) {
  const published = analytics?.published ?? {};
  const totalPublished = Object.values(published).reduce((sum, value) => sum + value, 0);

  return (
    <section id="analytics" className="scroll-mt-24">
      <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Analytics" subtitle="A simple view of what Clipforge has created, posted and earned." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Captions className="h-4 w-4" />} label="Clips created" value={analytics?.clips ?? 0} />
        <Stat icon={<Send className="h-4 w-4" />} label="Auto-posts" value={totalPublished} />
        <Stat icon={<Eye className="h-4 w-4" />} label="Tracked views" value={analytics?.total_views ?? 0} />
        <Stat icon={<DollarSign className="h-4 w-4" />} label="Estimated earnings" value={`$${(analytics?.earnings ?? 0).toFixed(2)}`} accent />
      </div>
      <div className="mt-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Posts by platform</p>
        {Object.keys(published).length === 0 ? (
          <p className="text-xs text-white/30">No posts yet. Enable auto-post or publish a clip manually.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(published).map(([destination, count]) => (
              <span key={destination} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                <span className="capitalize">{destination}</span>
                <span className="font-semibold text-white">{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-lime/10 text-lime" : "bg-accent/10 text-accent"}`}>{icon}</span>
      <p className="mt-3 text-xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/35">{label}</p>
    </motion.div>
  );
}
