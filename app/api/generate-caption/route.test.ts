import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/ai/text-provider", () => {
  return {
    generateText: vi.fn().mockResolvedValue(
      "این یک کپشن تستی برای اینستاگرام است."
    ),
  };
});

import { POST } from "./route";

describe("POST /api/generate-caption", () => {
  test("returns generated caption", async () => {
    const request = new Request(
      "http://localhost:3000/api/generate-caption",
      {
        method: "POST",
        body: JSON.stringify({
          business: "مجموعه سنگ احمدی",
          audience: "معماران",
          topic: "سنگ اسلب اونیکس",
          style: "لوکس",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.caption).toBe(
      "این یک کپشن تستی برای اینستاگرام است."
    );
  });
});