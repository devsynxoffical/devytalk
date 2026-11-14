import { describe, expect, it } from "vitest";
import { inviteProblem } from "@/components/interactive/InviteForm";
import { inviteLink } from "./Invitations";

describe("invitation links", () => {
  it("are addresses of this console, whatever it is served from", () => {
    expect(inviteLink("https://app.example.com", "dti_abc")).toBe("https://app.example.com/invite/dti_abc");
    expect(inviteLink("http://localhost:3000/", "dti_abc")).toBe("http://localhost:3000/invite/dti_abc");
  });

  it("refuse a password the engine would refuse, and one that was mistyped", () => {
    expect(inviteProblem("short", "short", "nia@bolt.example")).toMatch(/at least 10/);
    expect(inviteProblem("          ", "          ", "nia@bolt.example")).toMatch(/only spaces/);
    expect(inviteProblem("Nia@Bolt.example", "Nia@Bolt.example", "nia@bolt.example")).toMatch(/email address/);
    expect(inviteProblem("a long enough password", "a long enough passwrd", "nia@bolt.example")).toMatch(/not the same/);
    expect(inviteProblem("a long enough password", "a long enough password", "nia@bolt.example")).toBeNull();
  });
});
