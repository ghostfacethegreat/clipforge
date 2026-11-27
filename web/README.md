# ClipForge Web

The web frontend is a Next.js app. The public landing page lives at `/`; the existing editing workspace lives at `/studio`.

## Local development

Start the FastAPI service from the repository root:

```bash
python3.12 -m venv .venv
.venv/bin/pip install -e server
.venv/bin/uvicorn app.main:app --app-dir server --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd web
npm ci
npm run dev
```

Open http://localhost:3000. The Next.js rewrite forwards `/api/*` to the local service on port 8000.

## Optional creator support link

To show the Buy Me a Coffee support button, create `web/.env.local` and set:

```dotenv
NEXT_PUBLIC_BUY_ME_A_COFFEE_URL=https://buymeacoffee.com/YOUR_CREATOR_HANDLE
```

Replace the example with the exact public creator-page URL from your own Buy Me a Coffee account, then restart the Next.js dev server. The button is intentionally hidden until a real URL is configured.

Buy Me a Coffee is used here for voluntary project support, not as a software-license checkout. Complete payout onboarding and Stripe Express verification in your own account; never put bank details, identity documents, Stripe secrets, or API keys in this frontend repository.

## Deployment metadata

Set `NEXT_PUBLIC_SITE_URL` to the exact public origin (for example, `https://your-domain.example`) in the deployment environment. This value is used to resolve Open Graph and icon URLs. The local development default is `http://localhost:3000`.

## Build checks

```bash
npm run typecheck
npm run build
```

## Deployment and safety

This branch adds a product landing page and preserves the local Studio at `/studio`. It does not deploy a managed ClipForge service or provide user accounts, storage isolation, authentication, quotas, billing, or payment entitlements. Do not expose the FastAPI service to the public internet until authentication, per-user workspace isolation, upload limits, job quotas, and secure secret management are implemented and reviewed.

The source ZIP is a developer snapshot, not a signed desktop installer. Only use footage you own or are authorized to edit.
