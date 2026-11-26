export const SCHEMA_VERSION = 1;

export function emptyState() {
  return {
    version: SCHEMA_VERSION,
    leads: [],
    projects: [],
    transactions: [],
    offers: [
      { id: "clips", name: "Creator Shorts Pilot", service: "Video editing", priceCents: 2500, description: "3 vertical clips, captions, one revision, from authorized source footage." },
      { id: "roblox", name: "Roblox / Luau Scripting", service: "Roblox scripting", priceCents: null, description: "Scoped bug fixes, gameplay systems, and Lua/Luau scripting quoted per task." },
      { id: "web", name: "Small Business Website", service: "Website / automation", priceCents: null, description: "A small website or workflow automation, quoted after scope review." },
      { id: "python", name: "Python Automation", service: "Python / AI scripting", priceCents: null, description: "Small scripts, integrations, and repeatable workflow automation, quoted per task." }
    ]
  };
}

export function makeId(prefix) {
  const random = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  return String(prefix || "item") + "-" + random;
}

export function parseMoney(value) {
  const raw = String(value ?? "").trim().replace(/^\$/, "");
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(raw)) {
    throw new Error("Enter a non-negative amount with up to two decimal places.");
  }
  const amount = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount > 100000000) {
    throw new Error("Amount is outside the supported range.");
  }
  return Math.round(amount * 100);
}

export function formatMoney(cents) {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function cleanText(value, maxLength = 1200) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validDate(value) {
  const date = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function validHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateLead(input) {
  const name = cleanText(input.name, 100);
  const nextAction = cleanText(input.nextAction, 240);
  const sourceUrl = cleanText(input.sourceUrl, 500);
  const service = cleanText(input.service, 80);
  const stage = cleanText(input.stage || "new", 30);
  if (!name) throw new Error("Add a lead or business name.");
  if (!service) throw new Error("Choose a service type.");
  if (!nextAction) throw new Error("Write the next action so the lead does not go stale.");
  if (!validHttpUrl(sourceUrl)) throw new Error("Source link must be an http or https URL.");
  const allowedStages = ["new", "contacted", "replied", "quoted", "won", "lost"];
  if (!allowedStages.includes(stage)) throw new Error("Choose a valid lead stage.");
  const budgetCents = input.budget === "" || input.budget == null ? null : parseMoney(input.budget);
  const followUp = cleanText(input.followUp, 10);
  if (followUp && !validDate(followUp)) throw new Error("Follow-up date must be a valid YYYY-MM-DD date.");
  return {
    id: cleanText(input.id, 100) || makeId("lead"),
    name,
    service,
    stage,
    sourceUrl,
    budgetCents,
    nextAction,
    followUp,
    notes: cleanText(input.notes, 1200),
    createdAt: cleanText(input.createdAt, 40) || new Date().toISOString()
  };
}

export function validateProject(input) {
  const name = cleanText(input.name, 100);
  const scope = cleanText(input.scope, 1000);
  const status = cleanText(input.status || "planned", 30);
  if (!name) throw new Error("Add a project or client name.");
  if (!scope) throw new Error("Describe what you agreed to deliver.");
  const allowed = ["planned", "in-progress", "review", "delivered", "closed"];
  if (!allowed.includes(status)) throw new Error("Choose a valid project status.");
  const dueDate = cleanText(input.dueDate, 10);
  if (dueDate && !validDate(dueDate)) throw new Error("Due date must be a valid YYYY-MM-DD date.");
  const agreedCents = input.agreed === "" || input.agreed == null ? null : parseMoney(input.agreed);
  return {
    id: cleanText(input.id, 100) || makeId("project"),
    name,
    service: cleanText(input.service, 80),
    scope,
    status,
    dueDate,
    agreedCents,
    createdAt: cleanText(input.createdAt, 40) || new Date().toISOString()
  };
}

export function validateTransaction(input) {
  const type = cleanText(input.type, 20);
  const description = cleanText(input.description, 160);
  const date = cleanText(input.date, 10);
  if (!["income", "expense"].includes(type)) throw new Error("Transaction must be income or expense.");
  if (!description) throw new Error("Add a description for this money movement.");
  if (!validDate(date)) throw new Error("Enter a valid transaction date.");
  const amountCents = parseMoney(input.amount);
  if (amountCents <= 0) throw new Error("Amount must be greater than zero.");
  return {
    id: cleanText(input.id, 100) || makeId("money"),
    type,
    description,
    amountCents,
    date,
    projectId: cleanText(input.projectId, 100),
    note: cleanText(input.note, 500),
    createdAt: cleanText(input.createdAt, 40) || new Date().toISOString()
  };
}

export function summarize(state) {
  const leads = Array.isArray(state.leads) ? state.leads : [];
  const projects = Array.isArray(state.projects) ? state.projects : [];
  const transactions = Array.isArray(state.transactions) ? state.transactions : [];
  const cashReceivedCents = transactions
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.amountCents || 0), 0);
  const expensesCents = transactions
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + Number(entry.amountCents || 0), 0);
  const pipelineCents = leads
    .filter((lead) => !["won", "lost"].includes(lead.stage))
    .reduce((sum, lead) => sum + Number(lead.budgetCents || 0), 0);
  return {
    openLeads: leads.filter((lead) => !["won", "lost"].includes(lead.stage)).length,
    activeProjects: projects.filter((project) => ["planned", "in-progress", "review"].includes(project.status)).length,
    cashReceivedCents,
    expensesCents,
    netCashflowCents: cashReceivedCents - expensesCents,
    pipelineCents
  };
}

export function normalizeBackup(value) {
  if (!value || typeof value !== "object" || value.version !== SCHEMA_VERSION) {
    throw new Error("This backup is not a supported SoloDesk version.");
  }
  for (const key of ["leads", "projects", "transactions"]) {
    if (!Array.isArray(value[key])) throw new Error("Backup is missing a valid " + key + " list.");
  }
  const base = emptyState();
  return {
    version: SCHEMA_VERSION,
    leads: value.leads.map((item) => validateLead({
      ...item,
      budget: item.budgetCents == null ? "" : (Number(item.budgetCents) / 100).toFixed(2)
    })),
    projects: value.projects.map((item) => validateProject({
      ...item,
      agreed: item.agreedCents == null ? "" : (Number(item.agreedCents) / 100).toFixed(2)
    })),
    transactions: value.transactions.map((item) => validateTransaction({
      ...item,
      amount: (Number(item.amountCents) / 100).toFixed(2)
    })),
    offers: Array.isArray(value.offers) ? value.offers.slice(0, 50) : base.offers
  };
}

export function toCsv(rows, columns) {
  const quote = (value) => {
    const text = String(value ?? "");
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const header = columns.map((column) => quote(column.label)).join(",");
  const lines = rows.map((row) => columns.map((column) => quote(column.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}
