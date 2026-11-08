export async function generateInstagramImage(prompt: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const model =
    process.env.CLOUDFLARE_IMAGE_MODEL ||
    "@cf/black-forest-labs/flux-1-schnell";

  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is not set in .env.local");
  }

  if (!apiToken) {
    throw new Error("CLOUDFLARE_API_TOKEN is not set in .env.local");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || result.success === false) {
    console.error("CLOUDFLARE IMAGE ERROR:", result);

    throw new Error(
      result?.errors?.[0]?.message ||
        result?.result?.error ||
        "Cloudflare image generation failed."
    );
  }

  const imageBase64 = result?.result?.image;

  if (!imageBase64) {
    console.error("RAW CLOUDFLARE IMAGE RESPONSE:", result);
    throw new Error("No base64 image was returned from Cloudflare.");
  }

  return {
    imageUrl: null,
    imageBase64,
    mediaType: "image/jpeg",
  };
}