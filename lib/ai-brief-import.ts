import type { ContentBrief } from "./content-planning";

export function parseAiBrief(raw: string): ContentBrief {
  const clean = raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "");
  const data: unknown = JSON.parse(clean);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("پاسخ باید یک شیء JSON باشد.");
  const item = data as Record<string, unknown>;
  const required = ["objective", "audience", "topic", "message", "callToAction"];
  if (required.some(key => typeof item[key] !== "string" || !(item[key] as string).trim())) throw new Error("برخی فیلدهای اصلی خالی یا نامعتبرند.");
  if (!["single-image", "carousel", "reel"].includes(String(item.format))) throw new Error("قالب محتوا معتبر نیست.");
  if (!Array.isArray(item.rationale) || item.rationale.length === 0 || item.rationale.some(x => typeof x !== "string")) throw new Error("دلیل انتخاب باید آرایه‌ای از متن باشد.");
  if (!Array.isArray(item.assumptions) || item.assumptions.some(x => typeof x !== "string")) throw new Error("فرضیات باید آرایه‌ای از متن باشد.");
  return {
    version: 1, status: "draft",
    objective: item.objective as string, audience: item.audience as string,
    topic: item.topic as string, format: item.format as ContentBrief["format"],
    message: item.message as string, callToAction: item.callToAction as string,
    rationale: item.rationale as string[], assumptions: item.assumptions as string[],
  };
}
