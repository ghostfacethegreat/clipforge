export type Word = { start: number; end: number; text: string };

export type Clip = {
  id: string;
  job_id: string;
  title: string;
  start: number;
  end: number;
  score: number;
  reason: string;
  transcript: string;
  words: Word[];
  caption_style: string;
  focus: string;
  captions_enabled: boolean;
  status: string;
  video_url: string;
  thumbnail_url: string;
};

export type AutoPublish = {
  enabled: boolean;
  destinations: string[];
  rewards: boolean;
  campaign_id: string | null;
  max_clips: number;
};

export type Job = {
  id: string;
  filename: string;
  source_path: string;
  source_url: string;
  channel_id: string;
  created_at: string;
  status: string;
  progress: number;
  message: string;
  error: string;
  options: Record<string, unknown>;
  duration: number;
  clips: Clip[];
  publish_history: Record<string, PublishResult[]>;
  auto_results: Record<string, PublishResult[]>;
  auto_publish: AutoPublish;
};

export type Destination = {
  id: string;
  name: string;
  description: string;
  configured: boolean;
  icon: string;
};

export type Campaign = {
  id: string;
  name: string;
  description: string;
  cpm: number;
  category: string;
  active: boolean;
};

export type Submission = {
  id: string;
  clip_id: string;
  job_id: string;
  campaign_id: string;
  campaign_name: string;
  title: string;
  status: string;
  detail: string;
  views: number;
  earnings: number;
  created_at: string;
};

export type Analytics = {
  jobs: number;
  clips: number;
  published: Record<string, number>;
  submissions: number;
  total_views: number;
  earnings: number;
  recent: Submission[];
};

export type Channel = {
  id: string;
  url: string;
  name: string;
  created_at: string;
  last_scan: string;
  seen_videos: string[];
  auto_publish: AutoPublish;
  options: Record<string, unknown>;
  active: boolean;
  error: string;
};

export type PublishResult = {
  destination: string;
  status: string;
  detail: string;
  url: string;
  id: string;
};

export type AppConfig = {
  caption_styles: { id: string; label: string }[];
  destinations: Destination[];
  campaigns: Campaign[];
};

export type ClipOptions = {
  count: number;
  min_duration: number;
  max_duration: number;
  caption_style: string;
  keywords: string;
  focus: "auto" | "left" | "center" | "right";
};

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
