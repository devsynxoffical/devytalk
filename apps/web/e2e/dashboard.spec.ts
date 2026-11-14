/**
 * The product, end to end, in a real browser against a real calling engine:
 * sign in, read the overview, open a campaign, understand its performance, work its
 * leads and calls, change its rules, review AI recommendations, approve or reject a
 * playbook and run an A/B test, without a command line.
 *
 * The numbers asserted here come from the engine's test fixtures
 * (aicallingagent/tests/seed_dashboard.py) and are counted by the engine itself.
 * Tests run in order and change data, so they need a freshly seeded engine.
 */
import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";

const TOKEN = process.env.E2E_API_TOKEN ?? "e2e-test-token";
const ACCOUNTING = "Accounting firms Q4";
const DENTAL = "Dental clinics pilot";
const EMPTY = "Law firms (not started)";

const ENGINE = process.env.DEVYTALK_API_URL ?? `http://127.0.0.1:${process.env.ENGINE_PORT ?? 8010}`;
const PASSWORD = "e2e-test-password"; // the engine's test fixtures create one account per role with it

test.describe.configure({ mode: "serial" });

// One browser session for the whole run, signed in once, the way a person works.
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await (await browser.newContext()).newPage();
});
test.afterAll(async () => {
  await page.context().close();
});

/** A session token from the engine, for an account in the test fixtures. */
async function engineSignIn(request: APIRequestContext, email: string, password = PASSWORD) {
  const response = await request.post(`${ENGINE}/api/auth/login`, { data: { email, password } });
  return { status: response.status(), token: response.ok() ? ((await response.json()) as { token: string }).token : "" };
}

/** A browser signed in as that account, the way the console's own sign-in leaves it. */
async function signedInAs(browser: Browser, request: APIRequestContext, email: string, password = PASSWORD) {
  const { token } = await engineSignIn(request, email, password);
  const context = await browser.newContext();
  await context.addCookies([{ name: "dt_session", value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Strict" }]);
  return { context, tab: await context.newPage(), token };
}

/** A request made by the page itself, as a script on the console would make it. */
const fromPage = (tab: Page, method: string, url: string, body?: unknown) =>
  tab.evaluate(
    async ([m, u, b]) => {
      const response = await fetch(u as string, { method: m as string, headers: b ? { "Content-Type": "application/json" } : undefined, body: b ? JSON.stringify(b) : undefined });
      return { status: response.status, body: (await response.json().catch(() => null)) as { detail?: string } | null };
    },
    [method, url, body] as const,
  );

/** An error message on the page (Next.js keeps an empty role="alert" element of its own). */
const alertWith = (text: string) => page.getByRole("alert").filter({ hasText: text });
const toast = (text: string) => page.getByRole("status").filter({ hasText: text });
const sections = () => page.getByRole("navigation", { name: "Campaign sections" });
const panel = (heading: string) => page.locator("section", { has: page.getByRole("heading", { name: heading }) });

async function openCampaign(name: string, tab?: string) {
  await page.goto("/dashboard/campaigns");
  await page.getByTestId("campaign-grid").getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  if (tab) await sections().getByRole("link", { name: tab }).click();
}

test("the console is closed to visitors who are not signed in", async () => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  expect((await page.request.get("/api/backend/campaigns")).status()).toBe(401);

  await page.getByRole("button", { name: "Use the engine's access token" }).click();
  await page.getByLabel("Access token").fill("not-the-right-token");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(alertWith("That access token was not accepted.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("signing in keeps the token away from page scripts and lists the campaigns", async () => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Use the engine's access token" }).click();
  await page.getByLabel("Access token").fill(TOKEN);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();

  await page.goto("/dashboard/campaigns");
  const grid = page.getByTestId("campaign-grid");
  for (const name of [ACCOUNTING, DENTAL, EMPTY]) await expect(grid.getByRole("link", { name })).toBeVisible();
  await expect(grid).toContainText("the budget of $32.00 was reached (spent $32.05)");

  const session = (await page.context().cookies()).find((c) => c.name === "dt_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Strict");
  expect(await page.evaluate(() => document.cookie)).not.toContain(TOKEN);
  expect(await page.content()).not.toContain(TOKEN);
});

test("the overview adds up real results across campaigns and lists what needs a decision", async () => {
  await page.goto("/dashboard");
  // 69 + 90 + 0 calls, 64 + 90 answered, 16 + 20 conversions: sums of what each campaign's report says.
  await expect(page.getByTestId("tile-calls")).toContainText("154");
  await expect(page.getByTestId("tile-calls")).toContainText("/ 159");
  await expect(page.getByTestId("tile-calls").getByRole("img", { name: "Share of calls answered: 97%" })).toBeVisible();
  await expect(page.getByTestId("tile-conversions")).toContainText("36");
  await expect(page.getByTestId("tile-conversions").getByRole("img", { name: "Conversion rate: 23%" })).toBeVisible();
  await expect(page.getByTestId("tile-hot")).toContainText("16");
  // Only one campaign has a budget; the other's spend is named, not folded into the ring.
  await expect(page.getByTestId("tile-spend")).toContainText("$32.05");
  await expect(page.getByTestId("tile-spend")).toContainText("of $32.00 budgeted");
  await expect(page.getByTestId("tile-spend")).toContainText("$45.00 unbudgeted");

  // Calls per day come from the engine: 14 days, and their total is the number of calls in the window.
  const timeline = page.getByTestId("timeline");
  await expect(timeline.getByRole("img", { name: "Calls placed per day" })).toBeVisible();
  await expect(timeline.locator("table tbody tr")).toHaveCount(14);
  await expect(page.getByText("Last 14 days · 159 calls placed")).toBeVisible();
  await page.getByRole("group", { name: "Show" }).getByRole("button", { name: "Conversions" }).click();
  await expect(page.getByText("Last 14 days · 36 conversions")).toBeVisible();

  // Campaigns compared, best conversion rate first; no rate is invented for a campaign with no calls.
  const ranking = page.getByTestId("campaign-ranking").locator("tbody tr");
  await expect(ranking.nth(0)).toContainText(ACCOUNTING);
  await expect(ranking.nth(0)).toContainText("25.0%");
  await expect(ranking.nth(1)).toContainText("22.2%");
  await expect(ranking.nth(2)).toContainText("No answered calls");
  await page.getByTestId("campaign-ranking").getByRole("button", { name: "Calls" }).click(); // sortable: most calls first
  await expect(ranking.nth(0)).toContainText(DENTAL);

  await expect(page.getByTestId("outcomes")).toContainText("Not interested");
  await expect(page.getByTestId("hot-leads").getByRole("listitem").first()).toContainText("Maria Okafor");
  await expect(page.getByText("16 of 42 scored leads are hot")).toBeVisible();

  // The bell lists what needs attention (one campaign paused itself).
  await page.getByRole("button", { name: "1 item needs your attention" }).click();
  await expect(page.getByRole("dialog", { name: "Needs attention" })).toContainText("Accounting firms Q4 paused itself");
  await page.keyboard.press("Escape");

  const attention = page.getByTestId("attention");
  await expect(attention).toContainText("2 statements the playbook does not support");
  await expect(attention).toContainText("Playbook version 3 is waiting for your decision");
  await attention.getByRole("link", { name: /the new version is ahead/ }).click();
  await expect(page).toHaveURL(/Dental%20clinics%20pilot\/experiments/);
});

test("the command palette jumps to any campaign section, and the grid filters by name", async () => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("tile-calls")).toBeVisible(); // the page is loaded and listening
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search campaigns and pages" });
  await search.fill("accounting leads");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Enter");
  await expect(page).toHaveURL(/Accounting%20firms%20Q4\/leads/);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Leads");

  await page.goto("/dashboard/campaigns");
  await page.getByLabel("Filter campaigns").fill("dental");
  const grid = page.getByTestId("campaign-grid");
  await expect(grid.getByRole("link", { name: DENTAL })).toBeVisible();
  await expect(grid.getByRole("link", { name: ACCOUNTING })).toHaveCount(0);
  await page.getByLabel("Filter campaigns").fill("zzz");
  await expect(page.getByText("No campaign matches")).toBeVisible();

  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Background work" }).click();
  await expect(page.getByRole("heading", { name: "Background work", level: 1 })).toBeVisible();
  await expect(page.getByText("No background work yet")).toBeVisible();
});

