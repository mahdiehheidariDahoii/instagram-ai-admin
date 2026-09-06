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
  const [caption, setCaption] = useState("");
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

  async function generateCaption() {
    const response = await fetch("/api/generate-caption", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "خطا در تولید کپشن");
    }

    setCaption(data.caption);
  }

  async function generateImage() {
    setIsLoading(true);
    setError("");

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

      await generateCaption();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ارسال اطلاعات با خطا مواجه شد"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await generateImage();
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
          {[
            {
              name: "business",
              label: "حوزه فعالیت پیج",
              placeholder: "مثلاً فروش دستگاه‌های CNC سنگ",
            },
            {
              name: "audience",
              label: "مخاطب هدف",
              placeholder: "مثلاً صاحبان کارگاه‌های سنگ و کارخانه‌ها",
            },
            {
              name: "style",
              label: "سبک پیج",
              placeholder: "مثلاً حرفه‌ای، مینیمال و صنعتی",
            },
            {
              name: "topic",
              label: "موضوع این پست",
              placeholder: "مثلاً دقت برش دستگاه CNC پنج محور",
            },
          ].map((item) => (
            <div key={item.name}>
              <label className="mb-2 block font-medium">
                {item.label}
              </label>

              <input
                name={item.name}
                value={formData[item.name as keyof FormDataType]}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
                placeholder={item.placeholder}
              />
            </div>
          ))}

          <div>
            <label className="mb-2 block font-medium">
              توضیحات اضافه
            </label>

            <textarea
              name="extra"
              value={formData.extra}
              onChange={handleChange}
              rows={4}
              className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none"
              placeholder="مثلاً تصویر واقع‌گرایانه، مدرن، بدون نوشته"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "در حال تولید..." : "تولید تصویر"}
          </button>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {imageSrc && (
            <div className="space-y-4 rounded-xl bg-zinc-100 p-4">
              <p className="font-medium">
                تصویر تولیدشده:
              </p>

              <img
                src={imageSrc}
                alt="Generated Instagram Post"
                className="w-full rounded-xl border border-zinc-200"
              />

              {caption && (
                <div className="rounded-xl border bg-white p-4">
                  <h2 className="mb-3 font-semibold">
                    کپشن پیشنهادی
                  </h2>

                  <p className="whitespace-pre-wrap text-sm">
                    {caption}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={generateImage}
                disabled={isLoading}
                className="w-full rounded-xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-900 disabled:opacity-60"
              >
                {isLoading
                  ? "در حال تولید تصویر جدید..."
                  : "یک تصویر دیگر با همین اطلاعات"}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}