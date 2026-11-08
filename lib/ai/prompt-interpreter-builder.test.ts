import { expect, test } from "vitest";
import { buildPromptInterpreterPrompt } from "./prompt-interpreter-builder";

test("instructs product prompts with a reference image to preserve the real product", () => {
  const prompt = buildPromptInterpreterPrompt({
    contentType: "product",
    topic: "عطر ورساچه برایت کریستال",
    goal: "فروش محصول",
    extra: "یکی از محصولات فروشگاه است",
    hasReferenceImage: true,
  });

  expect(prompt).toContain("reference image");
  expect(prompt).toContain("source of truth");
  expect(prompt).toContain("Do not invent factual product information");
  expect(prompt).toContain("Persian");
  expect(prompt).toContain("right-to-left");
});