test("a campaign's sales performance is shown as the engine counted it", async () => {
  await openCampaign(ACCOUNTING);

  await expect(page.getByTestId("pause-reason")).toContainText("the budget of $32.00 was reached (spent $32.05)");
  const stat = (name: string) => page.locator(`[data-stat="${name}"]`);
  await expect(stat("Total calls")).toContainText("69");
  await expect(stat("Answered")).toContainText("64");
  await expect(stat("Conversions")).toContainText("16");
  await expect(stat("Conversion rate")).toContainText("25.0%");
  await expect(stat("Cost per conversion")).toContainText("$2.00");
  await expect(page.getByTestId("budget-spent")).toHaveText("$32.05");
  await expect(page.getByTestId("budget-remaining")).toHaveText("$0.00");

  // Objections, most frequent first, with how often they were handled.
  const objections = panel("Objections").locator("tbody tr");
  await expect(objections.nth(0)).toContainText("Price");
  await expect(objections.nth(0)).toContainText("25");
  await expect(objections.nth(0)).toContainText("4%");
  await expect(objections.nth(1)).toContainText("Competitor");

  await expect(panel("Why calls were lost")).toContainText("Price");
  await expect(panel("Why calls were lost")).toContainText("24");
  await expect(panel("Competitors mentioned")).toContainText("Ledgerpro");

  const versions = panel("By playbook version");
  await expect(versions.locator("tbody tr", { hasText: "Version 2" })).toContainText("Best so far");
  await expect(versions.locator("tbody tr", { hasText: "Version 2" })).toContainText("29.4%");
  await expect(versions.locator("tbody tr", { hasText: "Version 1" })).not.toContainText("Best so far");
  const languages = panel("By language");
  await expect(languages.locator("tbody tr", { hasText: "Arabic" })).toContainText("30.0%");
  // Five unanswered calls have no language: too few to compare, and no rate is invented for them.
  await expect(languages.locator("tbody tr", { hasText: "Not detected" })).toContainText("Too few calls");

  await expect(alertWith("the playbook does not support")).toContainText("Said setup is free");
});

test("lead workspace: filters, scores with their evidence, objections and next action", async () => {
  await openCampaign(ACCOUNTING, "Leads");
  await expect(page.getByTestId("lead-count")).toHaveText("80 leads");

  const quality = page.getByRole("group", { name: "Lead quality" });
  await quality.getByRole("button", { name: "Hot" }).click();
  await expect(page.getByTestId("lead-count")).toHaveText("16 leads match");
  const first = page.locator("tbody tr").first();
  await expect(first).toContainText("Maria Okafor");
  await expect(first).toContainText("100");
  await expect(first).toContainText("Send the calendar invite for Tuesday's demo and the pricing sheet.");

  await page.getByLabel("Buying intent").selectOption("medium");
  await expect(page.getByText("No leads match these filters")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByTestId("lead-count")).toHaveText("80 leads");
  await page.getByLabel("Status").selectOption("callback");
  await expect(page.getByTestId("lead-count")).toHaveText("1 lead match");
  await expect(page.locator("tbody tr")).toContainText(["Daniel Reyes"]);
  await page.getByLabel("Status").selectOption("");

  await page.getByLabel("Search leads").fill("okafor");
  await expect(page.getByTestId("lead-count")).toHaveText("1 lead match");
  await page.getByRole("button", { name: "Maria Okafor", exact: true }).click();

  const profile = page.getByRole("dialog", { name: "Lead details" });
  await expect(profile.getByRole("heading", { name: "Maria Okafor" })).toBeVisible();
  await expect(profile).toContainText("Okafor & Lane Accounting");
  for (const factor of ["Fits the target customer", "Has a relevant need", "Is the decision-maker", "Buying timeline", "Budget fits", "Expressed interest"]) {
    await expect(profile.getByText(factor)).toBeVisible();
  }
  await expect(profile).toContainText("+25"); // the points the need contributed
  await expect(profile).toContainText("We lose most of a week on month-end.");
  await expect(profile).toContainText("High (88)");
  await expect(profile).toContainText("Recommended next action");
  await expect(profile).toContainText("1 of 1 handled");
  await expect(profile).toContainText("Month-end close takes four days");
  await expect(profile.getByRole("heading", { name: "Calls (2)" })).toBeVisible();
  await profile.getByRole("button", { name: "Show transcript" }).first().click();
  await expect(profile).toContainText("Tuesday at ten.");
  await page.keyboard.press("Escape");
  await expect(profile).toBeHidden();
});

test("a lead nobody has called has no score, and the page says so", async () => {
  await openCampaign(ACCOUNTING, "Leads");
  await page.getByLabel("Status").selectOption("pending");
  await page.getByRole("group", { name: "Lead quality" }).getByRole("button", { name: "Unscored" }).click();
  await expect(page.getByTestId("lead-count")).toHaveText("17 leads match");
  await page.locator("tbody tr").last().click();
  const profile = page.getByRole("dialog", { name: "Lead details" });
  await expect(profile).toContainText("No score yet");
  await expect(profile).toContainText("Not assessed");
  await expect(profile).toContainText("This lead has not been called yet.");
  await profile.getByRole("button", { name: "Close" }).click();
});

