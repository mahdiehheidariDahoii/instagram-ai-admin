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

  test("asks for one concise publish-ready caption without fabricated facts", () => {
    const prompt = buildCaptionPrompt({
      business: "مجموعه سنگ احمدی",
      audience: "معماران",
      topic: "اسلب اونیکس",
      style: "لوکس و حرفه‌ای",
    });

    expect(prompt).toContain("ONE final Instagram caption");
    expect(prompt).toContain("Return only the caption");
    expect(prompt).toContain("Do not provide alternatives");
    expect(prompt).toContain("Do not invent facts");
    expect(prompt).toContain("Maximum 120 Persian words");
  });
});