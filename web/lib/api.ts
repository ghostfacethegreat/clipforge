import type { Analytics, AppConfig, Campaign, Channel, Clip, ClipOptions, Job, PublishResult, Submission, AutoPublish } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      detail = typeof data.detail === "string" ? data.detail : detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  config: () => request<AppConfig>("/api/config"),
  jobs: () => request<Job[]>("/api/jobs"),
  job: (id: string) => request<Job>(`/api/jobs/${id}`),
  latestJob: async () => {
    const jobs = await request<Job[]>("/api/jobs");
    return jobs[0] ?? null;
  },
  upload: (file: File, options: ClipOptions) => {
    const body = new FormData();
    body.append("file", file);
    body.append("options", JSON.stringify(options));
    return request<{ id: string; status: string }>("/api/jobs", { method: "POST", body });
  },
  createFromUrl: (url: string, options: ClipOptions, auto_publish: AutoPublish) =>
    request<{ id: string; status: string }>("/api/jobs/url", jsonInit("POST", { url, options, auto_publish })),
  deleteJob: (id: string) => request<{ deleted: boolean }>(`/api/jobs/${id}`, { method: "DELETE" }),
  updateClip: (id: string, patch: Partial<Clip>) =>
    request<Clip>(`/api/clips/${id}`, jsonInit("PATCH", patch)),
  publish: (id: string, payload: { destinations: string[]; rewards: boolean; title?: string; description: string; schedule_at: string | null; visibility: string; campaign_id?: string | null }) =>
    request<{ results: PublishResult[] }>(`/api/clips/${id}/publish`, jsonInit("POST", payload)),
  channels: () => request<Channel[]>("/api/channels"),
  addChannel: (url: string, options: ClipOptions, auto_publish: AutoPublish) =>
    request<Channel>("/api/channels", jsonInit("POST", { url, options, auto_publish })),
  patchChannel: (id: string, patch: Partial<Channel>) =>
    request<Channel>(`/api/channels/${id}`, jsonInit("PATCH", patch)),
  deleteChannel: (id: string) => request<{ deleted: boolean }>(`/api/channels/${id}`, { method: "DELETE" }),
  scanChannel: (id: string) => request<{ new_videos: number }>(`/api/channels/${id}/scan`, { method: "POST" }),
  campaigns: () => request<Campaign[]>("/api/campaigns"),
  submissions: () => request<Submission[]>("/api/submissions"),
  updateViews: (id: string, views: number) =>
    request<Submission>(`/api/submissions/${id}`, jsonInit("PATCH", { views })),
  submitToCampaign: (clip_id: string, campaign_id: string, destinations: string[]) =>
    request<{ submission: Submission; results: PublishResult[] }>("/api/submissions", jsonInit("POST", { clip_id, campaign_id, destinations })),
  analytics: () => request<Analytics>("/api/analytics"),
};