test("call workspace: the log, a call's summary, follow-up and transcript, and calling one number", async () => {
  await openCampaign(ACCOUNTING, "Calls");
  const log = page.getByTestId("call-log");
  await expect(log.getByRole("listitem")).toHaveCount(69);

  await page.getByRole("group", { name: "Show calls" }).getByRole("button", { name: "Converted" }).click();
  await expect(log.getByRole("listitem")).toHaveCount(16);
  await log.getByRole("button", { name: /Maria Okafor/ }).click();
  const detail = panel("Maria Okafor");
  await expect(detail).toContainText("Confirmed budget with her partner and booked a demo for Tuesday.");
  await expect(detail).toContainText("Send the calendar invite for Tuesday's demo and the pricing sheet.");
  await expect(detail).toContainText("9 / 10"); // the reviewer's interest score
  await expect(detail.getByTestId("transcript")).toContainText("Tuesday at ten.");

  // Calling one number: checked here, confirmed by the person, and refused by the engine
  // in this test because no phone provider is configured. The refusal is shown, not hidden.
  await page.getByLabel("Phone number").fill("123");
  await page.getByRole("button", { name: "Call", exact: true }).click();
  await expect(page.getByText("Enter the full number with its country code")).toBeVisible();
  await page.getByLabel("Phone number").fill("+14155550999");
  await page.getByRole("button", { name: "Call", exact: true }).click();
  await expect(page.getByRole("group", { name: "Confirm calling" })).toContainText("This places a real phone call to +14155550999");
  await page.getByRole("button", { name: "Yes, call now" }).click();
  await expect(alertWith("cannot place calls, missing settings")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(log.getByRole("listitem")).toHaveCount(16); // nothing was placed
});

test("campaign controls and calling rules: start is confirmed, rules are validated and saved", async () => {
  await openCampaign(ACCOUNTING);
  await page.getByRole("button", { name: "Start dialing" }).click();
  await expect(page.getByRole("group", { name: "Confirm starting" })).toContainText("real phone calls");
  await page.getByRole("button", { name: "Yes, start dialing" }).click();
  await expect(alertWith("cannot place calls, missing settings")).toBeVisible(); // the engine's own refusal
  await page.getByRole("button", { name: "Cancel" }).click();

  await sections().getByRole("link", { name: "Settings" }).click();
  await expect(page.getByLabel("Budget (USD)")).toHaveValue("32");
  await expect(page.getByText("No changes.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save rules" })).toBeDisabled();

  await page.getByLabel("Earliest call").fill("20:00");
  await page.getByRole("button", { name: "Save rules" }).click();
  await expect(page.getByText("Must be later than the start.")).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByLabel("Earliest call")).toHaveValue("09:00");

  await page.getByLabel("Calls per day").fill("150");
  await page.getByRole("button", { name: "Sun" }).click();
  await expect(page.getByText("You have unsaved changes.")).toBeVisible();
  await page.getByRole("button", { name: "Save rules" }).click();
  await expect(toast("Calling rules saved.")).toBeVisible();

  await page.reload(); // stored on the engine, not only on this screen
  await expect(page.getByLabel("Calls per day")).toHaveValue("150");
  await expect(page.getByRole("button", { name: "Sun" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Budget (USD)")).toHaveValue("32"); // untouched settings are kept
  await sections().getByRole("link", { name: "Performance" }).click();
  await expect(panel("Budget and limits")).toContainText("150");
});

test("coach recommendations can be reviewed, rejected, approved and rolled back", async () => {
  await openCampaign(ACCOUNTING, "Coach & playbook");

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
  await expect(toast("Version 4 was rejected. Calls are unchanged.")).toBeVisible();
  await expect(card(4)).toContainText("Rejected");
  await expect(card(2)).toContainText("Live");

  // Publishing takes two deliberate clicks, and cancelling leaves everything as it was.
  await card(3).getByRole("button", { name: "Approve and publish" }).click();
  await card(3).getByRole("button", { name: "Cancel" }).click();
  await expect(card(3)).toContainText("Awaiting your approval");
  await card(3).getByRole("button", { name: "Approve and publish" }).click();
  await card(3).getByRole("button", { name: "Yes, publish version 3" }).click();
  await expect(toast("Version 3 is now live.")).toBeVisible();
  await expect(card(3)).toContainText("Live");
  await expect(card(2)).toContainText("Earlier version");

  await card(2).getByRole("button", { name: "Roll back to version 2" }).click();
  await card(2).getByRole("button", { name: "Yes, roll back" }).click();
  await expect(toast("Version 2 is now live.")).toBeVisible();
  await expect(card(2)).toContainText("Live");
  await expect(card(3)).toContainText("Earlier version");

  // The decision is stored on the engine, not only on this screen.
  await page.reload();
  await expect(card(2)).toContainText("Live");
  await expect(card(4)).toContainText("Rejected: Demo slots are not agreed yet.");
});

test("a new A/B test shows its sample sizes and names no winner before there is evidence", async () => {
  await openCampaign(ACCOUNTING, "A/B tests");

  await expect(page.getByRole("heading", { name: "Start an A/B test" })).toBeVisible();
  const version = page.getByLabel(/Version to test against live version 2/);
  await expect(version.locator("option")).toHaveText(["Version 3 (earlier version)", "Version 1 (earlier version)"]); // the rejected draft is not offered
  await version.selectOption("3");
  await page.getByLabel("Answered leads needed on each side").fill("10");
  await page.getByRole("button", { name: "Start the test" }).click();
  await expect(page.getByText("Each side needs at least 30 answered leads")).toBeVisible();
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
  await expect(toast("The test was stopped.")).toBeVisible();
  await expect(panel("Earlier tests")).toContainText("Stopped, live version kept");
  await expect(page.getByRole("heading", { name: "Start an A/B test" })).toBeVisible();
});

test("a test with enough evidence can be promoted, and the tested version goes live", async () => {
  await openCampaign(DENTAL, "A/B tests");

  await expect(page.getByText("New version is ahead")).toBeVisible();
  await expect(page.getByTestId("test-summary")).toContainText("Version 2 converts 34.8% of answered leads against 9.1% for version 1.");
  await expect(page.getByTestId("arm-control").getByTestId("answered")).toHaveText("44 of 30 needed");
  await expect(page.getByTestId("arm-variant").getByTestId("answered")).toHaveText("46 of 30 needed");
  await expect(page.getByTestId("arm-variant")).toContainText("Ahead");
  await expect(page.getByTestId("arm-control")).not.toContainText("Ahead");

  await page.getByRole("button", { name: "Make version 2 live" }).click();
  await page.getByRole("button", { name: "Yes, make version 2 live" }).click();
  await expect(toast("Version 2 is now live and the test has ended.")).toBeVisible();
  await expect(panel("Earlier tests")).toContainText("New version made live");

  await sections().getByRole("link", { name: "Coach & playbook" }).click();
  await expect(page.locator("section", { has: page.getByTestId("version-2") }).last()).toContainText("Live");
});

test("a campaign with no calls shows empty states, not zeros dressed up as results", async () => {
  await openCampaign(EMPTY);
  // Instead of an empty report: what is done and what comes next.
  const steps = page.getByTestId("getting-started");
  await expect(steps).toContainText("The agent has a playbook");
  await expect(steps).toContainText("Import the people to call");
  await expect(steps).toContainText("Connect the phone, speech and AI providers");
  await expect(page.getByText("No objections have been recorded in reviewed calls yet.")).toBeVisible();
  await expect(page.getByText("No budget is set for this campaign")).toBeVisible();
  await expect(page.getByText("Cost per conversion")).toHaveCount(0);

  await sections().getByRole("link", { name: "Leads" }).click();
  await expect(page.getByText("No leads in this campaign yet")).toBeVisible();
  await sections().getByRole("link", { name: "Calls" }).click();
  await expect(page.getByText("No calls yet", { exact: true })).toBeVisible();
  await sections().getByRole("link", { name: "Coach & playbook" }).click();
  await expect(page.getByText("No draft is waiting.")).toBeVisible();
  await sections().getByRole("link", { name: "A/B tests" }).click();
  await expect(page.getByText("No version to test yet")).toBeVisible();
});

test("the agent's knowledge is managed in the console: upload, check, build, remove", async () => {
  await openCampaign(EMPTY, "Knowledge");
  await expect(page.getByText("The agent has no documents yet")).toBeVisible();

  // A file type the engine cannot read is refused before it is sent.
  const picker = page.getByLabel("Choose documents to upload");
  await picker.setInputFiles({ name: "notes.exe", mimeType: "application/octet-stream", buffer: Buffer.from("x") });
  await expect(alertWith("notes.exe: this file type is not supported")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).click();

  await picker.setInputFiles({
    name: "pricing.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Pricing.\n\nThe Growth plan costs 49 dollars per user per month when billed annually.\n\nThe Starter plan costs 19 dollars per user per month.\n\nSupport.\n\nSupport is available on weekdays from nine to six."),
  });
  await expect(toast("The document was uploaded and is being read.")).toBeVisible();
  const row = page.getByTestId("sources").locator("tr, li", { hasText: "pricing.txt" }).first();
  await expect(row).toContainText("Ready", { timeout: 20_000 }); // read in the background, shown without a reload

  // What the agent would find for a prospect's question.
  await page.getByLabel("Prospect question").fill("How much does the Growth plan cost?");
  await page.getByRole("button", { name: "Find passages" }).click();
  const results = page.getByTestId("knowledge-results");
  await expect(results.locator("li").first()).toContainText("49 dollars");
  await expect(results).toContainText("From pricing.txt");

  // A website address is checked before it is sent.
  await page.getByLabel("Web address").fill("not a web address");
  await page.getByRole("button", { name: "Add website" }).click();
  await expect(alertWith("Enter a full web address")).toBeVisible();

  // Building a draft needs the AI model; without its key the engine refuses and says why.
  await page.getByRole("button", { name: "Build a draft playbook" }).click();
  const build = page.getByRole("group", { name: "Build a draft playbook" });
  await expect(build).toContainText("1 ready source");
  await build.getByRole("button", { name: "Build draft" }).click();
  await expect(build.getByRole("alert")).toContainText("ANTHROPIC_API_KEY is not set");
  await build.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Remove pricing.txt" }).click();
  await page.getByRole("group", { name: "Remove pricing.txt" }).getByRole("button", { name: "Remove source" }).click();
  await expect(toast("pricing.txt was removed.")).toBeVisible();
  await expect(page.getByText("The agent has no documents yet")).toBeVisible();
});

test("leads are imported from a sheet, with duplicates and bad numbers reported", async () => {
  await openCampaign(EMPTY, "Leads");
  const sheet = ["First Name,Company,Phone", "Ada,Northwind,+14155550101", "Grace,Contoso,+14155550102", "Ada,Northwind,+14155550101", "Linus,Fabrikam,12"].join("\n");
  await page.getByLabel("Choose a lead sheet to import").setInputFiles({ name: "leads.csv", mimeType: "text/csv", buffer: Buffer.from(sheet) });
  const report = page.getByTestId("import-report");
  await expect(report).toContainText("2 leads added.");
  await expect(report).toContainText("1 already in this campaign");
  await expect(report).toContainText("1 without a usable phone number");
  await expect(page.getByTestId("lead-count")).toHaveText("2 leads");

  await page.getByLabel("Choose a lead sheet to import").setInputFiles({ name: "leads.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") });
  await expect(alertWith("Choose a CSV or Excel file.")).toBeVisible();
});

test("a call in progress is followed line by line (the engine's answers are simulated)", async () => {
  // No phone provider is configured in tests, so the engine cannot have a real call in
  // progress. This checks the console's side only: the engine's answers for one extra,
  // made-up call are supplied here. The engine's side is covered by its own tests.
  const said = [
    { role: "assistant", text: "Hi, this is Jordan, an AI assistant from BrightBooks." },
    { role: "user", text: "Who gave you this number?" },
    { role: "assistant", text: "Your firm is listed in the public accountants register." },
  ];
  let heard = 1;
  let live = true;
  const row = () => ({
    call_run_id: 990001, lead: "Live Prospect", phone: "+14155550199", status: live ? "in-progress" : "completed", mode: "live", direction: "outbound", language: "en",
    answered_by: "human", disposition: live ? null : "not_interested", duration_seconds: live ? null : 42, cost_usd: 0, playbook_version: 2, summary: null, started_at: new Date().toISOString(),
  });
  await page.route("**/api/backend/campaigns/*/calls?*", async (route) => {
    const real = await route.fetch();
    await route.fulfill({ response: real, json: [row(), ...((await real.json()) as unknown[])] });
  });
  await page.route("**/api/backend/calls/990001", (route) =>
    route.fulfill({
      json: { call_run_id: 990001, status: row().status, live, mode: "live", direction: "outbound", language: "en", answered_by: "human", disposition: row().disposition, duration_seconds: row().duration_seconds, transcript: said.slice(0, heard), tool_events: [], summary: {}, recording_url: null, error: null },
    }),
  );

  await openCampaign(ACCOUNTING, "Calls");
  await page.getByRole("button", { name: /Live Prospect/ }).first().click();
  await expect(page.getByTestId("live-call")).toContainText("This call is in progress");
  const transcript = page.getByRole("log", { name: "Live transcript" });
  await expect(transcript.locator("li")).toHaveCount(1);

  heard = 2; // the prospect answers: it appears without anyone reloading the page
  await expect(transcript.locator("li")).toHaveCount(2);
  await expect(transcript).toContainText("Who gave you this number?");
  heard = 3;
  await expect(transcript.locator("li")).toHaveCount(3);

  live = false; // the call ends
  await expect(page.getByTestId("live-call")).toHaveCount(0);
  await expect(page.getByTestId("transcript").locator("li")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Live Prospect/ }).first()).toContainText("Not interested");

  await page.unroute("**/api/backend/campaigns/*/calls?*");
  await page.unroute("**/api/backend/calls/990001");
});

