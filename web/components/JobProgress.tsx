"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileVideo, Loader2, Trash2 } from "lucide-react";
import type { Job } from "@/lib/types";

type Props = { job: Job; onDelete: () => void };

export function JobProgress({ job, onDelete }: Props) {
  const active = ["queued", "processing", "analyzing", "rendering"].includes(job.status);
  const done = job.status === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass relative overflow-hidden rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${done ? "bg-lime/10 text-lime" : active ? "bg-accent/10 text-accent" : "bg-red-500/10 text-red-400"}`}>
            {done ? <CheckCircle2 className="h-5 w-5" /> : active ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{job.message}</p>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">{job.status}</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
              <FileVideo className="h-3 w-3" /> {job.filename}
              {job.duration > 0 && ` · ${Math.round(job.duration)}s source`}
            </p>
          </div>
        </div>
        <button onClick={onDelete} className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-red-400" title="Delete job">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="shimmer h-full animate-shimmer rounded-full"
          animate={{ width: `${Math.max(2, job.progress)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-white/35">
        <span>Transcribe → detect moments → caption → render</span>
        <span>{Math.round(job.progress)}%</span>
      </div>
      {job.error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{job.error}</p>}
    </motion.div>
  );
}
