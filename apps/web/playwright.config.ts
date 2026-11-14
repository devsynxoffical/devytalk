import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests of the dashboard against a REAL calling engine with test fixture data.
 *
 *   ENGINE_DIR=/path/to/aicallingagent npm run test:e2e
 *
 * With ENGINE_DIR set, this starts the engine on a new, empty SQLite database, fills it
 * with the engine repository's test fixtures (tests/seed_dashboard.py) and stops it
 * afterwards. Without it, start a seeded engine yourself and pass DEVYTALK_API_URL and
 * E2E_API_TOKEN. The tests change data (they approve and reject versions), so each run
 * needs a freshly seeded database. Never point them at a real one.
 */
const engineDir = process.env.ENGINE_DIR;
const enginePort = Number(process.env.ENGINE_PORT ?? 8010);
const webPort = Number(process.env.E2E_PORT ?? 3210);
const token = process.env.E2E_API_TOKEN ?? "e2e-test-token";
// What the website uses to hand form submissions to the engine. A test value, like the token above.
const intakeToken = process.env.E2E_INTAKE_TOKEN ?? "e2e-intake-token";
const engineUrl = process.env.DEVYTALK_API_URL ?? `http://127.0.0.1:${enginePort}`;
process.env.E2E_API_TOKEN = token;

const servers = [];
if (engineDir) {
  const work = mkdtempSync(join(tmpdir(), "devytalk-e2e-"));
  const python = process.env.ENGINE_PYTHON ?? join(engineDir, ".venv", "bin", "python");
  servers.push({
    command: `${python} tests/seed_dashboard.py && ${python} -m uvicorn callagent.server:app --port ${enginePort}`,
    cwd: engineDir,
    url: `http://127.0.0.1:${enginePort}/health`,
    timeout: 120_000,
    reuseExistingServer: false,
    // No provider keys: the engine cannot place a call or reach an AI model during these tests.
    env: { DATABASE_URL: `sqlite:///${join(work, "e2e.db")}`, DATA_DIR: join(work, "data"), API_TOKEN: token, ANTHROPIC_API_KEY: "", INTAKE_TOKEN: intakeToken },
  });
}
servers.push({
  command: `npm run build && npm run start -- -p ${webPort}`,
  url: `http://127.0.0.1:${webPort}/login`,
  timeout: 300_000,
  reuseExistingServer: false,
  env: { DEVYTALK_API_URL: engineUrl, DEVYTALK_INTAKE_TOKEN: intakeToken, LEADS_DIR: join(tmpdir(), "devytalk-e2e-leads") },
});

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${webPort}`, trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: servers,
});