test("people sign in with their own account, and an admin manages the team", async ({ browser, request }) => {
  const context = await browser.newContext();
  const tab = await context.newPage();
  const say = (text: string) => tab.getByRole("status").filter({ hasText: text });
  await tab.goto("/login");
  await tab.getByLabel("Email").fill("admin@example.test");
  await tab.getByLabel("Password").fill("not the password");
  await tab.getByRole("button", { name: "Sign in" }).click();
  await expect(tab.getByRole("alert").filter({ hasText: "Email or password is incorrect." })).toBeVisible();
  await tab.getByLabel("Password").fill(PASSWORD);
  await tab.getByRole("button", { name: "Sign in" }).click();
  await expect(tab.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();

  // The session is the engine's, kept where page scripts cannot read it, and cannot be fetched through the proxy.
  const session = (await context.cookies()).find((c) => c.name === "dt_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.value.startsWith("dts_")).toBe(true);
  expect((await fromPage(tab, "POST", "/api/backend/auth/login", { email: "admin@example.test", password: PASSWORD })).status).toBe(404);

  await tab.getByRole("button", { name: "Account" }).click();
  await expect(tab.getByTestId("identity")).toContainText("Test Admin");
  await expect(tab.getByTestId("identity")).toContainText("admin@example.test");
  await tab.getByRole("link", { name: "Team" }).click();
  const team = tab.getByTestId("team");
  for (const email of ["admin@example.test", "operator@example.test", "viewer@example.test"]) await expect(team).toContainText(email);
  const own = team.locator("tr", { hasText: "admin@example.test" });
  await expect(own).toContainText("(you)");
  await expect(own.getByRole("button")).toHaveCount(0); // nobody deactivates or demotes themselves

  // Add a person; a weak password is refused before it is sent.
  await tab.getByRole("button", { name: "Add a person" }).click();
  await tab.getByLabel("Name", { exact: true }).fill("Noor Rahman");
  await tab.getByLabel("Email", { exact: true }).fill("noor@example.test");
  await tab.locator("section", { has: tab.getByRole("heading", { name: "Add a person" }) }).getByRole("combobox").selectOption("viewer");
  await tab.getByLabel("First password").fill("short");
  await tab.getByRole("button", { name: "Add person" }).click();
  await expect(tab.getByRole("alert").filter({ hasText: "Use at least 10 characters." })).toBeVisible();
  await tab.getByLabel("First password").fill("noor first password");
  await tab.getByRole("button", { name: "Add person" }).click();
  await expect(say("noor@example.test can now sign in as viewer.")).toBeVisible();

  await team.getByLabel("Role of noor@example.test").selectOption("operator");
  await expect(say("noor@example.test is now operator.")).toBeVisible();

  // Noor changes her own password; the old one stops working.
  const noor = await signedInAs(browser, request, "noor@example.test", "noor first password");
  await noor.tab.goto("/dashboard/account");
  await expect(noor.tab.getByText("Operator. Also runs campaigns")).toBeVisible();
  await noor.tab.getByLabel("Current password").fill("noor first password");
  await noor.tab.getByLabel("New password", { exact: true }).fill("noor second password");
  await noor.tab.getByLabel("New password again").fill("noor second password");
  await noor.tab.getByRole("button", { name: "Change password" }).click();
  await expect(noor.tab.getByRole("status").filter({ hasText: "Your password was changed" })).toBeVisible();
  expect((await engineSignIn(request, "noor@example.test", "noor first password")).status).toBe(401);
  expect((await engineSignIn(request, "noor@example.test", "noor second password")).status).toBe(200);

  // Deactivating her signs her out at once.
  await team.locator("tr", { hasText: "noor@example.test" }).getByRole("button", { name: "Deactivate" }).click();
  await tab.getByRole("group", { name: "Deactivate noor@example.test" }).getByRole("button", { name: "Deactivate" }).click();
  await expect(say("noor@example.test can no longer sign in")).toBeVisible();
  await expect(team.locator("tr", { hasText: "noor@example.test" })).toContainText("Deactivated");
  await noor.tab.goto("/dashboard/account");
  await expect(noor.tab).toHaveURL(/\/login/);
  expect((await engineSignIn(request, "noor@example.test", "noor second password")).status).toBe(401);
  await noor.context.close();
  await context.close();
});

test("each role is offered only what it may do, and the engine refuses the rest", async ({ browser, request }) => {
  const campaign = `/dashboard/campaigns/${encodeURIComponent(ACCOUNTING)}`;
  const api = `/api/backend/campaigns/${encodeURIComponent(ACCOUNTING)}`;

  const viewer = await signedInAs(browser, request, "viewer@example.test");
  await viewer.tab.goto(campaign);
  await expect(viewer.tab.getByTestId("pause-reason")).toBeVisible(); // reads everything
  await expect(viewer.tab.getByRole("button", { name: "Start dialing" })).toHaveCount(0);
  await viewer.tab.goto(`${campaign}/leads`);
  await expect(viewer.tab.getByTestId("lead-count")).toBeVisible();
  await expect(viewer.tab.getByRole("button", { name: "Import leads" })).toHaveCount(0);
  await viewer.tab.goto(`${campaign}/playbook`);
  await expect(viewer.tab.getByText(/Only an admin can (approve or reject|roll back to) this version\./).first()).toBeVisible();
  await expect(viewer.tab.getByRole("button", { name: "Ask the coach for improvements" })).toHaveCount(0);
  await viewer.tab.goto(`${campaign}/settings`);
  await expect(viewer.tab.getByText("Only an admin can change calling rules and budgets.")).toBeVisible();
  await expect(viewer.tab.getByLabel("Attempts per lead")).toBeDisabled();
  await expect(viewer.tab.getByRole("button", { name: "Save rules" })).toHaveCount(0);
  await viewer.tab.goto("/dashboard/team");
  await expect(viewer.tab.getByRole("alert").filter({ hasText: "Only an admin can see and manage the team" })).toBeVisible();
  // Hiding a button is a courtesy. The engine is what refuses.
  expect(await fromPage(viewer.tab, "POST", `${api}/pause`)).toEqual({ status: 403, body: { detail: "your role (viewer) cannot do this; it needs the operator role" } });
  expect((await fromPage(viewer.tab, "GET", "/api/backend/users")).status).toBe(403);
  await viewer.context.close();

  const operator = await signedInAs(browser, request, "operator@example.test");
  await operator.tab.goto(campaign);
  await expect(operator.tab.getByRole("button", { name: "Start dialing" })).toBeVisible();
  await operator.tab.goto(`${campaign}/playbook`);
  await expect(operator.tab.getByRole("button", { name: "Ask the coach for improvements" })).toBeVisible();
  await expect(operator.tab.getByText(/Only an admin can (approve or reject|roll back to) this version\./).first()).toBeVisible();
  await expect(operator.tab.getByRole("button", { name: /Approve and publish|Roll back to version/ })).toHaveCount(0);
  expect((await fromPage(operator.tab, "POST", `${api}/versions/3/approve`, {})).body?.detail).toBe("your role (operator) cannot do this; it needs the admin role");
  expect((await fromPage(operator.tab, "POST", `${api}/pause`)).status).toBe(200);
  await operator.tab.getByRole("button", { name: "Account" }).click();
  await expect(operator.tab.getByRole("link", { name: "Team" })).toHaveCount(0);
  await operator.context.close();
});

test("what a visitor sends through the website's forms reaches the console", async ({ browser }) => {
  const context = await browser.newContext();
  const visitor = await context.newPage();

  // The demo form: checked before it is sent, then handed to the engine.
  await visitor.goto("/demo");
  await visitor.getByRole("button", { name: "Book my demo" }).click();
  await expect(visitor.getByText("Please tell us your name")).toBeVisible();
  const form = visitor.locator("form", { has: visitor.getByRole("button", { name: "Book my demo" }) }); // the page footer has a newsletter form too
  await form.getByLabel("Full name").fill("Priya Shah");
  await form.getByLabel("Work email").fill("priya@northwind.example");
  await form.getByLabel("Company").fill("Northwind Accounting");
  await form.getByLabel("Team size").selectOption("6-20");
  await form.getByLabel("What would you like to see? (optional)").fill("How the agent handles price objections.");
  await visitor.getByRole("button", { name: "Book my demo" }).click();
  await expect(visitor.getByRole("heading", { level: 3 })).toBeVisible(); // the confirmation

  // The call-back bar: it promises a call back, not an instant call.
  await visitor.goto("/");
  await visitor.getByLabel("Your phone number").fill("415 555 0142");
  await visitor.getByRole("button", { name: "Call me" }).click();
  await expect(visitor.getByRole("status").filter({ hasText: "We will call you back on +1 415 555 0142." })).toBeVisible();
  await context.close();

  // Both are waiting in the console.
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Primary" }).first().getByRole("link", { name: /Requests/ })).toContainText("2");
  await page.getByRole("navigation", { name: "Primary" }).first().getByRole("link", { name: /Requests/ }).click();
  const requests = page.getByTestId("requests");
  const demo = requests.locator("tr", { hasText: "Priya Shah" });
  await expect(demo).toContainText("Demo request");
  await expect(demo).toContainText("Northwind Accounting · 6-20 people");
  await expect(demo).toContainText("How the agent handles price objections.");
  await expect(demo.getByRole("link", { name: "priya@northwind.example" })).toHaveAttribute("href", "mailto:priya@northwind.example");
  await expect(requests.locator("tr", { hasText: "Call back" }).getByRole("link", { name: "+1 415 555 0142" })).toHaveAttribute("href", "tel:+14155550142");

  await demo.getByRole("button", { name: "Mark handled" }).click();
  await expect(toast("Priya Shah was marked as handled.")).toBeVisible();
  await expect(requests.locator("tr", { hasText: "Priya Shah" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Waiting (1)" })).toBeVisible();
  await page.getByRole("group", { name: "Show requests" }).getByRole("button", { name: "Handled" }).click();
  await expect(page.getByTestId("requests").locator("tr", { hasText: "Priya Shah" })).toContainText("Handled by api token");
});

test("a campaign is created and set up in the console for outbound and inbound calls", async ({ request }) => {
  const NAME = "Spring outreach";
  // The overview says plainly that real calls are not possible yet, and Setup says what is missing.
  await page.goto("/dashboard");
  await expect(page.getByTestId("connections-banner")).toContainText("4 of 5 connections");
  await page.getByTestId("connections-banner").getByRole("link", { name: "Open setup" }).click();
  await expect(page.getByTestId("setup-state")).toContainText("Calls cannot be placed or answered yet");
  const connections = page.getByTestId("connections");
  await expect(connections.locator("li", { hasText: "Phone provider (Twilio)" })).toContainText("TWILIO_ACCOUNT_SID");
  await expect(connections.locator("li", { hasText: "Public address of this engine" })).toContainText("Connected");
  await expect(page.getByTestId("copy-value")).toHaveText("https://engine.example.test/twilio/inbound");

  // New campaign: the form says what is missing, then creates a campaign with a working playbook.
  await page.goto("/dashboard/campaigns");
  await page.getByRole("link", { name: "New campaign" }).click();
  await page.getByRole("button", { name: "Create campaign" }).click();
  await expect(alertWith("Give the campaign a name.")).toBeVisible();
  await expect(alertWith("Say what the agent is offering.")).toBeVisible();
  await page.getByLabel("Campaign name").fill(NAME);
  await page.getByLabel("Company name").fill("Northwind Accounting");
  await page.getByLabel("What the agent offers").fill("A 20-minute demo of fixed-price monthly bookkeeping.");
  await page.getByLabel("Prices and terms the agent may state (optional)").fill("From 300 dollars per month.");
  await page.getByLabel("Agent's first name").fill("Sam");
  await page.getByRole("group", { name: "Also switches to, when the prospect speaks it" }).getByRole("button", { name: "Arabic" }).click();
  await page.getByRole("button", { name: "Create campaign" }).click();
  await expect(page.getByRole("heading", { name: NAME, level: 1 })).toBeVisible();
  await expect(page.getByTestId("getting-started")).toContainText("It speaks English, Arabic.");

  // What the agent will say came from the form, and it is live as version 1.
  await sections().getByRole("link", { name: "Coach & playbook" }).click();
  await expect(page.getByTestId("version-1")).toContainText("Live");

  // Languages: add French.
  await sections().getByRole("link", { name: "Settings" }).click();
  const languages = panel("Languages");
  await expect(languages.getByRole("button", { name: "Arabic" })).toHaveAttribute("aria-pressed", "true");
  await languages.getByRole("button", { name: "French" }).click();
  await languages.getByRole("button", { name: "Save languages" }).click();
  await expect(toast("The agent opens in English and switches to Arabic or French when the prospect speaks it.")).toBeVisible();
  // The engine's default speech recognition is not confirmed for Arabic when it has to follow
  // the prospect's language. The console says so instead of letting calls go wrong.
  await expect(languages.getByRole("status")).toContainText("speech recognition is not confirmed for Arabic");

  // Inbound: this campaign answers a number; the page says what to set at the phone provider.
  const inbound = panel("Inbound calls");
  await expect(page.getByTestId("inbound-state")).toContainText("Not answering inbound calls");
  await inbound.getByLabel("Phone number to answer").fill("12");
  await inbound.getByRole("button", { name: "Answer this number" }).click();
  await expect(alertWith("Enter the full phone number, with its country code.")).toBeVisible();
  await inbound.getByLabel("Phone number to answer").fill("+1 (415) 555-0123");
  await inbound.getByRole("button", { name: "Answer this number" }).click();
  // Refused, with the reason: the agent could not understand an Arabic-speaking caller.
  await expect(inbound.getByRole("alert")).toContainText("not confirmed for Arabic");
  await expect(page.getByTestId("inbound-state")).toContainText("Not answering inbound calls");

  // English and French are confirmed: drop Arabic, and the number is accepted.
  await languages.getByRole("button", { name: "Arabic" }).click();
  await languages.getByRole("button", { name: "Save languages" }).click();
  await expect(toast("The agent opens in English and switches to French when the prospect speaks it.")).toBeVisible();
  await expect(languages.getByText("speech recognition is not confirmed")).toHaveCount(0);
  await inbound.getByRole("button", { name: "Answer this number" }).click();
  await expect(toast("Calls to +14155550123 are answered with this campaign's playbook.")).toBeVisible();
  await expect(page.getByTestId("inbound-state")).toContainText("Answering");
  await expect(inbound.getByTestId("copy-value")).toHaveText("https://engine.example.test/twilio/inbound");

  // Someone calls the number. The test plays the phone provider's part and sends the engine
  // the request the provider would send; no real call exists and no audio is exchanged.
  const ring = await request.post(`${ENGINE}/twilio/inbound`, { form: { CallSid: "CAe2einbound1", From: "+14155550777", To: "+14155550123" } });
  expect(await ring.text()).toContain("<Stream"); // the engine answers with this campaign

  await sections().getByRole("link", { name: "Calls" }).click();
  await page.getByLabel("Direction").selectOption("inbound");
  const call = page.getByRole("button", { name: /\+14155550777/ }).first();
  await expect(call).toContainText("On the call");
  await page.getByLabel("Direction").selectOption("outbound");
  await expect(page.getByRole("button", { name: /\+14155550777/ })).toHaveCount(0);

  // Stop answering: the number is released.
  await sections().getByRole("link", { name: "Settings" }).click();
  await panel("Inbound calls").getByRole("button", { name: "Stop answering" }).click();
  await page.getByRole("group", { name: "Stop answering inbound calls" }).getByRole("button", { name: "Stop answering" }).click();
  await expect(toast("This campaign no longer answers inbound calls.")).toBeVisible();
  await expect(page.getByTestId("inbound-state")).toContainText("Not answering inbound calls");
  const refused = await request.post(`${ENGINE}/twilio/inbound`, { form: { CallSid: "CAe2einbound2", From: "+14155550777", To: "+14155550123" } });
  expect(await refused.text()).not.toContain("<Stream");
});

test("a second organization is separate from the first, down to the same campaign name", async ({ browser, request }) => {
  // The operator (signed in with the engine's token) creates a customer and its first admin.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Account" }).click();
  await expect(page.getByTestId("identity").getByTestId("organization")).toHaveText("Default organization");
  await page.getByRole("link", { name: "Organizations" }).click();
  await expect(page.getByTestId("organizations")).toContainText("Default organization");
  await page.getByRole("button", { name: "New organization" }).click();
  await page.getByLabel("Organization name").fill("Bolt Logistics");
  await page.getByLabel("First admin's name").fill("Bo Ito");
  await page.getByLabel("First admin's email").fill("bo@bolt.example");
  await page.getByLabel("Their first password").fill("bolt first password");
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(toast("Bolt Logistics was created.")).toBeVisible();
  await expect(page.getByTestId("organizations").locator("tr", { hasText: "Bolt Logistics" })).toContainText("1 active of 1");

  // Its admin signs in to an empty console: none of the first organization's campaigns, people or requests.
  const bolt = await signedInAs(browser, request, "bo@bolt.example", "bolt first password");
  await bolt.tab.goto("/dashboard");
  await expect(bolt.tab.getByText("No campaigns yet")).toBeVisible();
  await bolt.tab.getByRole("button", { name: "Account" }).click();
  await expect(bolt.tab.getByTestId("identity").getByTestId("organization")).toHaveText("Bolt Logistics");
  await expect(bolt.tab.getByRole("link", { name: "Organizations" })).toHaveCount(0);
  await bolt.tab.goto(`/dashboard/campaigns/${encodeURIComponent(ACCOUNTING)}`);
  await expect(bolt.tab.getByRole("alert").filter({ hasText: "not found" })).toBeVisible(); // somebody else's campaign does not exist here
  await bolt.tab.goto("/dashboard/team");
  await expect(bolt.tab.getByTestId("team")).toContainText("bo@bolt.example");
  await expect(bolt.tab.getByTestId("team")).not.toContainText("example.test"); // the first organization's people
  await bolt.tab.goto("/dashboard/organizations");
  await expect(bolt.tab.getByRole("alert").filter({ hasText: "Only the operator of this deployment manages organizations" })).toBeVisible();
  for (const path of ["campaigns", "users", "requests", "jobs", "timeline"]) {
    const answer = await fromPage(bolt.tab, "GET", `/api/backend/${path}`);
    expect(JSON.stringify(answer.body), path).not.toMatch(/Accounting|Dental|Law firms|example\.test|northwind/);
  }
  expect((await fromPage(bolt.tab, "GET", "/api/backend/calls/1")).status).toBe(404);

  // It may use a campaign name the first organization already has, and the two stay apart.
  await bolt.tab.goto("/dashboard/campaigns/new");
  await bolt.tab.getByLabel("Campaign name").fill(ACCOUNTING);
  await bolt.tab.getByLabel("Company name").fill("Bolt Logistics");
  await bolt.tab.getByLabel("What the agent offers").fill("Same-day delivery for local shops.");
  await bolt.tab.getByRole("button", { name: "Create campaign" }).click();
  await expect(bolt.tab.getByRole("heading", { name: ACCOUNTING, level: 1 })).toBeVisible();
  await expect(bolt.tab.getByTestId("getting-started")).toContainText("Import the people to call"); // its own, with no leads
  await page.goto(`/dashboard/campaigns/${encodeURIComponent(ACCOUNTING)}/leads`);
  await expect(page.getByTestId("lead-count")).toHaveText("80 leads"); // the first organization's campaign is untouched
  await bolt.context.close();
});

test("an organization calls from its own numbers, sets its own transfers and bookings, and makes keys for its systems", async ({ browser, request }) => {
  // Bolt Logistics was created in the test above. It has borrowed nothing from the first organization.
  const bolt = await signedInAs(browser, request, "bo@bolt.example", "bolt first password");
  await bolt.tab.goto("/dashboard/organization");
  await expect(bolt.tab.getByTestId("no-number")).toContainText("No phone number to call from yet");
  await expect(bolt.tab.getByText("None assigned")).toBeVisible();

  // The operator assigns it numbers; an organization cannot type a caller number of its own choosing.
  await page.goto("/dashboard/organizations");
  await expect(page.getByTestId("organizations").locator("tr", { hasText: "Bolt Logistics" })).toContainText("No number");
  await page.getByRole("button", { name: "Assign numbers to Bolt Logistics" }).click();
  await page.getByLabel("Caller numbers").fill("+1 (415) 555-0210\n+14155550211");
  await page.getByRole("button", { name: "Assign numbers", exact: true }).click();
  await expect(toast("Bolt Logistics now calls from those 2 numbers.")).toBeVisible();
  await expect(page.getByTestId("organizations").locator("tr", { hasText: "Bolt Logistics" })).toContainText("+14155550210, +14155550211");
  expect((await fromPage(bolt.tab, "PUT", "/api/backend/organizations/2/telephony", { from_numbers: ["+14155550999"] })).status).toBe(403);

  await bolt.tab.reload();
  await expect(bolt.tab.getByTestId("no-number")).toHaveCount(0);
  await expect(bolt.tab.getByTestId("from-numbers")).toHaveText("+14155550210+14155550211");

  // Its admin sets where calls are transferred and where bookings are reported. The secret is never shown again.
  await bolt.tab.getByLabel("Transfer calls to").fill("+14155550299");
  await bolt.tab.getByLabel("Report bookings to").fill("http://bolt.example/plain");
  await bolt.tab.getByRole("button", { name: "Save" }).click();
  await expect(bolt.tab.getByRole("alert").filter({ hasText: "https://" })).toBeVisible();
  await bolt.tab.getByLabel("Report bookings to").fill("https://bolt.example/hooks/bookings");
  await bolt.tab.getByLabel("Signing secret").fill("bolt-signing-secret");
  await bolt.tab.getByRole("button", { name: "Save" }).click();
  await expect(bolt.tab.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  await expect(bolt.tab.getByLabel("Signing secret")).toHaveValue("");
  await expect(bolt.tab.getByText("A secret is set and is never shown.")).toBeVisible();
  expect(JSON.stringify((await fromPage(bolt.tab, "GET", "/api/backend/organization/settings")).body)).not.toContain("bolt-signing-secret");

  // A key for one of its systems: shown once, then only its first characters.
  await bolt.tab.getByRole("button", { name: "Account" }).click();
  await bolt.tab.getByRole("link", { name: "API keys" }).click();
  await expect(bolt.tab.getByText("No API keys yet")).toBeVisible();
  await bolt.tab.getByRole("button", { name: "New key" }).click();
  await bolt.tab.getByLabel("What will use it").fill("CRM sync");
  await bolt.tab.getByRole("button", { name: "Create key" }).click();
  const key = (await bolt.tab.getByTestId("new-key").getByTestId("copy-value").textContent()) ?? "";
  expect(key).toMatch(/^dtk_/);
  await bolt.tab.getByRole("button", { name: "I have copied it" }).click();
  await expect(bolt.tab.getByTestId("api-keys")).toContainText("CRM sync");
  await expect(bolt.tab.getByTestId("api-keys")).not.toContainText(key);

  // The key works against the engine, inside Bolt only, and only to look.
  const asKey = { Authorization: `Bearer ${key}` };
  const campaigns = await request.get(`${ENGINE}/api/campaigns`, { headers: asKey });
  expect(campaigns.status()).toBe(200);
  expect(JSON.stringify(await campaigns.json())).not.toMatch(/Dental|Law firms/);
  expect((await request.put(`${ENGINE}/api/campaigns/${encodeURIComponent(ACCOUNTING)}/rules`, { headers: asKey, data: {} })).status()).toBe(403);

  // Revoked, it is refused at once.
  await bolt.tab.getByTestId("api-keys").getByRole("button", { name: "Revoke" }).click();
  await bolt.tab.getByRole("button", { name: "Revoke key" }).click();
  await expect(bolt.tab.getByRole("status").filter({ hasText: "CRM sync was revoked." })).toBeVisible();
  await expect(bolt.tab.getByTestId("api-keys")).toContainText("Revoked");
  expect((await request.get(`${ENGINE}/api/campaigns`, { headers: asKey })).status()).toBe(401);
  await bolt.context.close();
});

test("an organization keeps its own do-not-call list, erases a person on request, and sets consent and retention", async ({ browser, request }) => {
  const bolt = await signedInAs(browser, request, "bo@bolt.example", "bolt first password");
  const tab = bolt.tab;
  const said = (text: string) => tab.getByRole("status").filter({ hasText: text });

  // Two people to call, in Bolt's own campaign.
  await tab.goto(`/dashboard/campaigns/${encodeURIComponent(ACCOUNTING)}/leads`);
  const sheet = ["First Name,Company,Phone", "Mina,Harbor Cafe,+14155550301", "Otto,Pier Books,+14155550302"].join("\n");
  await tab.getByLabel("Choose a lead sheet to import").setInputFiles({ name: "leads.csv", mimeType: "text/csv", buffer: Buffer.from(sheet) });
  await expect(tab.getByTestId("import-report")).toContainText("2 leads added.");

  // The list starts empty; a number is added by hand, and something that is not a number is refused.
  await tab.getByRole("button", { name: "Account" }).click();
  await tab.getByRole("link", { name: "Do not call" }).click();
  await expect(tab.getByText("Nobody is on the list yet")).toBeVisible();
  await tab.getByLabel("Phone number", { exact: true }).fill("not a number");
  await tab.getByRole("button", { name: "Add number" }).click();
  await expect(tab.getByRole("alert").filter({ hasText: "is not a phone number" })).toBeVisible();
  await tab.getByLabel("Phone number", { exact: true }).fill("+1 415 555 0302");
  await tab.getByLabel("Reason").fill("Asked by email");
  await tab.getByRole("button", { name: "Add number" }).click();
  await expect(said("will not be called again.")).toBeVisible();
  await expect(tab.getByTestId("do-not-call")).toContainText("+14155550302");
  await expect(tab.getByTestId("do-not-call")).toContainText("Asked by email");

  // A whole list is imported: what was already there and what is not a number are counted, not hidden.
  const list = ["+14155550302", "+14155550401", "+14155550402", "twelve"].join("\n");
  await tab.getByLabel("Choose a list of numbers to import").setInputFiles({ name: "register.txt", mimeType: "text/plain", buffer: Buffer.from(list) });
  await expect(said("2 numbers added, 1 already on the list. 1 could not be read as a phone number")).toBeVisible();
  await expect(tab.getByRole("heading", { name: "3 numbers" })).toBeVisible();
  await tab.getByLabel("Find a number").fill("0401");
  await expect(tab.getByTestId("do-not-call").locator("tbody tr")).toHaveCount(1);
  await tab.getByLabel("Find a number").fill("");

  // Only an admin takes a number off the list, and is asked first.
  await tab.getByRole("button", { name: "Take +14155550402 off the list" }).click();
  await tab.getByRole("button", { name: "Remove from the list" }).click();
  await expect(said("+14155550402 was taken off the list and may be called again.")).toBeVisible();
  await expect(tab.getByRole("heading", { name: "2 numbers" })).toBeVisible();

  // The first organization's list is its own: none of Bolt's numbers are on it.
  await page.goto("/dashboard/do-not-call");
  await expect(page.getByRole("heading", { name: "Do not call", level: 1 })).toBeVisible();
  expect(JSON.stringify((await fromPage(page, "GET", "/api/backend/do-not-call?limit=500")).body)).not.toMatch(/4155550302|4155550401/);

  // A person asks to be erased: their details go, and the number stays on the list.
  await tab.getByLabel("Phone number of the person to erase").fill("+14155550301");
  await tab.getByRole("button", { name: "Erase this person…" }).click();
  await tab.getByRole("button", { name: "Erase", exact: true }).click();
  await expect(tab.getByTestId("erased")).toContainText("1 lead records");
  await expect(tab.getByTestId("erased")).toContainText("The number is on the do-not-call list.");
  await expect(tab.getByTestId("do-not-call")).toContainText("+14155550301");
  await tab.goto(`/dashboard/campaigns/${encodeURIComponent(ACCOUNTING)}/leads`);
  await expect(tab.getByTestId("lead-count")).toBeVisible();
  await expect(tab.getByText("Mina")).toHaveCount(0);
  await expect(tab.getByText("Harbor Cafe")).toHaveCount(0);

  // The campaign calls only people with a ground for it on record.
  await tab.goto(`/dashboard/campaigns/${encodeURIComponent(ACCOUNTING)}/settings`);
  await tab.getByLabel("Only call people with consent on record").check();
  await tab.getByRole("button", { name: "Save rules" }).click();
  await expect(said("Calling rules saved.")).toBeVisible();
  await tab.reload();
  await expect(tab.getByLabel("Only call people with consent on record")).toBeChecked();

  // What was said on calls is kept for a period the organization chooses.
  await tab.goto("/dashboard/organization");
  await tab.getByLabel("Keep what was said on calls for").fill("0");
  await tab.getByRole("button", { name: "Save" }).click();
  await expect(tab.getByRole("alert").filter({ hasText: "whole number of days" })).toBeVisible();
  await tab.getByLabel("Keep what was said on calls for").fill("90");
  await tab.getByRole("button", { name: "Save" }).click();
  await expect(said("Saved.")).toBeVisible();
  await tab.reload();
  await expect(tab.getByLabel("Keep what was said on calls for")).toHaveValue("90");
  await expect(tab.getByLabel("Transfer calls to")).toHaveValue("+14155550299"); // the rest is as it was
  await bolt.context.close();
});

test("an organization has its own systems told about calls and bookings, at addresses it registers", async ({ browser, request }) => {
  const bolt = await signedInAs(browser, request, "bo@bolt.example", "bolt first password");
  const tab = bolt.tab;
  const said = (text: string) => tab.getByRole("status").filter({ hasText: text });
  await tab.goto("/dashboard");
  await tab.getByRole("button", { name: "Account" }).click();
  await tab.getByRole("link", { name: "Webhooks" }).click();
  await expect(tab.getByText("No endpoints yet")).toBeVisible();

  // Only an https address is accepted; one inside a network is refused by the engine, not by the form.
  await tab.getByRole("button", { name: "New endpoint" }).click();
  await expect(tab.getByLabel("A call is over and its outcome is known")).toBeChecked(); // what a CRM usually wants is chosen to begin with
  await expect(tab.getByLabel("A meeting is booked")).toBeChecked();
  await tab.getByLabel("Address").fill("https://10.0.0.5/hooks");
  await tab.getByRole("button", { name: "Add endpoint" }).click();
  await expect(tab.getByRole("alert").filter({ hasText: "is not a public address" })).toBeVisible();
  await tab.getByLabel("Address").fill("https://hooks.bolt.example/devytalk");
  await tab.getByLabel("What it is").fill("CRM");
  await tab.getByLabel("A call is placed").check();
  await tab.getByRole("button", { name: "Add endpoint" }).click();

  // The signing secret is shown once.
  const secret = (await tab.getByTestId("new-secret").getByTestId("copy-value").textContent()) ?? "";
  expect(secret).toMatch(/^whsec_/);
  await tab.getByRole("button", { name: "I have copied it" }).click();
  const row = tab.getByTestId("webhooks").locator("tr", { hasText: "hooks.bolt.example" });
  await expect(row).toContainText("3 events");
  await expect(row).toContainText("On");
  await expect(row).toContainText("Never");
  expect(JSON.stringify((await fromPage(tab, "GET", "/api/backend/webhooks")).body)).not.toContain(secret);

  // A test delivery says how it went. This address does not exist, and the console says so instead of pretending.
  await tab.getByRole("button", { name: "Send a test to https://hooks.bolt.example/devytalk" }).click();
  await expect(tab.getByRole("alert").filter({ hasText: "The test did not arrive." })).toBeVisible();
  await tab.getByRole("button", { name: "Deliveries to https://hooks.bolt.example/devytalk" }).click();
  const sent = tab.getByTestId("deliveries");
  await expect(sent.locator("li")).toHaveCount(1);
  await expect(sent).toContainText("Failed");
  await expect(sent).toContainText("ping");
  await expect(sent.getByRole("button", { name: "Send again" })).toHaveCount(0); // a test is sent anew, not again
  await tab.keyboard.press("Escape");

  // Switched off and on again; a new secret; all asked about first.
  await row.getByRole("button", { name: "Switch off" }).click();
  await tab.getByRole("group", { name: "Switch off" }).getByRole("button", { name: "Switch off" }).click();
  await expect(said("Switched off.")).toBeVisible();
  await expect(row).toContainText("Switched off by an admin.");
  await row.getByRole("button", { name: "Switch on" }).click();
  await expect(said("Switched on.")).toBeVisible();
  await row.getByRole("button", { name: "New secret" }).click();
  await tab.getByRole("group", { name: "Replace the secret" }).getByRole("button", { name: "Replace the secret" }).click();
  const replaced = (await tab.getByTestId("new-secret").getByTestId("copy-value").textContent()) ?? "";
  expect(replaced).toMatch(/^whsec_/);
  expect(replaced).not.toBe(secret);

  // The first organization sees none of this, and a key cannot register an address, whatever its role.
  expect(JSON.stringify((await fromPage(page, "GET", "/api/backend/webhooks")).body)).not.toContain("bolt.example");
  const made = await fromPage(tab, "POST", "/api/backend/keys", { name: "Integration", role: "admin" });
  const asKey = { Authorization: `Bearer ${(made.body as { key: string }).key}` };
  expect((await request.post(`${ENGINE}/api/webhooks`, { headers: asKey, data: { url: "https://elsewhere.example/tap", events: ["*"] } })).status()).toBe(403);

  await row.getByRole("button", { name: "Remove" }).click();
  await tab.getByRole("group", { name: "Remove endpoint" }).getByRole("button", { name: "Remove endpoint" }).click();
  await expect(said("The endpoint was removed.")).toBeVisible();
  await expect(tab.getByText("No endpoints yet")).toBeVisible();
  await bolt.context.close();
});

test("a person joins by a link and chooses their own password; a reset link gets them back in", async ({ browser, request }) => {
  const bolt = await signedInAs(browser, request, "bo@bolt.example", "bolt first password");
  const admin = bolt.tab;
  const said = (text: string) => admin.getByRole("status").filter({ hasText: text });
  await admin.goto("/dashboard/team");

  // The admin makes a link. Nobody types a password for anyone else.
  await admin.getByRole("button", { name: "Invite by link" }).click();
  await admin.getByLabel("Their name").fill("Nia");
  await admin.getByLabel("Their email").fill("nia@bolt.example");
  await admin.getByLabel("Role").selectOption("viewer");
  await admin.getByRole("button", { name: "Make invitation link" }).click();
  const link = (await admin.getByTestId("invite-link").getByTestId("copy-value").textContent()) ?? "";
  expect(link).toMatch(/\/invite\/dti_[\w-]+$/);
  await admin.getByRole("button", { name: "I have copied it" }).click();
  await expect(admin.getByTestId("invitations")).toContainText("nia@bolt.example");
  await expect(admin.getByTestId("invitations")).toContainText("Waiting");
  expect(JSON.stringify((await fromPage(admin, "GET", "/api/backend/invitations")).body)).not.toContain(link.split("/").pop());

  // The person opens it without being signed in, and chooses a password.
  const visitor = await browser.newContext();
  const nia = await visitor.newPage();
  await nia.goto(link);
  await expect(nia.getByRole("heading", { name: "Join Bolt Logistics" })).toBeVisible();
  await expect(nia.getByText("You were invited as a viewer.")).toBeVisible();
  await expect(nia.getByLabel("Your name")).toHaveValue("Nia");
  await nia.getByLabel("Choose a password").fill("nia chose this herself");
  await nia.getByLabel("The same password again").fill("nia chose something else");
  await nia.getByRole("button", { name: "Create my account" }).click();
  await expect(nia.getByRole("alert").filter({ hasText: "The two passwords are not the same." })).toBeVisible();
  await nia.getByLabel("The same password again").fill("nia chose this herself");
  await nia.getByRole("button", { name: "Create my account" }).click();
  await nia.waitForURL("**/dashboard");
  await nia.getByRole("button", { name: "Account" }).click();
  await expect(nia.getByTestId("identity")).toContainText("nia@bolt.example");
  await expect(nia.getByTestId("identity").getByTestId("organization")).toHaveText("Bolt Logistics");
  await expect(nia.getByRole("link", { name: "Team" })).toHaveCount(0); // a viewer
  // The session is in the cookie page scripts cannot read, and a link cannot be used through the proxy to get one.
  expect(await nia.evaluate(() => document.cookie)).not.toContain("dt_session");
  expect((await fromPage(nia, "POST", "/api/backend/auth/invitations/dti_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", { password: "another long password" })).status).toBe(404);

  // Used once, the link is gone.
  const second = await browser.newContext();
  const again = await second.newPage();
  await again.goto(link);
  await expect(again.getByRole("heading", { name: "This link does not work any more" })).toBeVisible();
  await second.close();
  await admin.reload();
  await expect(admin.getByTestId("invitations")).toContainText("Joined");
  await expect(admin.getByTestId("team")).toContainText("nia@bolt.example");

  // She forgets the password: the admin makes a reset link. Using it signs her out everywhere else.
  await admin.getByRole("button", { name: "Make a reset link for nia@bolt.example" }).click();
  const reset = (await admin.getByTestId("invite-link").getByTestId("copy-value").textContent()) ?? "";
  await expect(admin.getByTestId("invite-link")).toContainText("Send this reset link to nia@bolt.example");
  const elsewhere = await browser.newContext();
  const phone = await elsewhere.newPage();
  await phone.goto(reset);
  await expect(phone.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await phone.getByLabel("New password").fill("a password nia will remember");
  await phone.getByLabel("The same password again").fill("a password nia will remember");
  await phone.getByRole("button", { name: "Set password and sign in" }).click();
  await phone.waitForURL("**/dashboard");
  expect((await fromPage(nia, "GET", "/api/backend/auth/me")).status).toBe(401); // the earlier sign-in is over
  expect((await engineSignIn(request, "nia@bolt.example", "a password nia will remember")).token).toBeTruthy();
  await elsewhere.close();
  await visitor.close();

  // An invitation can be withdrawn before anyone uses it.
  await admin.getByRole("button", { name: "I have copied it" }).click();
  await admin.getByRole("button", { name: "Invite by link" }).click();
  await admin.getByLabel("Their email").fill("late@bolt.example");
  await admin.getByRole("button", { name: "Make invitation link" }).click();
  const withdrawn = (await admin.getByTestId("invite-link").getByTestId("copy-value").textContent()) ?? "";
  await admin.getByRole("button", { name: "Withdraw the invitation for late@bolt.example" }).click();
  await expect(said("The invitation for late@bolt.example was withdrawn.")).toBeVisible();
  const third = await browser.newContext();
  const late = await third.newPage();
  await late.goto(withdrawn);
  await expect(late.getByRole("heading", { name: "This link does not work any more" })).toBeVisible();
  await third.close();
  await bolt.context.close();
});

test("errors from the engine are shown with a way to retry", async () => {
  await page.goto("/dashboard/campaigns/No%20such%20campaign");
  await expect(alertWith("This could not be loaded")).toContainText("not found");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  // A response of the wrong shape is refused rather than half-rendered.
  await page.route("**/api/backend/campaigns", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "x" }]) }));
  await page.goto("/dashboard/campaigns");
  await expect(alertWith("data this page does not understand")).toBeVisible();
  await page.unroute("**/api/backend/campaigns");

  await page.route("**/api/backend/campaigns", (route) => route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ detail: "The calling engine could not be reached." }) }));
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(alertWith("The calling engine could not be reached.")).toBeVisible();
  await page.unroute("**/api/backend/campaigns");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId("campaign-grid").getByRole("link", { name: ACCOUNTING })).toBeVisible();
});

