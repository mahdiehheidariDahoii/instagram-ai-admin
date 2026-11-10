export type QualityReview = {
  version: 1;
  verdict: "pass" | "revise" | "blocked";
  summary: string;
  checks: { criterion: string; status: "pass" | "warning" | "fail"; evidence: string; fix: string }[];
  requiredChanges: string[];
  publicationReadiness: string;
};
export function parseQualityReview(raw: string): QualityReview {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  // ChatGPT's rich-text copy may add NBSP indentation or surrounding prose.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  const cleaned = first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;

  // ChatGPT sometimes inserts unescaped citation placeholders inside JSON strings.
  // Replace only this known UI-specific markup, preserving the reference index.
  const withoutUiCitations = cleaned.replace(
    /:chatgpt-content-reference\{index="(\d+)"\}/g,
    (_match, index: string) => `[منبع ${index}]`
  );
  // Normalize non-standard whitespace from rich-text copy. JSON strings remain readable.
  const normalized = withoutUiCitations.replace(/[\u00a0\u202f\u2007]/g, " ");
  const data: unknown = JSON.parse(normalized);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("پاسخ باید شیء JSON باشد.");
  const d = data as Record<string, unknown>;
  if (!["pass", "revise", "blocked"].includes(String(d.verdict))) throw new Error("نتیجه ارزیابی معتبر نیست.");
  if (typeof d.summary !== "string" || !d.summary.trim() || typeof d.publicationReadiness !== "string" || !d.publicationReadiness.trim()) throw new Error("خلاصه یا وضعیت انتشار خالی است.");
  if (!Array.isArray(d.checks) || !d.checks.length || d.checks.some(c => !c || typeof c !== "object" || !["pass", "warning", "fail"].includes(c.status) || ["criterion", "evidence", "fix"].some(k => typeof c[k] !== "string"))) throw new Error("چک‌لیست ارزیابی نامعتبر است.");
  if (d.summary.trim().toLowerCase() === "checking product references" ||
      (d.checks as QualityReview["checks"]).every(c => !c.evidence.trim())) {
    throw new Error("پاسخ فاقد شواهد واقعی ارزیابی است.");
  }
  if (!Array.isArray(d.requiredChanges) || d.requiredChanges.some(x => typeof x !== "string")) throw new Error("اصلاحات ضروری نامعتبر است.");
  return { version: 1, verdict: d.verdict as QualityReview["verdict"], summary: d.summary, checks: d.checks as QualityReview["checks"], requiredChanges: d.requiredChanges as string[], publicationReadiness: d.publicationReadiness };
}
