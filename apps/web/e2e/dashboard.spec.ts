/**
 * The acceptance path, in a real browser against a real calling engine:
 * open a campaign, understand its sales performance, inspect lead intelligence, review
 * AI recommendations, and approve or reject a playbook, without a command line.
 *
 * The numbers asserted here come from the engine's test fixtures
 * (aicallingagent/tests/seed_dashboard.py) and are counted by the engine itself.
 * Tests run in order and change data, so they need a freshly seeded engine.
 */
import { expect, test, type Page } from "@playwright/test";

const TOKEN = process.env.E2E_API_TOKEN ?? "e2e-test-token";
const ACCOUNTING = "Accounting firms Q4";
const DENTAL = "Dental clinics pilot";
const EMPTY = "Law firms (not started)";

test.describe.configure({ mode: "serial" });

// One browser session for the whole run, signed in once, the way a person works.
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await (await browser.newContext()).newPage();
});
test.afterAll(async () => {
  await page.context().close();
});

/** An error message on the page (Next.js keeps an empty role="alert" element of its own). */
function alertWith(text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function openCampaign(page: Page, name: string, tab?: string) {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: new RegExp(name.replace(/[()]/g, "\\$&")) }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  if (tab) await page.getByRole("navigation", { name: "Campaign sections" }).getByRole("link", { name: tab }).click();
}

