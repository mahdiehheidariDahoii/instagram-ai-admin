export type LocalPromptInput = {
  contentType: "product" | "service" | "event";
  topic: string;
  goal: string;
  extra: string;
  hasReferenceImage: boolean;
};

function getGoalDirection(goal: string) {
  if (goal.includes("فروش")) {
    return "commercial product promotion designed to support a purchase decision";
  }

  if (goal.includes("معرفی")) {
    return "clear, informative introduction that helps the audience understand the subject";
  }

  return goal.trim()
    ? `the stated post goal: ${goal}`
    : "a clear and useful Instagram presentation";
}

function getContentDirection(contentType: LocalPromptInput["contentType"]) {
  if (contentType === "service") {
    return "Translate the service into visible actions, environment, tools, process, and outcome without inventing claims.";
  }

  if (contentType === "event") {
    return "Treat this as an event / concept post. Build the scene from the written brief and make the event concept visually explicit.";
  }

  return "Keep the product as the clear main subject and build the scene around it.";
}

export function buildLocalImagePrompt(input: LocalPromptInput) {
  const referenceDirection = input.hasReferenceImage
    ? "Use the provided reference image as the source of truth. Preserve the real subject identity, proportions, visible branding, packaging, colors, and recognizable details. Do not redesign or replace it."
    : "No reference image is available. Build the scene from the written brief without inventing factual product or business details.";

  const informationLayer = `Because this is for a Persian-language business, decide whether an information layer is useful for the stated goal. When useful, reserve clean negative space for a Persian right-to-left information layer. Use only the supplied subject, goal, and extra details for factual copy. Do not invent statistics, specifications, prices, discounts, dates, times, authenticity claims, ingredients, origin, performance claims, or other unsupported facts.`;

  return `
Create an Instagram-ready visual for a Persian-language business.

Subject / topic: ${input.topic || "Not provided"}
Post goal: ${input.goal || "Not provided"}
Extra details: ${input.extra || "None"}

Creative objective: ${getGoalDirection(input.goal)}.
${getContentDirection(input.contentType)}
${referenceDirection}

Make confident visual decisions about composition, background, camera angle, lighting, mood, depth, and supporting elements when they do not create false factual claims. Keep the main subject visually dominant, the composition polished and commercially useful, and the result suitable for Instagram.

${informationLayer}

Do not invent factual information that was not supplied. Avoid watermark, clutter, duplicated objects, distorted geometry, altered branding, misleading details, unrelated elements, and invented factual information.
`.trim();
}
