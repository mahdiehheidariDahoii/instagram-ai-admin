import { buildImagePrompt } from "../../../lib/ai/prompt-builder";
import { generateInstagramImage } from "../../../lib/ai/image-provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = buildImagePrompt({
      business: body.business,
      audience: body.audience,
      style: body.style,
      topic: body.topic,
      extra: body.extra,
    });

    const imageResult = await generateInstagramImage(prompt);

    return Response.json({
      success: true,
      prompt,
      imageUrl: imageResult.imageUrl,
      imageBase64: imageResult.imageBase64,
      mediaType: imageResult.mediaType,
    });
  } catch (error) {
    console.error("IMAGE ROUTE ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}