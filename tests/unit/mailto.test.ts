import { describe, expect, it } from "vitest";
import { isEmail, mailtoHref } from "@/lib/mailto";

describe("front-end-only email forms", () => {
  it("builds a mailto link with an encoded subject and body", () => {
    const href = mailtoHref("hello@example.com", "Trip planning: Luxor & Aswan", [
      ["Name", "Ana"],
      ["Message", "Is December busy?\nThanks"],
    ]);
    expect(href.startsWith("mailto:hello@example.com?subject=")).toBe(true);
    const url = new URL(href);
    expect(url.searchParams.get("subject")).toBe("Trip planning: Luxor & Aswan");
    expect(url.searchParams.get("body")).toBe("Name: Ana\n\nMessage:\nIs December busy?\nThanks");
  });

  it("leaves out empty fields and trims values", () => {
    const body = new URL(mailtoHref("a@b.co", "x", [["Name", "  Ana "], ["Country", ""], ["Where", null]])).searchParams.get("body");
    expect(body).toBe("Name: Ana");
  });

  it("refuses a bad address so a form never opens a broken email", () => {
    expect(() => mailtoHref("not an email", "x", [])).toThrow();
    expect(() => mailtoHref("a@b.co?cc=evil@x.com", "x", [])).toThrow();
    expect(isEmail("hello@example.com")).toBe(true);
    expect(isEmail("hello@example")).toBe(false);
  });
});
