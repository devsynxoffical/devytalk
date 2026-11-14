import { describe, expect, it } from "vitest";
import { importSummary } from "../leads/page";
import { uploadProblem } from "./page";

describe("uploadProblem", () => {
  it("accepts the file types the engine reads, whatever the case of the extension", () => {
    for (const name of ["prices.pdf", "Deck.PPTX", "faq.docx", "page.htm", "list.csv", "notes.md", "a.b.txt"]) {
      expect(uploadProblem({ name, size: 10 })).toBeNull();
    }
  });

  it("refuses other types, empty files and files over 25 MB before they are sent", () => {
    expect(uploadProblem({ name: "run.exe", size: 10 })).toContain("not supported");
    expect(uploadProblem({ name: "no-extension", size: 10 })).toContain("not supported");
    expect(uploadProblem({ name: "empty.pdf", size: 0 })).toContain("empty");
    expect(uploadProblem({ name: "big.pdf", size: 25 * 1024 * 1024 + 1 })).toContain("larger than 25 MB");
    expect(uploadProblem({ name: "limit.pdf", size: 25 * 1024 * 1024 })).toBeNull();
  });
});

describe("importSummary", () => {
  const base = { imported: 0, invalid_phone: 0, duplicates: 0, dnc: 0, column_map: {}, samples_invalid: [] };

  it("says what was added and names only the reasons rows were skipped", () => {
    expect(importSummary({ ...base, imported: 1 })).toBe("1 lead added.");
    expect(importSummary({ ...base, imported: 1200, duplicates: 3, dnc: 2 })).toBe("1,200 leads added. Skipped: 3 already in this campaign, 2 on the do-not-call list.");
    expect(importSummary({ ...base, invalid_phone: 4 })).toBe("0 leads added. Skipped: 4 without a usable phone number.");
  });
});
