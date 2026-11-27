import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("tracks leads, projects, received cash, and expenses separately", async ({ page }) => {
  await page.locator('[data-view="leads"]').click();
  await page.locator('#lead-form [name="name"]').fill("Sample Creator");
  await page.locator('#lead-form [name="stage"]').selectOption("quoted");
  await page.locator('#lead-form [name="sourceUrl"]').fill("https://example.com/creator");
  await page.locator('#lead-form [name="budget"]').fill("85.00");
  await page.locator('#lead-form [name="nextAction"]').fill("Prepare one relevant sample");
  await page.locator("#lead-form button[type=submit]").click();
  await expect(page.locator("#lead-list")).toContainText("Sample Creator");

  await page.locator('[data-view="projects"]').click();
  await page.locator('#project-form [name="name"]').fill("First editing pilot");
  await page.locator('#project-form [name="scope"]').fill("Three client-authorized vertical clips with captions");
  await page.locator('#project-form [name="agreed"]').fill("120.00");
  await page.locator('#project-form [name="status"]').selectOption("in-progress");
  await page.locator("#project-form button[type=submit]").click();
  await expect(page.locator("#project-list")).toContainText("First editing pilot");

  await page.locator('[data-view="money"]').click();
  await page.locator('#money-form [name="type"]').selectOption("income");
  await page.locator('#money-form [name="description"]').fill("Pilot payment actually received");
  await page.locator('#money-form [name="amount"]').fill("25.00");
  await page.locator("#money-form button[type=submit]").click();

  await page.locator('#money-form [name="type"]').selectOption("expense");
  await page.locator('#money-form [name="description"]').fill("Project expense");
  await page.locator('#money-form [name="amount"]').fill("5.00");
  await page.locator("#money-form button[type=submit]").click();

  await expect(page.locator("#money-income")).toHaveText("$25.00");
  await expect(page.locator("#money-expenses")).toHaveText("$5.00");
  await expect(page.locator("#money-net")).toHaveText("$20.00");

  await page.locator('[data-view="dashboard"]').click();
  await expect(page.locator("#metric-income")).toHaveText("$25.00");
  await expect(page.locator("#metric-net")).toHaveText("$20.00");
  await expect(page.locator("#metric-pipeline")).toHaveText("$85.00");
  await expect(page.locator("#metric-projects")).toHaveText("1");

  await page.reload();
  await page.locator('[data-view="dashboard"]').click();
  await expect(page.locator("#metric-income")).toHaveText("$25.00");
  await expect(page.locator("#metric-pipeline")).toHaveText("$85.00");
});

test("exports a restorable JSON backup and a CSV transaction ledger", async ({ page }, testInfo) => {
  await page.locator('[data-view="leads"]').click();
  await page.locator('#lead-form [name="name"]').fill("Backup Prospect");
  await page.locator('#lead-form [name="budget"]').fill("40.00");
  await page.locator('#lead-form [name="nextAction"]').fill("Review the source request");
  await page.locator("#lead-form button[type=submit]").click();

  await page.locator('[data-view="money"]').click();
  await page.locator('#money-form [name="description"]').fill("Cash payment");
  await page.locator('#money-form [name="amount"]').fill("25.00");
  await page.locator("#money-form button[type=submit]").click();

  const backupDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-json").click();
  const backupDownload = await backupDownloadPromise;
  const backupPath = testInfo.outputPath("solodesk-backup.json");
  await backupDownload.saveAs(backupPath);
  const backup = JSON.parse(await readFile(backupPath, "utf8"));
  expect(backup.leads).toHaveLength(1);
  expect(backup.transactions[0].amountCents).toBe(2500);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#import-json").setInputFiles(backupPath);
  await expect(page.locator("#notice")).toContainText("Backup imported.");
  await expect(page.locator("#lead-list")).toContainText("Backup Prospect");

  const csvDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-csv").click();
  const csvDownload = await csvDownloadPromise;
  const csvPath = testInfo.outputPath("solodesk-transactions.csv");
  await csvDownload.saveAs(csvPath);
  const csv = await readFile(csvPath, "utf8");
  expect(csv).toContain("Cash payment");
  expect(csv).toContain("25.00");
});

test("keeps the mobile workspace within a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.locator('[data-view="leads"]')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});

test("loads the app shell after the browser goes offline", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(
    () => "serviceWorker" in navigator && navigator.serviceWorker.controller !== null,
    { timeout: 15_000 }
  );
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.locator("#metric-leads")).toHaveText("0");
});
