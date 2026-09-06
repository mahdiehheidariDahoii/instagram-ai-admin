import { describe, expect, test, vi } from "vitest";

const generateContentMock = vi.fn().mockResolvedValue({
  text: "یک کپشن تستی",
});

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: generateContentMock,
      };
    },
  };
});

import { generateText } from "./text-provider";

describe("generateText", () => {
  test("returns generated text from Gemini provider", async () => {
    const result = await generateText("یک پرامپت تستی");

    expect(result).toBe("یک کپشن تستی");
    expect(generateContentMock).toHaveBeenCalled();
  });
});