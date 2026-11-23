# Clipforge

Auto clip maker: paste a link (or connect a YouTube channel) and get ranked vertical clips with animated captions, an editor, auto-posting, and Content Rewards submission. Transcription runs locally with Whisper — no API key needed for the core flow.

## Stack

- **Web:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Server:** FastAPI, faster-whisper, yt-dlp, ffmpeg, libass, optional OpenCV face detection
- **Storage:** local files under `data/` (no database)

## Features

- **Link-first studio** — paste a YouTube video link (or any direct video URL), or upload a file.
- **YouTube channel monitoring** — connect a channel by URL/@handle; new uploads are detected automatically and clipped with no refresh.
- **AI moment detection** — word-level Whisper transcript, then scoring by hook, pacing, emotion, keywords and silence.
- **Auto captions + vertical reframe** — karaoke-style ASS captions and 1080×1920 cropping with optional face detection.
- **Manual editor** — trim, rename, change caption style, focus and re-render.
- **Auto-post** — publish finished clips to YouTube Shorts, TikTok, Instagram Reels and Facebook Reels.
- **Content Rewards** — campaigns with CPMs, clip submission, view/earnings tracking and an earnings calculator.
- **Analytics** — clips created, posts by platform, tracked views and estimated earnings.

## Quick start

Requires Node 18+, Python 3.11+ (tested with 3.12), and `ffmpeg`/`ffprobe` on `PATH`.

```bash
python3.12 -m venv .venv
.venv/bin/pip install -e server
.venv/bin/uvicorn app.main:app --app-dir server --host 127.0.0.1 --port 8000

# new terminal
cd web && npm install && npm run dev
```

Open http://localhost:3000. The frontend proxies `/api/*` to `http://127.0.0.1:8000`.

Or run both with `./start.sh`.

## Configuration

Copy `.env.example` and export the values you need before starting the server.

| Variable | Default | Purpose |
| --- | --- | --- |
| `CLIPFORGE_WHISPER_MODEL` | `base` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `CLIPFORGE_TRANSCRIBER` | `auto` | `auto`/`faster-whisper` for real transcription, `demo` for canned transcripts in tests |
| `CLIPFORGE_KEYWORDS` | empty | Comma-separated keyword boosts for scoring |
| `CLIPFORGE_CHANNEL_POLL_SECONDS` | `900` | How often connected channels are checked for new uploads |
| `CLIPFORGE_CAMPAIGNS_JSON` | built-in campaigns | JSON array overriding the rewards campaigns |
| `CLIPFORGE_PUBLIC_BASE_URL` | empty | Public URL of this server, needed by Instagram and rewards submissions |
| `CLIPFORGE_REWARDS_WEBHOOK_URL` | empty | Endpoint that accepts Content Rewards submissions |
| `CLIPFORGE_REWARDS_API_KEY` | empty | Bearer token for the rewards webhook |
| `YT_COOKIES_FILE` | empty | Optional Netscape cookies file for restricted YouTube content |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | empty | YouTube Data API OAuth with `youtube.upload` |
| `TIKTOK_ACCESS_TOKEN` | empty | TikTok Content Posting API token |
| `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` | empty | Instagram Graph API credentials |
| `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` | empty | Facebook Graph API page token |

Face-centered cropping needs `opencv-python-headless` (`pip install -e "server[face-detection]"`); otherwise `auto` uses center crop. Unconfigured platforms show "setup needed" and return `skipped` results — nothing is posted without credentials.

## API highlights

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/jobs` | Multipart file upload |
| `POST` | `/api/jobs/url` | Create job from a pasted link (`url`, `options`, `auto_publish`) |
| `GET` | `/api/jobs/{id}` | Job status and clips |
| `PATCH` | `/api/clips/{id}` | Edit title, trim, style, focus, captions and re-render |
| `POST` | `/api/clips/{id}/publish` | Publish to selected platforms / rewards |
| `GET/POST/PATCH/DELETE` | `/api/channels` | Connect, configure, scan and remove monitored channels |
| `GET` | `/api/campaigns` | Available Content Rewards campaigns |
| `GET/POST` | `/api/submissions` | List and submit clips to campaigns |
| `PATCH` | `/api/submissions/{id}` | Update views; earnings are calculated from campaign CPM |
| `GET` | `/api/analytics` | Aggregate clips, posts, views and earnings |

## Notes

- First transcription downloads the Whisper model once (~140 MB for `base`).
- Long videos are downloaded with yt-dlp into `data/uploads`.
- The app stores everything locally. Put it behind authentication before exposing it publicly.
