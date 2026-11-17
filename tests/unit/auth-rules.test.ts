import { describe, expect, it } from "vitest";
import { authErrorMessage, emailProblem, PASSWORD_MIN, passwordProblem, safeNext, SENT } from "@/lib/auth-rules";

describe("passwords", () => {
  it("needs at least 10 characters and accepts a simple phrase", () => {
    expect(PASSWORD_MIN).toBe(10);
    expect(passwordProblem("short")).toMatch(/at least 10/);
    expect(passwordProblem("felucca at sunset")).toBeNull();
  });
  it("refuses repeated characters, common passwords and the email name", () => {
    expect(passwordProblem("aaaaaaaaaaaa")).toMatch(/repeat/);
    expect(passwordProblem("Password123")).toMatch(/common/);
    expect(passwordProblem("maya.jensen-2026", "maya.jensen@example.com")).toMatch(/email address/);
    expect(passwordProblem("a long safe phrase", "al@example.com")).toBeNull(); // very short names aren't checked
  });
  it("refuses anything bcrypt would cut off (72 bytes), counting non-Latin letters by bytes", () => {
    expect(passwordProblem("x".repeat(72))).toMatch(/repeat/);
    expect(passwordProblem("ab".repeat(37))).toMatch(/too long/);
    expect(passwordProblem("مصر".repeat(5))).toBeNull(); // 30 bytes
    expect(passwordProblem("مصر".repeat(13))).toMatch(/too long/); // 78 bytes
  });
});

describe("email addresses", () => {
  it("needs a plausible address", () => {
    expect(emailProblem("")).toMatch(/Enter your email/);
    expect(emailProblem("maya")).toMatch(/valid email/);
    expect(emailProblem("maya@example")).toMatch(/valid email/);
    expect(emailProblem(" maya@example.com ")).toBeNull();
  });
});

describe("messages", () => {
  it("never says whether an address has an account", () => {
    for (const m of Object.values(SENT)) expect(m).not.toMatch(/not found|no account|doesn't exist|already/i);
    expect(SENT.reset).toMatch(/^If that address has an account/);
  });
  it("turns Supabase errors into plain words", () => {
    expect(authErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toMatch(/don't match/);
    expect(authErrorMessage({ message: "Email not confirmed" })).toMatch(/confirm your email/);
    expect(authErrorMessage({ status: 429, message: "x" })).toMatch(/Too many attempts/);
    expect(authErrorMessage({ code: "weak_password", message: "Password should be at least 6 characters" })).toMatch(/stronger/);
    expect(authErrorMessage({ code: "same_password", message: "New password should be different" })).toMatch(/haven't used/);
    expect(authErrorMessage({ message: "Auth session missing!" })).toMatch(/expired/);
    expect(authErrorMessage({ message: "something odd" })).toBe("Something went wrong. Please try again.");
    expect(authErrorMessage(null)).toBe("");
  });
});

describe("where to go after signing in", () => {
  it("only allows local paths (no open redirect)", () => {
    expect(safeNext("/account/new-password")).toBe("/account/new-password");
    expect(safeNext("//evil.example")).toBe("/account");
    expect(safeNext("https://evil.example")).toBe("/account");
    expect(safeNext("/a?x=1")).toBe("/account");
    expect(safeNext(null)).toBe("/account");
    expect(safeNext(undefined, "/my-egypt")).toBe("/my-egypt");
  });
});