test("phones get their own navigation and layouts, with nothing scrolling sideways", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 760 }, hasTouch: true, isMobile: true, storageState: await page.context().storageState() });
  const phone = await context.newPage();
  const fits = () => phone.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

  await phone.goto("/dashboard");
  await expect(phone.getByTestId("tile-calls")).toContainText("154");
  expect(await fits()).toBe(true);
  // The rail is replaced by a tab bar within thumb reach.
  const tabs = phone.getByRole("navigation", { name: "Primary" });
  await tabs.getByRole("link", { name: "Campaigns" }).click();
  await expect(phone.getByRole("heading", { name: "Campaigns", level: 1 })).toBeVisible();
  expect(await fits()).toBe(true);

  // Lists are compact rows, not a squeezed table; a lead opens as a sheet from the bottom.
  await phone.getByRole("list", { name: "Campaigns" }).getByRole("button", { name: new RegExp(ACCOUNTING) }).click();
  await phone.getByRole("navigation", { name: "Campaign sections" }).getByRole("link", { name: "Leads" }).click();
  await phone.getByRole("list", { name: "Leads" }).getByRole("button", { name: /Maria Okafor/ }).click();
  await expect(phone.getByRole("dialog", { name: "Lead details" })).toContainText("Recommended next action");
  expect(await fits()).toBe(true);
  await phone.getByRole("dialog", { name: "Lead details" }).getByRole("button", { name: "Close" }).click();

  for (const section of ["Calls", "Knowledge", "Coach & playbook", "A/B tests", "Settings"]) {
    await phone.getByRole("navigation", { name: "Campaign sections" }).getByRole("link", { name: section }).click();
    await phone.waitForLoadState("networkidle");
    expect(await fits(), `${section} fits a phone`).toBe(true);
  }
  for (const path of ["/dashboard/setup", "/dashboard/requests", "/dashboard/team", "/dashboard/account", "/dashboard/campaigns/new"]) {
    await phone.goto(path);
    await phone.waitForLoadState("networkidle");
    expect(await fits(), `${path} fits a phone`).toBe(true);
  }
  await phone.goto(`/dashboard/campaigns/${encodeURIComponent(ACCOUNTING)}/settings`);
  await phone.getByRole("link", { name: "Back to Accounting firms Q4" }).click(); // the phone's way back
  await expect(phone.getByTestId("pause-reason")).toBeVisible();
  await context.close();
});

test("the console can be switched to a dark theme, and the choice is remembered", async () => {
  const canvas = () => page.evaluate(() => getComputedStyle(document.querySelector(".app")!).backgroundColor);
  await page.goto("/dashboard");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light"); // light unless chosen otherwise
  expect(await canvas()).toBe("rgb(255, 255, 255)");

  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await canvas()).toBe("rgb(6, 18, 43)"); // deep navy
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".app h1")!).color)).toBe("rgb(255, 255, 255)");

  await page.reload(); // applied before the page paints, not after it loads
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("tile-calls")).toContainText("154");
  expect(await canvas()).toBe("rgb(6, 18, 43)");

  await page.getByRole("button", { name: "Account" }).click();
  await expect(page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await canvas()).toBe("rgb(255, 255, 255)");
});

test("signing out closes the console again", async () => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  expect((await page.request.get("/api/backend/campaigns")).status()).toBe(401);
});
