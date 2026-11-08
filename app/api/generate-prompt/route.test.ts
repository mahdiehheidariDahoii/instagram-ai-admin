import { describe, expect, test, vi } from "vitest";

const { generateTextMock } = vi.hoisted(() => ({
  generateTextMock: vi.fn().mockResolvedValue(
    "Create an Instagram-ready product image."
  ),
}));

vi.mock("@/lib/ai/text-provider", () => ({
  generateText: generateTextMock,
}));

import { POST } from "./route";

describe("POST /api/generate-prompt", () => {
  test("returns the interpreted final image prompt", async () => {
    const request = new Request("http://localhost:3000/api/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: "product",
        topic: "عطر ورساچه برایت کریستال",
        goal: "فروش محصول",
        extra: "یکی از محصولات فروشگاه است",
        hasReferenceImage: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      prompt: "Create an Instagram-ready product image.",
    });
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.stringContaining("عطر ورساچه برایت کریستال")
    );
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.stringContaining("source of truth")
    );
  });
});
