type BuildImagePromptInput = {
  business: string;
  audience: string;
  style: string;
  topic: string;
  extra: string;
};

export function buildImagePrompt(input: BuildImagePromptInput) {
  return `
Subject: ${input.topic}
Context: ${input.business}
Style: ${input.style}
Composition: clear main subject, balanced Instagram-ready composition
Lighting: professional lighting appropriate to the visual style
Details: ${input.extra}
Avoid: text, watermark, clutter, distorted geometry, duplicated objects
`.trim();
}