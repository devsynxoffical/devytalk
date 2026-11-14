import { describe, expect, it } from "vitest";
import { passwordProblem } from "@/app/dashboard/team/page";
import { accessOf, initials } from "./access";

const organization = { id: 1, name: "Acme" };
const person = (role: "viewer" | "operator" | "admin", name = "Ada Lovelace") => ({ kind: "user" as const, id: 1, email: "ada.lovelace@example.com", name, role, organization, platform: false });
const operator = { kind: "token" as const, id: null, email: "", name: "API token", role: "admin" as const, organization, platform: true };

describe("accessOf", () => {
  it("offers nothing that changes anything until the person is known", () => {
    expect(accessOf(null)).toMatchObject({ canOperate: false, isAdmin: false });
  });

  it("gives each role what it is for", () => {
    expect(accessOf(person("viewer"))).toMatchObject({ canOperate: false, isAdmin: false });
    expect(accessOf(person("operator"))).toMatchObject({ canOperate: true, isAdmin: false });
    expect(accessOf(person("admin"))).toMatchObject({ canOperate: true, isAdmin: true });
    expect(accessOf(operator)).toMatchObject({ canOperate: true, isAdmin: true });
  });
});

describe("initials", () => {
  it("uses the name, then the email, and marks the access token", () => {
    expect(initials(person("viewer"))).toBe("AL");
    expect(initials(person("viewer", ""))).toBe("AL"); // from ada.lovelace@
    expect(initials(person("viewer", "Cher"))).toBe("C");
    expect(initials(operator)).toBe("API");
    expect(initials(null)).toBe("");
  });
});

describe("passwordProblem", () => {
  it("refuses short, blank and email-equal passwords, like the engine does", () => {
    expect(passwordProblem("short")).toContain("at least 10");
    expect(passwordProblem(" ".repeat(12))).toContain("only spaces");
    expect(passwordProblem("Ada@Example.com ", "ada@example.com")).toContain("email address");
    expect(passwordProblem("a long enough one", "ada@example.com")).toBeNull();
  });
});
