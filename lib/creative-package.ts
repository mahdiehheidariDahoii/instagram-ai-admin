export type CreativePackage = {
  version: 1;
  title: string;
  concept: string;
  visualDirection: string;
  scenes: { seconds: string; shot: string; onScreenText: string; audio: string }[];
  caption: string;
  callToAction: string;
  productionNotes: string[];
  unknowns: string[];
  status: "draft";
};

export function parseCreativePackage(raw: string): CreativePackage {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const data: unknown = JSON.parse(cleaned);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("خروجی باید یک شیء JSON باشد.");
  const v = data as Record<string, unknown>;
  for (const field of ["title", "concept", "visualDirection", "caption", "callToAction"]) {
    if (typeof v[field] !== "string" || !(v[field] as string).trim()) throw new Error("فیلد ضروری نامعتبر: " + field);
  }
  if (!Array.isArray(v.scenes) || !v.scenes.length || v.scenes.some(s => !s || typeof s !== "object" || ["seconds", "shot", "onScreenText", "audio"].some(k => typeof s[k] !== "string"))) throw new Error("فهرست نماها معتبر نیست.");
  for (const field of ["productionNotes", "unknowns"]) {
    if (!Array.isArray(v[field]) || (v[field] as unknown[]).some(x => typeof x !== "string")) throw new Error("فیلد نامعتبر: " + field);
  }
  return { version: 1, status: "draft", title: v.title as string, concept: v.concept as string, visualDirection: v.visualDirection as string, scenes: v.scenes as CreativePackage["scenes"], caption: v.caption as string, callToAction: v.callToAction as string, productionNotes: v.productionNotes as string[], unknowns: v.unknowns as string[] };
}
