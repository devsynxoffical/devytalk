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
  await expect(page.getByText("No calls yet", { exact: true })).toBeVisible();
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
  await phone.getByRole("link", { name: "Back to Accounting firms Q4" }).click(); // the phone's way back
  await expect(phone.getByTestId("pause-reason")).toBeVisible();
  await context.close();
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
