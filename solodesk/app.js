import {
  emptyState, makeId, parseMoney, formatMoney, validateLead, validateProject,
  validateTransaction, summarize, normalizeBackup, toCsv
} from "./core.js";

const STORAGE_KEY = "solodesk.data.v1";
const state = loadState();
const views = ["dashboard", "leads", "projects", "money", "offers"];
const pageCopy = {
  dashboard: ["Overview", "A clear view of the work you are building."],
  leads: ["Leads", "Track prospects and the next step to turn conversations into paid work."],
  projects: ["Projects", "Keep accepted work scoped and deliver it reliably."],
  money: ["Money", "Separate actual cash received from estimates and unpaid work."],
  offers: ["Offers", "Keep your service menu clear, narrow, and repeatable."]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeBackup(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showNotice("Your browser could not save data. Export a backup and check storage availability.", "error");
    return false;
  }
}

function showNotice(message, type) {
  const node = document.getElementById("notice");
  node.textContent = message;
  node.className = "notice " + (type || "");
  node.hidden = false;
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => { node.hidden = true; }, 5500);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function setView(name) {
  if (!views.includes(name)) return;
  views.forEach((view) => {
    document.getElementById("view-" + view).classList.toggle("active", view === name);
    document.querySelector('[data-view="' + view + '"]').classList.toggle("active", view === name);
  });
  document.getElementById("page-title").textContent = pageCopy[name][0];
  document.getElementById("page-subtitle").textContent = pageCopy[name][1];
  window.location.hash = name;
}

function tag(label, type) {
  const css = type === "won" || type === "delivered" || type === "income" ? "good" :
    type === "lost" || type === "expense" ? "bad" :
    type === "review" || type === "quoted" ? "warn" : "";
  return '<span class="tag ' + css + '">' + escapeHtml(label.replace(/-/g, " ")) + "</span>";
}

function statusSelect(id, current, values, attribute, accessibleName) {
  return '<select class="status-select" data-' + attribute + '="' + escapeHtml(id) +
    '" aria-label="' + escapeHtml(accessibleName) + '">' +
    values.map((value) => '<option value="' + value + '"' + (value === current ? " selected" : "") +
      ">" + escapeHtml(value.replace(/-/g, " ")) + "</option>").join("") +
    "</select>";
}

function render() {
  const totals = summarize(state);
  document.getElementById("metric-leads").textContent = totals.openLeads;
  document.getElementById("metric-projects").textContent = totals.activeProjects;
  document.getElementById("metric-income").textContent = formatMoney(totals.cashReceivedCents);
  document.getElementById("metric-net").textContent = formatMoney(totals.netCashflowCents);
  document.getElementById("metric-pipeline").textContent = formatMoney(totals.pipelineCents);
  document.getElementById("metric-expenses").textContent = formatMoney(totals.expensesCents);
  document.getElementById("metric-transactions").textContent = state.transactions.length;
  document.getElementById("money-income").textContent = formatMoney(totals.cashReceivedCents);
  document.getElementById("money-expenses").textContent = formatMoney(totals.expensesCents);
  document.getElementById("money-net").textContent = formatMoney(totals.netCashflowCents);
  document.getElementById("lead-count").textContent = state.leads.length;
  document.getElementById("project-count").textContent = state.projects.length;
  renderActions();
  renderLeads();
  renderProjects();
  renderMoney();
  renderOffers();
  renderProjectOptions();
}

function renderActions() {
  const items = state.leads
    .filter((lead) => !["won", "lost"].includes(lead.stage))
    .sort((a, b) => String(a.followUp || "9999").localeCompare(String(b.followUp || "9999")))
    .slice(0, 5);
  const target = document.getElementById("next-actions");
  if (!items.length) {
    target.className = "stack-list empty-state";
    target.textContent = "No open leads yet. Add one real prospect and write the next action.";
    return;
  }
  target.className = "stack-list";
  target.innerHTML = items.map((lead) =>
    '<article class="action-item"><div><strong>' + escapeHtml(lead.name) + "</strong><small>" +
    escapeHtml(lead.nextAction) + (lead.followUp ? " · Follow up " + escapeHtml(lead.followUp) : "") +
    "</small></div>" + tag(lead.stage, lead.stage) + "</article>"
  ).join("");
}

