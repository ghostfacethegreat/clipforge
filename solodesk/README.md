# SoloDesk

SoloDesk is a free, local-first workspace for a solo service operator. It helps track leads, agreed projects, reusable service offers, and money actually received or spent.

It is designed to support the work around ClipForge and other small services such as Roblox/Luau scripting, Python automation, and basic websites.

## Run locally

No build step, server, account, API key, or dependency install is required.

From the repository root:

\`\`\`bash
cd solodesk
python3 -m http.server 8080
\`\`\`

Open http://localhost:8080.

For tests, install Node.js and run:

\`\`\`bash
npm test
\`\`\`

The tests use Node's built-in test runner. No third-party packages are required.

## Publish free with GitHub Pages

The app is static and can be hosted on GitHub Pages:

1. Open the repository's Settings → Pages.
2. Choose GitHub Actions or a supported static publishing workflow.
3. Publish the contents of the \`solodesk/\` directory as the site root, or configure a workflow to copy that directory to the Pages artifact.
4. Open the published HTTPS site and use the browser's install option if available.

The service worker and app manifest require a secure context (HTTPS or localhost). The app can also run locally without them.

## Data and privacy

- Records are stored in this browser's \`localStorage\`.
- No account, server, analytics, model API, payment processor, or external data transfer is included.
- Use **Export backup** regularly. Browser data can be lost when site data is cleared, a browser profile is removed, or a device is replaced.
- Importing a backup replaces the current records after a confirmation.
- Do not store passwords, payment credentials, government identity numbers, or unnecessary private customer data.
- Anyone with access to this browser profile may be able to access these records. Local storage is not encryption.

## Money definitions

- Lead budgets are estimates, not revenue.
- Project amounts are agreed prices, not proof of payment.
- Only entries under **Money received** count as recorded income.
- Expenses are tracked separately; net recorded cashflow is income minus recorded expenses.
- This is a recordkeeping tool, not accounting or tax advice and not a payment processor.

## Service and rights boundaries

Only add prospects from legitimate sources. Keep outreach relevant and personalized. Edit only customer-owned or properly authorized media. Agree on scope, deadline, revisions, cancellation terms, and payment arrangements before starting a job.

SoloDesk never sends messages, publishes content, applies to listings, accepts contracts, or moves money.
