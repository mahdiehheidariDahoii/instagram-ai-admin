"use client";

import { useState } from "react";

type FormDataType = {
  business: string;
  audience: string;
  style: string;
  topic: string;
  extra: string;
};

type ApiResultType = {
  success: boolean;
  prompt?: string;
  imageUrl?: string | null;
  imageBase64?: string | null;
  mediaType?: string;
  error?: string;
};

export default function Home() {
  const [formData, setFormData] = useState<FormDataType>({
    business: "",
    audience: "",
    style: "",
    topic: "",
    extra: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState<ApiResultType | null>(null);
  const [error, setError] = useState("");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setApiResult(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "درخواست به API موفق نبود");
      }

      setApiResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ارسال اطلاعات به API با خطا مواجه شد"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const imageSrc =
    apiResult?.imageUrl ||
    (apiResult?.imageBase64
      ? `data:${apiResult.mediaType || "image/png"};base64,${apiResult.imageBase64}`
      : null);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            ادمین هوشمند اینستاگرام
          </h1>

          <p className="mt-3 text-zinc-600">
            اطلاعات پایه پیج را وارد کن تا یک تصویر مناسب برای پست اینستاگرام
            تولید کنیم.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-8 shadow-sm"
        >
          <div>
            <label className="mb-2 block font-medium">
              حوزه فعالیت پیج
            </label>

            <input
              name="business"
              value={formData.business}
              onChange={handleChange}
              type="text"
              placeholder="مثلاً فروش دستگاه‌های CNC سنگ"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              مخاطب هدف
            </label>

            <input
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              type="text"
              placeholder="مثلاً صاحبان کارگاه‌های سنگ و کارخانه‌ها"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              سبک پیج
            </label>

            <input
              name="style"
              value={formData.style}
              onChange={handleChange}
              type="text"
              placeholder="مثلاً حرفه‌ای، مینیمال و صنعتی"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              موضوع این پست
            </label>

            <input
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              type="text"
              placeholder="مثلاً دقت برش دستگاه CNC پنج محور"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              توضیحات اضافه
            </label>

            <textarea
              name="extra"
              value={formData.extra}
              onChange={handleChange}
              rows={4}
              placeholder="مثلاً تصویر واقع‌گرایانه، مدرن، بدون نوشته و مناسب پست اینستاگرام"
              className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "در حال تولید تصویر..." : "تولید تصویر"}
          </button>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {imageSrc && (
            <div className="space-y-4 rounded-xl bg-zinc-100 p-4 text-sm">
              <p className="font-medium">تصویر تولیدشده:</p>

              <img
                src={imageSrc}
                alt="Generated Instagram Post"
                className="w-full rounded-xl border border-zinc-200"
              />

              <details className="rounded-lg bg-white p-4">
                <summary className="cursor-pointer font-medium">
                  نمایش جزئیات فنی
                </summary>

                <pre className="mt-3 whitespace-pre-wrap text-xs text-zinc-700">
                  {JSON.stringify(
                    {
                      prompt: apiResult?.prompt,
                      mediaType: apiResult?.mediaType,
                      hasImageUrl: Boolean(apiResult?.imageUrl),
                      hasImageBase64: Boolean(apiResult?.imageBase64),
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}