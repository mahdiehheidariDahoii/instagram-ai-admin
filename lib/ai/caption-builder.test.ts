import { describe, expect, test } from "vitest";
import { buildCaptionPrompt } from "./caption-builder";

describe("buildCaptionPrompt", () => {
  test("includes business information in prompt", () => {
    const prompt = buildCaptionPrompt({
      business: "فروش دستگاه CNC",
      audience: "سنگبری ها",
      topic: "دستگاه پنج محور",
      style: "حرفه‌ای",
    });

    expect(prompt).toContain("فروش دستگاه CNC");
    expect(prompt).toContain("سنگبری ها");
    expect(prompt).toContain("دستگاه پنج محور");
  });
});