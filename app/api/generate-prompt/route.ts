import { buildPromptInterpreterPrompt } from "@/lib/ai/prompt-interpreter-builder";
import { generateText } from "@/lib/ai/text-provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const interpreterPrompt = buildPromptInterpreterPrompt({
      contentType: body.contentType,
      topic: body.topic,
      goal: body.goal,
      extra: body.extra,
      hasReferenceImage: body.hasReferenceImage,
    });

    const prompt = await generateText(interpreterPrompt);

    return Response.json({
      success: true,
      prompt,
    });
  } catch (error) {
    console.error("PROMPT ROUTE ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
