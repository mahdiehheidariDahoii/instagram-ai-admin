import { buildCaptionPrompt } from "@/lib/ai/caption-builder";
import { generateText } from "@/lib/ai/text-provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = buildCaptionPrompt({
      business: body.business,
      audience: body.audience,
      topic: body.topic,
      style: body.style,
      extra: body.extra,
    });

    const caption = await generateText(prompt);

    return Response.json({
      success: true,
      caption,
    });
  } catch (error) {
    console.error("CAPTION API ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}