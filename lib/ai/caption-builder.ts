type CaptionInput = {
  business: string;
  audience: string;
  topic: string;
  style?: string;
  extra?: string;
};

export function buildCaptionPrompt(input: CaptionInput) {
  return `
You are an expert Instagram content strategist.

Create a professional Instagram caption.

Business:
${input.business}

Target audience:
${input.audience}

Post topic:
${input.topic}

Brand style:
${input.style || "professional"}

Additional notes:
${input.extra || "none"}

Requirements:
- Write in Persian.
- Make it engaging and suitable for Instagram.
- Do not use fake claims.
- Include a clear call to action when appropriate.
`;
}