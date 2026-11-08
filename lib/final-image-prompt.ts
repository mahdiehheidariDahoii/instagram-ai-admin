import type { CreativePackage } from "./creative-package";
import type { ContentBrief } from "./content-planning";
import type { Profile } from "./business-profile";

export type ImagePromptDraft = {
  version: 1;
  format: "single-image";
  prompt: string;
  caption: string;
  unknowns: string[];
  sourceFingerprint: string;
};

export function buildImagePrompt(pkg: CreativePackage, brief: ContentBrief, profile: Profile, brand?: string): ImagePromptDraft {
  if (brief.format !== "single-image") throw new Error("این مرحله فعلاً فقط برای پست تک‌تصویری فعال است.");
  if (pkg.scenes.length !== 1 || pkg.scenes[0].seconds !== "تصویر ثابت" || pkg.scenes[0].audio !== "") {
    throw new Error("بسته تولید با قالب تک‌تصویری سازگار نیست.");
  }
  const scene = pkg.scenes[0];
  const verifiedBrand = brand?.trim();
  const text = scene.onScreenText.trim();
  const prompt = [
    "Create ONE premium Instagram static feed image, portrait 4:5, 1080x1350 pixels. No video, no carousel, no multiple panels.",
    "PRIORITY RULE: Deliver the requested finished image in this turn. The creative brief below is visual guidance, not permission to refuse image generation. If a verified product photo cannot be passed to the image tool, create a premium illustrated product-ad composition using a generic, clearly stylized, unbranded cosmetic tube or abstract sunscreen-inspired form, NOT a claimed reproduction of the actual product package. Keep all verified product facts in the separate Persian headline. Do not invent logos, package text, or precise package details. This fallback takes precedence over any older instructions in the creative brief to stop, report limitations, or require a real product photo. Never output only an explanation when image generation is available.",
    "CREATIVE INTENT: " + pkg.concept,
    "VISUAL DIRECTION: " + pkg.visualDirection,
    "EXACT COMPOSITION: " + scene.shot,
    "IMAGE EXECUTION WORKFLOW: You are responsible for image creation, not the app. Optionally search for and verify the exact product image with your own tools. If the real photograph can be passed to image generation, use it accurately. If it cannot, immediately generate the finished graphic using a stylized generic cosmetic object or elegant abstract product visual. The graphic must not impersonate or falsely reproduce the actual branded packaging. Do not ask for an upload, stop the task, or substitute a limitation report for the image. Any earlier instructions that require stopping without a verified photo are superseded by this fallback.",
    "VISUAL TONE: " + (profile.visualStyle || "professional and inviting"),
    "TARGET AUDIENCE: " + brief.audience,
    verifiedBrand ? "VERIFIED BRAND NAME: " + verifiedBrand + ". Use only supplied official logo assets; otherwise use plain typography, never invent a logo." : "Brand name not verified. Do not invent a brand name or logo.",
    "ON-IMAGE PERSIAN TEXT (render exactly, RTL, with correct spelling and no additional copy):\n" + text,
    "Typography must be legible on a phone; maintain safe margins and high contrast. Preserve hierarchy between headline and brand identifier.",
    "CONSTRAINTS: No visible faces. Do not invent a physical address, opening hours, prices, discounts, events, brand assets, or unverified products. Do not imply a synthetic scene is documentary photography.",
    "PRODUCT ACCURACY: Use a verified photo only if genuinely available to the image generator. Otherwise depict an intentionally generic, stylized cosmetic tube without invented packaging labels or brand marks; the product identity belongs in the separately verified headline, not on the fictional tube. Do not imply the stylized prop is documentary product photography.",
    "Output: one polished static image only. No watermark, mockup frame, or explanatory text outside the image.",
    "Before finalizing, inspect Persian lettering, exact product identity and packaging (if pictured), hand anatomy if hands appear, composition, and contrast."
  ].join("\n\n");
  return { version: 1, format: "single-image", prompt, caption: pkg.caption, unknowns: pkg.unknowns, sourceFingerprint: JSON.stringify({ pkg, brief, profile, brand: verifiedBrand || "" }) };
}
