"use client";

import { useEffect, useRef, useState } from "react";

const CHANNEL = "INSTAGRAM_AI_ADMIN_BRIDGE_V1";

export default function ExtensionTestPage() {
  const [status, setStatus] = useState("آماده آزمایش");
  const [details, setDetails] = useState("");
  const [extensionReady, setExtensionReady] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const autoRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef("");
  const stableRef = useRef(0);
  const startedRef = useRef(0);
  const stopAuto = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  const startAuto = () => {
    stopAuto();
    pendingRef.current = "";
    stableRef.current = 0;
    startedRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (Date.now() - startedRef.current > 180000) {
        stopAuto();
        setStatus("زمان انتظار دریافت خودکار تمام شد؛ دریافت دستی همچنان فعال است");
        return;
      }
      const requestId = crypto.randomUUID();
      window.postMessage({channel: CHANNEL, type: "CAPTURE_RESPONSE", requestId, auto: true}, window.location.origin);
    }, 3000);
  };

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.channel !== CHANNEL) return;
      if (data.type === "READY") setExtensionReady(true);
      if (data.type === "RESPONSE" && data.pending && data.ok === false) return;
      if (data.type === "RESPONSE" && data.captured && timerRef.current && typeof data.text === "string") {
        let validJson = false;
        try {
          const parsed = JSON.parse(data.text);
          validJson = parsed?.task === "extension-connection-test" && parsed?.project === "Instagram AI Admin";
        } catch {}
        if (!validJson) return;
        if (data.text === pendingRef.current) stableRef.current += 1;
        else { pendingRef.current = data.text; stableRef.current = 1; }
        if (stableRef.current >= 3) {
          stopAuto();
          setStatus("موفق: متن پاسخ به‌صورت خودکار دریافت شد");
          setDetails(JSON.stringify(data, null, 2));
        }
        return;
      }
      if (data.type === "RESPONSE") {
        if (data.requestId !== sessionStorage.getItem("extension-test-request-id")) return;
        setStatus(data.ok ? (data.captured ? "موفق: متن پاسخ به وب‌اپ برگشت" : data.autoSent ? "موفق: پیام به‌صورت خودکار ارسال شد" : data.drafted ? "موفق: متن در ChatGPT قرار گرفت؛ ارسال نشده است" : "موفق: افزونه JSON را دریافت کرد") : "خطا: " + (data.error || "دریافت JSON"));
        setDetails(JSON.stringify(data, null, 2));
        if (data.ok && data.drafted && autoRef.current) {
          setStatus(data.autoSent
            ? "پیام خودکار ارسال شد؛ در انتظار پاسخ..."
            : data.submissionUnconfirmed
              ? "ارسال هنوز تأیید نشده؛ دریافت خودکار پاسخ در حال بررسی است..."
              : "متن وارد ChatGPT شد؛ پس از ارسال دستی، پاسخ بررسی می‌شود");
          startAuto();
        }
      }
    };
    window.addEventListener("message", listener);
    return () => { window.removeEventListener("message", listener); stopAuto(); };
  }, []);

  function testBridge(mode: "REQUEST" | "DRAFT_CHATGPT") {
    const requestId = crypto.randomUUID();
    sessionStorage.setItem("extension-test-request-id", requestId);
    const payload = {
      task: "extension-connection-test",
      project: "Instagram AI Admin",
      language: "fa",
      example: {topic: "برنامه محتوایی اینستاگرام", count: 3}
    };
    stopAuto();
    setStatus("در انتظار پاسخ افزونه...");
    setDetails(JSON.stringify(payload, null, 2));
    window.postMessage({channel: CHANNEL, type: mode, requestId, payload, autoSend: mode === "DRAFT_CHATGPT" && autoSend}, window.location.origin);
    window.setTimeout(() => {
      if (sessionStorage.getItem("extension-test-request-id") === requestId) {
        setStatus((current) => current === "در انتظار پاسخ افزونه..." ? "پاسخی دریافت نشد؛ نصب و فعال‌بودن افزونه را بررسی کن" : current);
      }
    }, 25000);
  }

  function captureResponse() {
    const requestId = crypto.randomUUID();
    sessionStorage.setItem("extension-test-request-id", requestId);
    setStatus("در حال دریافت متن پاسخ از ChatGPT...");
    window.postMessage({channel: CHANNEL, type: "CAPTURE_RESPONSE", requestId}, window.location.origin);
  }

  return (
    <main dir="rtl" className="mx-auto max-w-2xl p-8 space-y-5">
      <h1 className="text-2xl font-bold">تست اتصال افزونه Chrome</h1>
      <p>تست اتصال رفت‌وبرگشت: ارسال درخواست، دریافت پاسخ و اعتبارسنجی JSON.</p>
      <p>وضعیت افزونه: <strong>{extensionReady ? "شناسایی شد" : "هنوز شناسایی نشده"}</strong></p>
      <button type="button" onClick={() => testBridge("REQUEST")} className="rounded bg-black px-5 py-3 text-white cursor-pointer">
        ارسال JSON آزمایشی
      </button>
      <button type="button" onClick={() => testBridge("DRAFT_CHATGPT")} className="rounded border px-5 py-3 cursor-pointer">انتقال JSON به ChatGPT (بدون ارسال)</button>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={autoSend} onChange={e => setAutoSend(e.target.checked)} />
        ارسال خودکار پیام در ChatGPT (آزمایشی)
      </label>
      <button type="button" onClick={captureResponse} className="rounded border px-5 py-3 cursor-pointer">دریافت متن پاسخ از ChatGPT</button>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={autoCapture} onChange={e => { setAutoCapture(e.target.checked); autoRef.current = e.target.checked; if (!e.target.checked) stopAuto(); }} />
        دریافت خودکار پاسخ پس از ارسال دستی (حداکثر ۳ دقیقه)
      </label>
      <p role="status">{status}</p>
      {details && (() => {
        try {
          const data = JSON.parse(details);
          return typeof data.text === "string" ? (
            <button type="button" className="rounded border px-4 py-2 cursor-pointer" onClick={() => navigator.clipboard.writeText(data.text)}>کپی متن پاسخ</button>
          ) : null;
        } catch { return null; }
      })()}
      {details && (() => {
        try {
          const envelope = JSON.parse(details);
          if (typeof envelope.text !== "string") return null;
          const answer = JSON.parse(envelope.text);
          return (
            <section className="space-y-3 rounded-xl border bg-white p-5">
              <h2 className="text-xl font-bold">پاسخ دریافتی از ChatGPT</h2>
              <p className="text-sm text-gray-600">پاسخ پردازش‌شده و قابل خواندن</p>
              <div className="grid gap-2 text-sm">
                <p><strong>وضعیت:</strong> {String(answer.status ?? "—")}</p>
                <p><strong>پروژه:</strong> {String(answer.project ?? "—")}</p>
                <p><strong>موضوع:</strong> {String(answer.result?.topic ?? "—")}</p>
              </div>
              {Array.isArray(answer.result?.items) && (
                <div className="space-y-3">
                  {answer.result.items.map((item: {id?: number; title?: string; type?: string; description?: string}, index: number) => (
                    <article key={item.id ?? index} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{item.title || `محتوا ${index + 1}`}</strong>
                        {item.type && <span className="rounded bg-gray-100 px-2 py-1 text-xs">{item.type}</span>}
                      </div>
                      {item.description && <p className="mt-2 text-sm leading-7">{item.description}</p>}
                    </article>
                  ))}
                </div>
              )}
              <details>
                <summary className="cursor-pointer text-sm font-medium">نمایش JSON اصلی پاسخ</summary>
                <pre dir="ltr" className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(answer, null, 2)}</pre>
              </details>
            </section>
          );
        } catch { return null; }
      })()}
      <details>
        <summary className="cursor-pointer text-sm">جزئیات فنی ارتباط افزونه</summary>
        <pre dir="ltr" className="mt-2 overflow-auto rounded border p-4 text-sm">{details}</pre>
      </details>
    </main>
  );
}
