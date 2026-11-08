import { expect, test } from "vitest";
import { buildImagePrompt } from "./prompt-builder";

test("uses image-relevant information and omits target audience", () => {
  const prompt = buildImagePrompt({
    business: "فروش دستگاه CNC سنگ",
    audience: "صاحبان سنگبری",
    style: "حرفه‌ای و صنعتی",
    topic: "دستگاه CNC پنج محور",
    extra: "واقع‌گرایانه و بدون نوشته",
  });

  expect(prompt).toContain("دستگاه CNC پنج محور");
  expect(prompt).toContain("حرفه‌ای و صنعتی");
  expect(prompt).toContain("واقع‌گرایانه و بدون نوشته");

  expect(prompt).not.toContain("صاحبان سنگبری");
});

test("creates a compact structured image prompt", () => {
  const prompt = buildImagePrompt({
    business: "فروش دستگاه CNC سنگ",
    audience: "صاحبان سنگبری",
    style: "حرفه‌ای و صنعتی",
    topic: "دستگاه CNC پنج محور",
    extra: "واقع‌گرایانه و بدون نوشته",
  });

  expect(prompt).toContain("Subject:");
  expect(prompt).toContain("Context:");
  expect(prompt).toContain("Style:");
  expect(prompt).toContain("Composition:");
  expect(prompt).toContain("Lighting:");
  expect(prompt).toContain("Avoid:");
});

test("prints mafia image prompt locally", () => {
  const prompt = buildImagePrompt({
    business: "برگزاری ایونت",
    audience: "جوانان",
    style: "مرموز و سینمایی",
    topic: "ایونت مافیا",
    extra: "فضای تاریک، چند نفر دور میز، بدون نوشته",
  });

  console.log("\n=== MAFIA IMAGE PROMPT ===\n");
  console.log(prompt);
  console.log("\n==========================\n");
});
