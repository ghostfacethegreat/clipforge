"use client";

import { motion } from "framer-motion";
import { Download, Pencil, Play, Send, Star } from "lucide-react";
import { formatTime, type Clip } from "@/lib/types";

type Props = {
  clip: Clip;
  index: number;
  onEdit: (clip: Clip) => void;
  onPublish: (clip: Clip) => void;
  onPreview: (clip: Clip) => void;
};

export function ClipCard({ clip, index, onEdit, onPublish, onPreview }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -5 }}
      className="group glass overflow-hidden rounded-2xl transition-shadow hover:shadow-glow"
    >
      <div className="relative aspect-[9/13] overflow-hidden bg-black/50">
        {clip.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full animate-pulse bg-white/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-lime backdrop-blur">
          <Star className="h-3 w-3 fill-lime" /> {clip.score}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
          {formatTime(clip.end - clip.start)}
        </div>
        <button
          onClick={() => onPreview(clip)}
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-ink shadow-xl">
            <Play className="ml-0.5 h-5 w-5 fill-ink" />
          </span>
        </button>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow">{clip.title}</p>
          <p className="mt-1 text-[11px] text-white/55">{formatTime(clip.start)} – {formatTime(clip.end)}</p>
        </div>
      </div>
      <div className="p-3">
        <p className="mb-3 line-clamp-1 text-[11px] text-white/40">{clip.reason}</p>
        <div className="grid grid-cols-3 gap-2">
          <Action onClick={() => onEdit(clip)} icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" />
          <Action onClick={() => onPublish(clip)} icon={<Send className="h-3.5 w-3.5" />} label="Publish" accent />
          <a
            href={clip.video_url}
            download
            className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-[11px] text-white/60 transition hover:border-lime/40 hover:text-lime"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function Action({ onClick, icon, label, accent }: { onClick: () => void; icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-[11px] transition ${
        accent ? "border-accent/30 bg-accent/10 text-white hover:bg-accent/20" : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white"
      }`}
    >
      {icon} {label}
    </button>
  );
}
