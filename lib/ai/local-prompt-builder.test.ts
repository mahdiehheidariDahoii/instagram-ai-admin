import { expect, test } from "vitest";
import { buildLocalImagePrompt } from "./local-prompt-builder";

test("builds a local product prompt that preserves a reference image and Persian info layout", () => {
  const prompt = buildLocalImagePrompt({
    contentType: "product",
    topic: "بازی کاتان",
    goal: "معرفی بازی",
    extra: "یکی از بازی‌های کافه من است",
    hasReferenceImage: true,
  });

  expect(prompt).toContain("بازی کاتان");
  expect(prompt).toContain("source of truth");
  expect(prompt).toContain("Persian right-to-left information layer");
  expect(prompt).toContain("Do not invent factual");
});

test("builds an event prompt without requiring an external AI", () => {
  const prompt = buildLocalImagePrompt({
    contentType: "event",
    topic: "ایونت مافیا",
    goal: "معرفی ایونت",
    extra: "فضای مرموز و سینمایی",
    hasReferenceImage: false,
  });

  expect(prompt).toContain("ایونت مافیا");
  expect(prompt).toContain("event / concept");
  expect(prompt).toContain("written brief");
});