test("the dashboard is closed to visitors who are not signed in", async () => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  const direct = await page.request.get("/api/backend/campaigns");
  expect(direct.status()).toBe(401);

  await page.getByLabel("Access token").fill("not-the-right-token");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(alertWith("That access token was not accepted.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("signing in keeps the token away from page scripts and lists the campaigns", async () => {
  await page.goto("/login");
  await page.getByLabel("Access token").fill(TOKEN);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Campaigns", level: 1 })).toBeVisible();
  for (const name of [ACCOUNTING, DENTAL, EMPTY]) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  await expect(page.getByText("Paused automatically: the budget of $32.00 was reached (spent $32.05)")).toBeVisible();

  const session = (await page.context().cookies()).find((c) => c.name === "dt_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Strict");
  expect(await page.evaluate(() => document.cookie)).not.toContain(TOKEN);
  expect(await page.content()).not.toContain(TOKEN);
});

test("a campaign's sales performance is shown as the engine counted it", async () => {
  await openCampaign(page, ACCOUNTING);

  await expect(page.getByTestId("pause-reason")).toContainText("the budget of $32.00 was reached (spent $32.05)");
  const stat = (label: string) => page.locator(`[data-stat="${label}"]`);
  await expect(stat("Total calls")).toContainText("69");
  await expect(stat("Answered")).toContainText("64");
  await expect(stat("Conversions")).toContainText("16");
  await expect(stat("Conversion rate")).toContainText("25.0%");
  await expect(stat("Cost per conversion")).toContainText("$2.00");
  await expect(page.getByTestId("budget-spent")).toHaveText("$32.05");
  await expect(page.getByTestId("budget-remaining")).toHaveText("$0.00");

  // Objections, most frequent first, with how often they were handled.
  const objections = page.locator("section", { has: page.getByRole("heading", { name: "Objections" }) }).locator("tbody tr");
  await expect(objections.nth(0)).toContainText("Price");
  await expect(objections.nth(0)).toContainText("25");
  await expect(objections.nth(0)).toContainText("4%");
  await expect(objections.nth(1)).toContainText("Competitor");

  const lost = page.locator("section", { has: page.getByRole("heading", { name: "Why calls were lost" }) });
  await expect(lost).toContainText("Price");
  await expect(lost).toContainText("24");
  await expect(lost).toContainText("Timing");
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Competitors mentioned" }) })).toContainText("Ledgerpro");

  const versions = page.locator("section", { has: page.getByRole("heading", { name: "By playbook version" }) });
  await expect(versions.locator("tbody tr", { hasText: "Version 2" })).toContainText("Best so far");
  await expect(versions.locator("tbody tr", { hasText: "Version 2" })).toContainText("29.4%");
  await expect(versions.locator("tbody tr", { hasText: "Version 1" })).not.toContainText("Best so far");
  const languages = page.locator("section", { has: page.getByRole("heading", { name: "By language" }) });
  await expect(languages.locator("tbody tr", { hasText: "Arabic" })).toContainText("30.0%");
  // Five unanswered calls have no language: too few to compare, and no rate is invented for them.
  await expect(languages.locator("tbody tr", { hasText: "Not detected" })).toContainText("Too few calls");

  await expect(alertWith("the playbook does not support")).toContainText("Said setup is free");
});

test("lead intelligence: filters, scores with their evidence, objections and next action", async () => {
  await openCampaign(page, ACCOUNTING, "Leads");
  await expect(page.getByText("80 leads")).toBeVisible();

  await page.getByRole("group", { name: "Lead quality" }).getByRole("button", { name: "Hot" }).click();
  await expect(page.getByText("16 leads match")).toBeVisible();
  const first = page.locator("tbody tr").first();
  await expect(first).toContainText("Maria Okafor");
  await expect(first).toContainText("100");
  await expect(first).toContainText("Send the calendar invite for Tuesday's demo and the pricing sheet.");

  await page.getByLabel("Buying intent").selectOption("medium");
  await expect(page.getByText("No leads match these filters")).toBeVisible();
  await page.getByLabel("Buying intent").selectOption("");
  await page.getByRole("group", { name: "Lead quality" }).getByRole("button", { name: "All" }).click();
  await page.getByLabel("Status").selectOption("callback");
  await expect(page.getByText("1 lead match")).toBeVisible();
  await expect(page.locator("tbody tr")).toContainText(["Daniel Reyes"]);
  await page.getByLabel("Status").selectOption("");

  await page.getByLabel("Search").fill("okafor");
  await expect(page.getByText("1 lead match")).toBeVisible();
  await page.getByRole("button", { name: "Maria Okafor" }).click();

  const panel = page.getByRole("dialog", { name: "Lead details" });
  await expect(panel.getByRole("heading", { name: "Maria Okafor" })).toBeVisible();
  await expect(panel).toContainText("Okafor & Lane Accounting");
  for (const factor of ["Fits the target customer", "Has a relevant need", "Is the decision-maker", "Buying timeline", "Budget fits", "Expressed interest"]) {
    await expect(panel.getByText(factor)).toBeVisible();
  }
  await expect(panel).toContainText("+25"); // the points the need contributed
  await expect(panel).toContainText("We lose most of a week on month-end.");
  await expect(panel).toContainText("High (88)");
  await expect(panel).toContainText("Recommended next action");
  await expect(panel).toContainText("1 of 1 handled");
  await expect(panel).toContainText("Month-end close takes four days");
  await expect(panel.getByRole("heading", { name: "Calls (2)" })).toBeVisible();
  await panel.getByRole("button", { name: "Show transcript" }).first().click();
  await expect(panel).toContainText("Tuesday at ten.");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("a lead nobody has called has no score, and the page says so", async () => {
  await openCampaign(page, ACCOUNTING, "Leads");
  await page.getByLabel("Status").selectOption("pending");
  await page.getByRole("group", { name: "Lead quality" }).getByRole("button", { name: "Unscored" }).click();
  await expect(page.getByText("17 leads match")).toBeVisible();
  await page.locator("tbody tr").last().click();
  const panel = page.getByRole("dialog", { name: "Lead details" });
  await expect(panel).toContainText("No score yet");
  await expect(panel).toContainText("Not assessed");
  await expect(panel).toContainText("This lead has not been called yet.");
});

test("coach recommendations can be reviewed, rejected, approved and rolled back", async () => {
  await openCampaign(page, ACCOUNTING, "Coach & playbook");

  // The coach needs an AI model. The test engine has no key, and the page must say so, not invent a draft.
  await page.getByRole("button", { name: "Ask the coach for improvements" }).click();
  await expect(page.getByTestId("coach-error")).toContainText("ANTHROPIC_API_KEY is not set");

  const card = (n: number) => page.locator("section", { has: page.getByTestId(`version-${n}`) }).last();
  await expect(card(2)).toContainText("Live");
  await expect(card(3)).toContainText("Awaiting your approval");
  await expect(card(3)).toContainText("Added an answer to the price objection using the published starting price.");
  await expect(card(3)).toContainText("Evidence: Price was raised on 25 calls and handled on 1.");

  await card(3).getByRole("button", { name: "See what changes" }).click();
  const diff = card(3).getByTestId("version-diff");
  await expect(diff).toContainText("Compared with version 2, which is live.");
  await expect(diff).toContainText("Opening line");
  await expect(diff).toContainText("Quick question about your month-end close?");
  await expect(diff).toContainText("It costs more than we pay now");

  // A draft with unanswered blocking questions cannot be published from here.
  await expect(card(4)).toContainText("Which demo slots are available?");
  await expect(card(4).getByRole("button", { name: "Approve and publish" })).toBeDisabled();
  await card(4).getByRole("button", { name: "Reject" }).click();
  await card(4).getByLabel("Why are you rejecting it?").fill("Demo slots are not agreed yet.");
  await card(4).getByRole("button", { name: "Reject version 4" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Version 4 was rejected. Calls are unchanged." })).toBeVisible();
  await expect(card(4)).toContainText("Rejected");
  await expect(card(2)).toContainText("Live");

  // Publishing takes two deliberate clicks, and cancelling leaves everything as it was.
  await card(3).getByRole("button", { name: "Approve and publish" }).click();
  await card(3).getByRole("button", { name: "Cancel" }).click();
  await expect(card(3)).toContainText("Awaiting your approval");
  await card(3).getByRole("button", { name: "Approve and publish" }).click();
  await card(3).getByRole("button", { name: "Yes, publish version 3" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Version 3 is now live." })).toBeVisible();
  await expect(card(3)).toContainText("Live");
  await expect(card(2)).toContainText("Earlier version");

  await card(2).getByRole("button", { name: "Roll back to version 2" }).click();
  await card(2).getByRole("button", { name: "Yes, roll back" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Version 2 is now live." })).toBeVisible();
  await expect(card(2)).toContainText("Live");
  await expect(card(3)).toContainText("Earlier version");

  // The decision is stored on the engine, not only on this screen.
  await page.reload();
  await expect(card(2)).toContainText("Live");
  await expect(card(4)).toContainText("Rejected: Demo slots are not agreed yet.");
});

test("a new A/B test shows its sample sizes and names no winner before there is evidence", async () => {
  await openCampaign(page, ACCOUNTING, "A/B tests");

  await expect(page.getByRole("heading", { name: "Start an A/B test" })).toBeVisible();
  const version = page.getByLabel(/Version to test against live version 2/);
  await expect(version.locator("option")).toHaveText(["Version 3 (earlier version)", "Version 1 (earlier version)"]); // the rejected draft is not offered
  await version.selectOption("3");
  await page.getByLabel("Answered leads needed on each side").fill("10");
  await page.getByRole("button", { name: "Start the test" }).click();
  await expect(alertWith("at least 30 answered leads")).toBeVisible();
  await page.getByLabel("Answered leads needed on each side").fill("30");
  await page.getByLabel("Name (optional)").fill("Month-end opening");
  await page.getByRole("button", { name: "Start the test" }).click();

  await expect(page.getByRole("heading", { name: "Month-end opening" })).toBeVisible();
  await expect(page.getByText("Too early to compare")).toBeVisible();
  await expect(page.getByTestId("test-summary")).toContainText("Still collecting: 30 more answered leads needed on the live version and 30 on the variant");
  await expect(page.getByTestId("arm-control").getByTestId("answered")).toHaveText("0 of 30 needed");
  await expect(page.getByTestId("arm-variant").getByTestId("answered")).toHaveText("0 of 30 needed");
  await expect(page.getByText("Ahead", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Make version 3 live" })).toBeDisabled();
  // Only one test at a time: the start form is gone while this one runs.
  await expect(page.getByRole("heading", { name: "Start an A/B test" })).toHaveCount(0);

  await page.getByRole("button", { name: "Stop the test" }).click();
  await page.getByRole("button", { name: "Yes, stop the test" }).click();
  await expect(page.getByRole("status").filter({ hasText: "The test was stopped." })).toBeVisible();
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Earlier tests" }) })).toContainText("Stopped, live version kept");
  await expect(page.getByRole("heading", { name: "Start an A/B test" })).toBeVisible();
});

test("a test with enough evidence can be promoted, and the tested version goes live", async () => {
  await openCampaign(page, DENTAL, "A/B tests");

  await expect(page.getByText("New version is ahead")).toBeVisible();
  await expect(page.getByTestId("test-summary")).toContainText("Version 2 converts 34.8% of answered leads against 9.1% for version 1.");
  await expect(page.getByTestId("arm-control").getByTestId("answered")).toHaveText("44 of 30 needed");
  await expect(page.getByTestId("arm-variant").getByTestId("answered")).toHaveText("46 of 30 needed");
  await expect(page.getByTestId("arm-variant")).toContainText("Ahead");
  await expect(page.getByTestId("arm-control")).not.toContainText("Ahead");

  await page.getByRole("button", { name: "Make version 2 live" }).click();
  await page.getByRole("button", { name: "Yes, make version 2 live" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Version 2 is now live and the test has ended." })).toBeVisible();
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Earlier tests" }) })).toContainText("New version made live");

  await page.getByRole("navigation", { name: "Campaign sections" }).getByRole("link", { name: "Coach & playbook" }).click();
  await expect(page.locator("section", { has: page.getByTestId("version-2") }).last()).toContainText("Live");
});

test("a campaign with no calls shows empty states, not zeros dressed up as results", async () => {
  await openCampaign(page, EMPTY);
  await expect(page.getByText("No calls yet", { exact: true })).toBeVisible();
  await expect(page.getByText("No objections have been recorded in reviewed calls yet.")).toBeVisible();
  await expect(page.getByText("No budget is set for this campaign")).toBeVisible();
  await expect(page.getByText("Cost per conversion")).toHaveCount(0);

  const tabs = page.getByRole("navigation", { name: "Campaign sections" });
  await tabs.getByRole("link", { name: "Leads" }).click();
  await expect(page.getByText("No leads in this campaign yet")).toBeVisible();
  await tabs.getByRole("link", { name: "Coach & playbook" }).click();
  await expect(page.getByText("No draft is waiting.")).toBeVisible();
  await tabs.getByRole("link", { name: "A/B tests" }).click();
  await expect(page.getByText("No version to test yet")).toBeVisible();
});

test("errors from the engine are shown with a way to retry", async () => {
  await page.goto("/dashboard/campaigns/No%20such%20campaign");
  await expect(alertWith("This could not be loaded")).toContainText("not found");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  // A response of the wrong shape is refused rather than half-rendered.
  await page.route("**/api/backend/campaigns", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "x" }]) }));
  await page.goto("/dashboard");
  await expect(alertWith("data this page does not understand")).toBeVisible();
  await page.unroute("**/api/backend/campaigns");

  await page.route("**/api/backend/campaigns", (route) => route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ detail: "The calling engine could not be reached." }) }));
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(alertWith("The calling engine could not be reached.")).toBeVisible();
  await page.unroute("**/api/backend/campaigns");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: ACCOUNTING, level: 2 })).toBeVisible();
});

test("signing out closes the dashboard again", async () => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  expect((await page.request.get("/api/backend/campaigns")).status()).toBe(401);
});
