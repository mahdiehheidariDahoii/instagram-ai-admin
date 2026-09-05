type BuildImagePromptInput = {
  business: string;
  audience: string;
  style: string;
  topic: string;
  extra: string;
};

export function buildImagePrompt(input: BuildImagePromptInput) {
  return `
Create a high-quality Instagram post image.

Business type: ${input.business}
Target audience: ${input.audience}
Page style: ${input.style}
Post topic: ${input.topic}
Additional notes: ${input.extra}

Requirements:
- The image must be visually appealing and suitable for Instagram.
- The style should match the page identity.
- The image should be professional and high quality.
- Do not add any text inside the image unless explicitly requested.
`.trim();
}