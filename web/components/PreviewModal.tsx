"use client";

import type { Clip } from "@/lib/types";
import { Modal } from "./Modal";

export function PreviewModal({ clip, onClose }: { clip: Clip | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(clip)} title="Preview" subtitle={clip?.title} onClose={onClose} wide>
      {clip && (
        <div className="mx-auto max-h-[70vh] max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video src={clip.video_url} controls autoPlay playsInline className="mx-auto max-h-[70vh] w-full object-contain" />
        </div>
      )}
    </Modal>
  );
}