function renderLeads() {
  const target = document.getElementById("lead-list");
  if (!state.leads.length) {
    target.innerHTML = '<div class="empty-state">No leads yet. Add prospects who have a real reason to need your service.</div>';
    return;
  }
  target.innerHTML = '<table class="data-table"><thead><tr><th>Lead</th><th>Service</th><th>Stage</th><th>Next action</th><th></th></tr></thead><tbody>' +
    state.leads.map((lead) => '<tr><td><strong>' + escapeHtml(lead.name) + '</strong><span class="table-sub">' +
      (lead.sourceUrl ? '<a href="' + escapeHtml(lead.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Open source ↗</a>' : "No source link") +
      (lead.budgetCents == null ? "" : "<br>Estimate: " + formatMoney(lead.budgetCents)) + "</span></td><td>" +
      escapeHtml(lead.service) + "</td><td>" + statusSelect(lead.id, lead.stage, ["new", "contacted", "replied", "quoted", "won", "lost"], "lead-stage", "Stage for " + lead.name) + "</td><td>" +
      escapeHtml(lead.nextAction) + (lead.followUp ? '<span class="table-sub">' + escapeHtml(lead.followUp) + "</span>" : "") +
      '</td><td><button class="row-actions danger-link" data-delete-lead="' + escapeHtml(lead.id) + '">Delete</button></td></tr>'
    ).join("") + "</tbody></table>";
}

function renderProjects() {
  const target = document.getElementById("project-list");
  if (!state.projects.length) {
    target.innerHTML = '<div class="empty-state">No projects yet. Only add work after the scope and terms have been agreed.</div>';
    return;
  }
  target.innerHTML = '<table class="data-table"><thead><tr><th>Project</th><th>Agreed amount</th><th>Status</th><th>Due</th><th></th></tr></thead><tbody>' +
    state.projects.map((project) => '<tr><td><strong>' + escapeHtml(project.name) + "</strong><span class=\"table-sub\">" +
      escapeHtml(project.service || "Unspecified service") + "<br>" + escapeHtml(project.scope) + "</span></td><td>" +
      (project.agreedCents == null ? "Not set" : formatMoney(project.agreedCents)) + "</td><td>" +
      statusSelect(project.id, project.status, ["planned", "in-progress", "review", "delivered", "closed"], "project-status", "Status for " + project.name) + "</td><td>" + escapeHtml(project.dueDate || "—") +
      '</td><td><button class="row-actions danger-link" data-delete-project="' + escapeHtml(project.id) + '">Delete</button></td></tr>'
    ).join("") + "</tbody></table>";
}

function renderMoney() {
  const target = document.getElementById("money-list");
  if (!state.transactions.length) {
    target.innerHTML = '<div class="empty-state">No transactions recorded. Add an income entry only after you actually receive payment.</div>';
    return;
  }
  const rows = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  target.innerHTML = '<table class="data-table"><thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Amount</th><th></th></tr></thead><tbody>' +
    rows.map((entry) => '<tr><td>' + escapeHtml(entry.date) + '</td><td><strong>' + escapeHtml(entry.description) +
      '</strong><span class="table-sub">' + escapeHtml(entry.note || "") + "</span></td><td>" +
      tag(entry.type, entry.type) + "</td><td>" + (entry.type === "expense" ? "−" : "+") + formatMoney(entry.amountCents) +
      '</td><td><button class="row-actions danger-link" data-delete-transaction="' + escapeHtml(entry.id) + '">Delete</button></td></tr>'
    ).join("") + "</tbody></table>";
}

function offerCard(offer) {
  return '<article class="offer-card"><strong>' + escapeHtml(offer.name) + '</strong><div class="price">' +
    (offer.priceCents == null ? "Quote after scoping" : formatMoney(offer.priceCents)) +
    '</div><p>' + escapeHtml(offer.description) + "</p></article>";
}

function renderOffers() {
  const markup = state.offers.map(offerCard).join("");
  document.getElementById("offer-list").innerHTML = markup;
  document.getElementById("dashboard-offers").innerHTML = markup;
}

function renderProjectOptions() {
  const select = document.getElementById("money-project");
  const selected = select.value;
  select.innerHTML = '<option value="">No project linked</option>' + state.projects.map((project) =>
    '<option value="' + escapeHtml(project.id) + '">' + escapeHtml(project.name) + "</option>"
  ).join("");
  select.value = selected;
}

function onSubmit(form, builder, collectionKey, successText) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      state[collectionKey].unshift(builder(values));
      saveState();
      form.reset();
      if (form.elements.date) form.elements.date.value = today();
      render();
      showNotice(successText, "success");
    } catch (error) {
      showNotice(error.message || "Could not save this record.", "error");
    }
  });
}

