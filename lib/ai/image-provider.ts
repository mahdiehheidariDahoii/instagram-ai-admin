import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GAPGPT_API_KEY,
  baseURL: process.env.GAPGPT_BASE_URL || "https://api.gapgpt.app/v1",
});

export async function generateInstagramImage(prompt: string) {
  const model = process.env.GAPGPT_IMAGE_MODEL;

  if (!model) {
    throw new Error("GAPGPT_IMAGE_MODEL is not set in .env.local");
  }

  const result = await client.images.generate({
    model,
    prompt,
    size: "1024x1024",
    quality: "high",
    output_format: "png",
  });

  const firstImage = result.data?.[0] as
    | {
        url?: string;
        b64_json?: string;
        media_type?: string;
      }
    | undefined;

  const imageUrl = firstImage?.url;
  const imageBase64 = firstImage?.b64_json;
  const mediaType = firstImage?.media_type || "image/png";

  if (!imageUrl && !imageBase64) {
    console.error("RAW IMAGE RESPONSE:", result);
    throw new Error("No image data was returned from GapGPT.");
  }

  return {
    imageUrl: imageUrl ?? null,
    imageBase64: imageBase64 ?? null,
    mediaType,
  };
}