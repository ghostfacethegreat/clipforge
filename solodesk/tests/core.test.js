import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  parseMoney,
  formatMoney,
  validateLead,
  validateProject,
  validateTransaction,
  summarize,
  normalizeBackup,
  toCsv
} from "../core.js";

test("money parser stores integer cents and rejects malformed values", () => {
  assert.equal(parseMoney("25"), 2500);
  assert.equal(parseMoney("$1,234.56"), 123456);
  assert.throws(() => parseMoney("-2"), /non-negative/);
  assert.throws(() => parseMoney("1.999"), /non-negative/);
  assert.equal(formatMoney(2500), "$25.00");
});

test("lead validation requires a next action and safe source URL", () => {
  assert.throws(() => validateLead({ name: "Creator", service: "Video editing" }), /next action/);
  assert.throws(() => validateLead({ name: "Creator", service: "Video editing", nextAction: "Ask", sourceUrl: "javascript:alert(1)" }), /http or https/);
  const lead = validateLead({ name: "Creator", service: "Video editing", nextAction: "Send one sample offer", sourceUrl: "https://example.com", budget: "25" });
  assert.equal(lead.budgetCents, 2500);
});

test("project validation requires a scope and accepts a quoted amount", () => {
  assert.throws(() => validateProject({ name: "Client" }), /agreed to deliver/);
  const project = validateProject({ name: "Client", scope: "Three edited clips", agreed: "75" });
  assert.equal(project.agreedCents, 7500);
  assert.equal(project.status, "planned");
});

test("transaction validation only accepts positive recorded income or expenses", () => {
  assert.throws(() => validateTransaction({ type: "income", description: "Payment", date: "2026-02-30", amount: "25" }), /valid transaction date/);
  assert.throws(() => validateTransaction({ type: "income", description: "Payment", date: "2026-02-28", amount: "0" }), /greater than zero/);
  const entry = validateTransaction({ type: "income", description: "Pilot paid", date: "2026-02-28", amount: "25" });
  assert.equal(entry.amountCents, 2500);
});

test("quotes and pipeline are never counted as cash received", () => {
  const state = emptyState();
  state.leads.push(validateLead({ name: "Prospect A", service: "Video editing", stage: "quoted", budget: "100", nextAction: "Follow up" }));
  state.projects.push(validateProject({ name: "Client B", scope: "Website build", agreed: "500", status: "in-progress" }));
  state.transactions.push(validateTransaction({ type: "income", description: "Deposit actually received", amount: "50", date: "2026-02-28" }));
  state.transactions.push(validateTransaction({ type: "expense", description: "Storage", amount: "5", date: "2026-02-28" }));
  const summary = summarize(state);
  assert.equal(summary.pipelineCents, 10000);
  assert.equal(summary.cashReceivedCents, 5000);
  assert.equal(summary.expensesCents, 500);
  assert.equal(summary.netCashflowCents, 4500);
});

test("backup import checks schema and data shapes", () => {
  const state = emptyState();
  assert.deepEqual(normalizeBackup(state).leads, []);
  assert.throws(() => normalizeBackup({ version: 99 }), /supported SoloDesk version/);
});

test("CSV output safely quotes commas and quotes", () => {
  const csv = toCsv([{ name: 'Studio, "A"' }], [{ label: "Name", value: (row) => row.name }]);
  assert.equal(csv, '"Name"\r\n"Studio, ""A"""');
});
