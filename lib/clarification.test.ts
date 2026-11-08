import { describe, expect, it } from "vitest";
import { emptyProfile } from "./business-profile";
import { createContentBrief } from "./content-planning";
import { decisionReady, fingerprint, questionsFor, unresolved } from "./clarification";

const profile = { ...emptyProfile, businessType: "فروش عطر", description: "فروشگاه عطر زنانه", products: "عطر" };
const brief = createContentBrief(profile);
describe("clarification safety", () => {
  it("does not treat delegated inventory as confirmed", () => {
    const questions = questionsFor(profile, brief);
    const inventory = questions.find(q => q.id === "availability")!;
    expect(decisionReady(inventory, {mode:"delegate", value:""})).toBe(false);
    expect(decisionReady(inventory, {mode:"provided", value:"موجودی تأیید نشده"})).toBe(true);
    expect(unresolved(questions, {availability:{mode:"delegate",value:""}}).some(q=>q.id==="availability")).toBe(true);
  });
  it("keeps answers after AI revises topic but invalidates on business change", () => {
    expect(fingerprint(profile, brief)).toBe(fingerprint(profile, {...brief,topic:"موضوع جدید"}));
    expect(fingerprint(profile, brief)).not.toBe(fingerprint({...profile,businessType:"کافه"}, brief));
  });
});
