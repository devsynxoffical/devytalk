import { describe, expect, it } from "vitest";
import { buildBrief, type BriefForm } from "./page";

const form: BriefForm = { name: " Spring outreach ", company: "Northwind", description: "", offer: "A demo.", customer: "", goal: "book_meeting", agent: "Sam", language: "ar", also: ["en", "ar"], reasons: "Fixed price\n\n  Nothing changes for clients  \n", pricing: "", script: "" };

describe("buildBrief", () => {
  it("sends what was entered, trimmed, with reasons as a list and the opening language not repeated", () => {
    expect(buildBrief(form).body).toEqual({
      name: "Spring outreach", company_name: "Northwind", company_description: "", offer_summary: "A demo.", target_customer: "", call_goal: "book_meeting", agent_name: "Sam",
      language: "ar", additional_languages: ["en"], value_props: ["Fixed price", "Nothing changes for clients"], pricing_and_terms: "", script_text: "",
    });
  });

  it("names every required field that is empty and sends nothing", () => {
    const { body, errors } = buildBrief({ ...form, name: " ", company: "", offer: " ", agent: "" });
    expect(body).toBeUndefined();
    expect(Object.keys(errors).sort()).toEqual(["agent", "company", "name", "offer"]);
  });

  it("refuses names the console cannot give an address", () => {
    expect(buildBrief({ ...form, name: "New" }).errors.name).toBe("Choose a different name."); // /campaigns/new is this form
    expect(buildBrief({ ...form, name: "Q1/Q2" }).errors.name).toContain("slash");
  });
});