onSubmit(document.getElementById("lead-form"), validateLead, "leads", "Lead saved. Follow up with one personalized, relevant next step.");
onSubmit(document.getElementById("project-form"), validateProject, "projects", "Project saved. Keep its agreed scope and delivery status up to date.");
onSubmit(document.getElementById("money-form"), (values) => validateTransaction({ ...values, date: values.date || today() }), "transactions", "Transaction recorded.");

document.getElementById("money-form").elements.date.value = today();

document.addEventListener("change", (event) => {
  const leadSelect = event.target.closest("[data-lead-stage]");
  const projectSelect = event.target.closest("[data-project-status]");
  if (leadSelect) {
    const lead = state.leads.find((item) => item.id === leadSelect.dataset.leadStage);
    if (lead) {
      lead.stage = leadSelect.value;
      saveState(); render(); showNotice("Lead stage updated.", "success");
    }
  }
  if (projectSelect) {
    const project = state.projects.find((item) => item.id === projectSelect.dataset.projectStatus);
    if (project) {
      project.status = projectSelect.value;
      saveState(); render(); showNotice("Project status updated.", "success");
    }
  }
});

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) setView(nav.dataset.view);
  const goto = event.target.closest("[data-goto]");
  if (goto) setView(goto.dataset.goto);

  const deleteLead = event.target.closest("[data-delete-lead]");
  const deleteProject = event.target.closest("[data-delete-project]");
  const deleteTransaction = event.target.closest("[data-delete-transaction]");
  if (deleteLead) {
    state.leads = state.leads.filter((item) => item.id !== deleteLead.dataset.deleteLead);
    saveState(); render(); showNotice("Lead removed.", "success");
  }
  if (deleteProject) {
    state.projects = state.projects.filter((item) => item.id !== deleteProject.dataset.deleteProject);
    saveState(); render(); showNotice("Project removed. Existing money records remain.", "success");
  }
  if (deleteTransaction) {
    state.transactions = state.transactions.filter((item) => item.id !== deleteTransaction.dataset.deleteTransaction);
    saveState(); render(); showNotice("Transaction removed.", "success");
  }
});

document.getElementById("quick-add").addEventListener("click", () => {
  setView("leads");
  document.querySelector('#lead-form input[name="name"]').focus();
});

document.getElementById("export-json").addEventListener("click", () => {
  downloadFile("solodesk-backup-" + today() + ".json", JSON.stringify(state, null, 2), "application/json");
  showNotice("Backup exported. Keep a copy somewhere safe.", "success");
});

document.getElementById("import-json").addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error("Backup file is larger than 2 MB.");
    const imported = normalizeBackup(JSON.parse(await file.text()));
    if (!window.confirm("Replace the current browser records with this backup? Export your current data first if you need it.")) return;
    state.leads = imported.leads;
    state.projects = imported.projects;
    state.transactions = imported.transactions;
    state.offers = imported.offers;
    saveState(); render(); showNotice("Backup imported.", "success");
  } catch (error) {
    showNotice(error.message || "Could not import that backup.", "error");
  } finally {
    event.target.value = "";
  }
});

document.getElementById("export-csv").addEventListener("click", () => {
  const rows = state.transactions.map((item) => ({
    date: item.date, type: item.type, description: item.description,
    amount_usd: (item.amountCents / 100).toFixed(2), note: item.note || ""
  }));
  const csv = toCsv(rows, [
    { label: "Date", value: (row) => row.date },
    { label: "Type", value: (row) => row.type },
    { label: "Description", value: (row) => row.description },
    { label: "Amount USD", value: (row) => row.amount_usd },
    { label: "Note", value: (row) => row.note }
  ]);
  downloadFile("solodesk-transactions-" + today() + ".csv", csv, "text/csv;charset=utf-8");
  showNotice("CSV exported.", "success");
});

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.getElementById("today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short", month: "short", day: "numeric"
}).format(new Date());

const initialView = window.location.hash.replace("#", "");
setView(views.includes(initialView) ? initialView : "dashboard");
render();
