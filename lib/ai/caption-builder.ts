type CaptionInput = {
  business: string;
  audience: string;
  topic: string;
  style?: string;
  extra?: string;
};

export function buildCaptionPrompt(input: CaptionInput) {
  return `
Create ONE final Instagram caption in Persian.

Business: ${input.business}
Audience: ${input.audience}
Topic: ${input.topic}
Tone: ${input.style || "professional"}
Extra instructions: ${input.extra || "none"}

Requirements:
- Return only the caption.
- Do not provide alternatives.
- Do not explain your reasoning.
- Do not add strategy notes.
- Do not invent facts, services, guarantees, prices, addresses, phone numbers, or claims not provided in the input.
- Maximum 120 Persian words.
- Keep the caption natural, engaging, and ready to publish.
- Include a simple call to action only when appropriate.
`.trim();
}