"use client";

import { useState } from "react";
import { buildLocalImagePrompt } from "../lib/ai/local-prompt-builder";

type ContentType = "product" | "service" | "event";

type FormDataType = {
  contentType: ContentType;
  topic: string;
  goal: string;
  extra: string;
};

/*
type PromptApiResult = {
  success: boolean;
  prompt?: string;
  error?: string;
};
*/

export default function Home() {
  const [formData, setFormData] = useState<FormDataType>({
    contentType: "product",
    topic: "",
    goal: "",
    extra: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function generatePrompt() {
    setIsLoading(true);
    setError("");
    setPrompt("");

    const localPrompt = buildLocalImagePrompt({
      ...formData,
      hasReferenceImage: Boolean(referenceImage),
    });

    setPrompt(localPrompt);
    setIsLoading(false);
  }

  /*
  // Future AI interpreter path. Kept commented for later reactivation.
  async function generatePromptWithApi() {
    setIsLoading(true);
    setError("");
    setPrompt("");

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          hasReferenceImage: Boolean(referenceImage),
        }),
      });

      const data: PromptApiResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تولید پرامپت ناموفق بود");
      }

      setPrompt(data.prompt || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تولید پرامپت با خطا مواجه شد"
      );
    } finally {
      setIsLoading(false);
    }
  }
  */

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await generatePrompt();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            سازنده پرامپت اینستاگرام
          </h1>
          <p className="mt-3 text-zinc-600">
            اطلاعات این پست را وارد کن تا یک پرامپت نهایی برای تولید تصویر بسازیم.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-8 shadow-sm"
        >
          <div>
            <label htmlFor="contentType" className="mb-2 block font-medium">
              نوع محتوا
            </label>
            <select
              id="contentType"
              name="contentType"
              value={formData.contentType}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
            >
              <option value="product">محصول</option>
              <option value="service">خدمت</option>
              <option value="event">ایونت / کانسپت</option>
            </select>
          </div>

          <div>
            <label htmlFor="referenceImage" className="mb-2 block font-medium">
              عکس مرجع
            </label>
            <input
              id="referenceImage"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setReferenceImage(event.target.files?.[0] || null)
              }
              className="w-full rounded-xl border border-zinc-300 px-4 py-3"
            />
          </div>

          <div>
            <label htmlFor="topic" className="mb-2 block font-medium">
              موضوع / محصول
            </label>
            <input
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
              placeholder="مثلاً عطر ورساچه برایت کریستال"
            />
          </div>

          <div>
            <label htmlFor="goal" className="mb-2 block font-medium">
              هدف پست
            </label>
            <input
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
              placeholder="مثلاً فروش محصول یا معرفی بازی"
            />
          </div>

          <div>
            <label htmlFor="extra" className="mb-2 block font-medium">
              توضیحات اضافه
            </label>
            <textarea
              id="extra"
              name="extra"
              value={formData.extra}
              onChange={handleChange}
              rows={4}
              className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none"
              placeholder="مثلاً این بازی یکی از بازی‌های کافه من است"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "در حال ساخت..." : "تولید پرامپت"}
          </button>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {prompt && (
            <div className="space-y-3 rounded-xl bg-zinc-100 p-4">
              <p className="font-medium">پرامپت نهایی:</p>
              <pre className="whitespace-pre-wrap text-left text-sm" dir="ltr">
                {prompt}
              </pre>
              <button
                type="button"
                onClick={copyPrompt}
                className="w-full rounded-xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-900"
              >
                کپی پرامپت
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
