import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOSSARY, GUIDES, QUESTIONS, SERVICES, TERMS, searchHelp } from "./console-help";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("the console's help", () => {
  it("gives every word, guide and question its own address", () => {
    const ids = [...GLOSSARY.map((t) => t.id), ...GUIDES.map((g) => g.id), ...QUESTIONS.map((q) => q.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z-]*$/);
  });

  it("explains every word a screen puts a question mark beside", () => {
    const root = join(__dirname, "..");
    const used = new Set<string>();
    for (const file of [...sources(join(root, "app", "dashboard")), ...sources(join(root, "components", "dashboard"))]) {
      const text = readFileSync(file, "utf8");
      // hint="x" on a header, panel or figure; hint: "x" on a table column; <Hint term="x">
      for (const match of text.matchAll(/(?:\bhint[=:]\s?|<Hint term=)"([a-z-]+)"/g)) used.add(match[1]);
    }
    expect(used.size).toBeGreaterThan(10);
    expect([...used].filter((id) => !TERMS[id])).toEqual([]);
  });

  it("keeps a hint short enough to read at a glance", () => {
    for (const term of GLOSSARY) expect(term.short.length, term.id).toBeLessThanOrEqual(190);
  });

  it("describes the five services the engine reports", () => {
    expect(Object.keys(SERVICES).sort()).toEqual(["model", "public_url", "stt", "telephony", "tts"]);
  });

  it("finds words, guides and questions by any words in them", () => {
    const found = searchHelp("  Paused  ITSELF ");
    expect(found.terms.map((t) => t.id)).toEqual(["paused-itself"]);
    expect(found.questions.map((q) => q.id)).toContain("no-calls");
    expect(found.guides).toEqual([]);
    expect(searchHelp("").terms).toHaveLength(GLOSSARY.length);
    expect(searchHelp("zzzz")).toEqual({ terms: [], guides: [], questions: [] });
  });
});
