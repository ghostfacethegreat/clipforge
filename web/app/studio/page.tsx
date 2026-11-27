"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, CircleAlert, Film, Link2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { ChannelsPanel } from "@/components/ChannelsPanel";
import { ClipCard } from "@/components/ClipCard";
import { EditorModal } from "@/components/EditorModal";
import { Header } from "@/components/Header";
import { JobProgress } from "@/components/JobProgress";
import { PreviewModal } from "@/components/PreviewModal";
import { PublishModal } from "@/components/PublishModal";
import { RewardsPanel } from "@/components/RewardsPanel";
import { UploadZone } from "@/components/UploadZone";
import { api } from "@/lib/api";
import type { Analytics, AppConfig, AutoPublish, Channel, Clip, ClipOptions, Job, PublishResult, Submission } from "@/lib/types";

const ACTIVE = ["queued", "processing", "analyzing", "rendering"];

export default function StudioPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Clip | null>(null);
  const [previewing, setPreviewing] = useState<Clip | null>(null);
  const [publishing, setPublishing] = useState<Clip | null>(null);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const loadData = useCallback(async () => {
    const [cfg, ch, subs, stats] = await Promise.all([
      api.config(), api.channels(), api.submissions(), api.analytics(),
    ]);
    setConfig(cfg);
    setChannels(ch);
    setSubmissions(subs);
    setAnalytics(stats);
  }, []);

  const refreshJob = useCallback(async (id: string) => {
    try {
      const updated = await api.job(id);
      setJob(updated);
      setEditing((current) => current ? updated.clips.find((clip) => clip.id === current.id) ?? null : null);
      return updated;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, []);

  useEffect(() => {
    loadData().catch((err) => setError((err as Error).message));
    api.latestJob().then(setJob).catch(() => undefined);
  }, [loadData]);

  useEffect(() => {
    if (!job || !ACTIVE.includes(job.status)) {
      loadData().catch(() => undefined);
      return;
    }
    const timer = setInterval(() => refreshJob(job.id), 1800);
    return () => clearInterval(timer);
  }, [job?.id, job?.status, refreshJob, loadData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUrl = async (url: string, options: ClipOptions, autoPublish: AutoPublish) => {
    setBusy(true);
    setError("");
    try {
      const created = await api.createFromUrl(url, options, autoPublish);
      setToast("Link received — downloading and analyzing");
      await refreshJob(created.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File, options: ClipOptions) => {
    setBusy(true);
    setError("");
    try {
      const created = await api.upload(file, options);
      setToast("Upload complete — analysis started");
      await refreshJob(created.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (patch: Partial<Clip>) => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await api.updateClip(editing.id, patch);
      setJob((current) => current ? { ...current, clips: current.clips.map((clip) => clip.id === updated.id ? updated : clip) } : current);
      setEditing(updated);
      setToast("Clip re-rendered");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (payload: { destinations: string[]; rewards: boolean; title?: string; description: string; schedule_at: string | null; visibility: string }) => {
    if (!publishing) return;
    setIsPublishing(true);
    try {
      const response = await api.publish(publishing.id, payload);
      setPublishResults(response.results);
      setToast(response.results.some((result) => ["published", "submitted", "scheduled"].includes(result.status)) ? "Publishing finished" : "No connected destinations");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPublishing(false);
    }
  };

  const run = async (task: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await task();
      await loadData();
      setToast(message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const clips = job?.clips ?? [];
  const active = job && ACTIVE.includes(job.status);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none fixed left-1/2 top-[-280px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
      <main className="relative mx-auto max-w-7xl space-y-16 px-5 pb-24 pt-14 sm:px-8">
        <section className="text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Studio workspace
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="text-gradient mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Find the moments worth keeping.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }} className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
            Bring in footage you own or are authorized to edit. Review AI-selected moments, shape your vertical clips, and choose when they are ready to leave the studio.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-white/45">
            {[
              { icon: <Link2 className="h-3.5 w-3.5" />, label: "Upload or link" },
              { icon: <Film className="h-3.5 w-3.5" />, label: "AI clips + captions" },
              { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Review + export" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
                <span className="text-lime">{item.icon}</span> {item.label}
              </span>
            ))}
          </motion.div>
        </section>

        <section id="studio" className="scroll-mt-24">
          <UploadZone config={config} busy={busy} onUrl={handleUrl} onFile={handleFile} />
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <CircleAlert className="h-4 w-4 shrink-0" /> {error}
                <button onClick={() => setError("")} className="ml-auto text-red-300/60 hover:text-red-200">×</button>
              </motion.div>
            )}
          </AnimatePresence>
          {job && <div className="mt-6"><JobProgress job={job} onDelete={async () => { await api.deleteJob(job.id); setJob(null); await loadData(); setToast("Job deleted"); }} /></div>}
          {clips.length > 0 && (
            <div className="mt-10">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">Your clips</h2>
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">{clips.length}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/40">Ranked candidates. Review the edit before exporting.</p>
                </div>
                {!active && <span className="flex items-center gap-1.5 text-xs text-lime"><CheckCircle2 className="h-4 w-4" /> Ready to edit or download</span>}
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {clips.map((clip, index) => (
                  <ClipCard key={clip.id} clip={clip} index={index} onEdit={setEditing} onPreview={setPreviewing} onPublish={(target) => { setPublishing(target); setPublishResults(job?.auto_results?.[target.id] ?? job?.publish_history?.[target.id] ?? []); }} />
                ))}
              </div>
            </div>
          )}
        </section>

        <ChannelsPanel
          config={config}
          channels={channels}
          busy={busy}
          onAdd={(url, options, auto) => run(() => api.addChannel(url, options, auto), "Channel connected")}
          onPatch={(id, patch) => run(() => api.patchChannel(id, patch), "Channel updated")}
          onDelete={(id) => run(() => api.deleteChannel(id), "Channel removed")}
          onScan={(id) => run(() => api.scanChannel(id), "Channel scanned")}
        />
        <RewardsPanel
          config={config}
          clips={clips}
          submissions={submissions}
          busy={busy}
          onSubmit={(campaignId, clipId) => run(() => api.submitToCampaign(clipId, campaignId, []), "Clip submitted to campaign")}
          onViews={(id, views) => run(() => api.updateViews(id, views), "Earnings updated")}
        />
        <AnalyticsPanel analytics={analytics} />
      </main>
      <EditorModal clip={editing} config={config} duration={job?.duration ?? 0} saving={saving} onClose={() => setEditing(null)} onSave={handleSave} />
      <PreviewModal clip={previewing} onClose={() => setPreviewing(null)} />
      <PublishModal clip={publishing} config={config} results={publishResults} submitting={isPublishing} onClose={() => setPublishing(null)} onSubmit={handlePublish} />
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-2xl">
            <Sparkles className="h-3.5 w-3.5" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
