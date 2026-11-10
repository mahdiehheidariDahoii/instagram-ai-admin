"use client";
import Link from "next/link";
import {workflow,advance} from "../../lib/workflow";
import { useEffect, useState } from "react";
import { type CreativePackage } from "../../lib/creative-package";
import { type ContentBrief } from "../../lib/content-planning";
import { type Profile } from "../../lib/business-profile";
import { parseQualityReview, type QualityReview } from "../../lib/quality-review";

const productionKey = "instagram-ai-admin:creative-package:v1";
const reviewKey = "instagram-ai-admin:quality-review:v1";
const bridgeChannel = "INSTAGRAM_AI_ADMIN_BRIDGE_V1";
export default function QualityPage() {
  const [production, setProduction] = useState<CreativePackage | null>(null);
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [review, setReview] = useState<QualityReview | null>(null);
  const [raw, setRaw] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  useEffect(() => {
    try {
      const p = localStorage.getItem(productionKey);
      const b = localStorage.getItem("instagram-ai-admin:content-brief:v1");
      const profileRaw = localStorage.getItem("instagram-ai-admin:business-profile:v1");
      const r = localStorage.getItem(reviewKey);
      if (p) setProduction(JSON.parse(p));
      if (b) setBrief(JSON.parse(b));
      if (profileRaw) setProfile(JSON.parse(profileRaw).profile);
      if (r) setReview(parseQualityReview(r));
    } catch { setNotice("بخشی از داده‌های ذخیره‌شده نامعتبر است."); }
    setReady(true);
  }, []);
  function buildPrompt() {
    if (!production) return "";
    return [
      "نقش تو بازرس مستقل کنترل کیفیت محتوای اینستاگرام است. محتوای زیر را سخت‌گیرانه ارزیابی کن، نه اینکه آن را تأیید کنی.",
      `قالب محتوا: ${brief?.format || "نامشخص"}. معیارها را با قالب و هدف کسب‌وکار تطبیق بده؛ جذب مشتری محلی را فقط اگر هدف کسب‌وکار است بررسی کن. برای پست تک‌تصویری: وضوح پیام، ترکیب‌بندی، متن روی تصویر، خوانایی، CTA، کپشن و ادعاها را بسنج؛ معیارهای فیلم‌برداری، هوک سه‌ثانیه‌ای و موسیقی را اعمال نکن. برای ریلز زمان‌بندی و اجرا و برای کاروسل ترتیب اسلایدها را بسنج. محدودیت‌های واقعی پروفایل را رعایت کن.`,
      "مهم: این فقط بسته ایده و دستور تولید است، نه تصویر یا ویدیوی نهایی. حتی در صورت قبولی، انتشار را بدون تولید و بازبینی فایل نهایی آماده اعلام نکن.",
      "نبود عکس محصول از سوی مشتری به‌تنهایی ایراد مسدودکننده نیست: AI باید در صورت داشتن ابزار وب، مرجع تصویری معتبر مدل دقیق را جست‌وجو و تطبیق دهد. اگر مرجع هنوز یافت نشده، آن را به‌عنوان کار باقی‌مانده در تولید تصویر ثبت کن، نه الزام مشتری به ارسال عکس. مدل دقیق و ادعاهای محصول همچنان نیازمند تأیید هستند؛ بسته‌بندی ساختگی ممنوع است.",
      "هر ایراد را با شاهد مشخص و راهکار اصلاحی بیان کن. پاسخ را فقط داخل یک بلوک کد Markdown با زبان json بنویس (شروع با ```json و پایان با ```) تا دکمه Copy code نمایش داده شود. داخل بلوک فقط یک شیء JSON معتبر قرار بده؛ هیچ توضیحی بیرون بلوک ننویس. کلیدها دقیقاً این‌ها باشند:",
      '{"verdict":"pass | revise | blocked","summary":"...","checks":[{"criterion":"...","status":"pass | warning | fail","evidence":"...","fix":"..."}],"requiredChanges":["..."],"publicationReadiness":"..."}',
      "verdict یکی از pass، revise، blocked و status یکی از pass، warning، fail باشد.",
      "BusinessProfile:", JSON.stringify(profile, null, 2),
      "ContentBrief:", JSON.stringify(brief, null, 2),
      "CreativePackage:", JSON.stringify(production, null, 2)
    ].join("\n\n");
  }
  async function copyPrompt() {
    if (!production) return;
    try { await navigator.clipboard.writeText(buildPrompt()); setNotice("درخواست کنترل کیفیت کپی شد. آن را در ChatGPT بفرست."); }
    catch { setNotice("کپی انجام نشد. دسترسی Clipboard را بررسی کن."); }
  }
  useEffect(() => {
    if (!bridgeLoading) return;
    let id = sessionStorage.getItem("instagram-ai-admin:quality-bridge-id");
    if (!id) return;
    let previous = "";
    let stable = 0;
    let lastValidationError = "";
    let lastCapture = "";

    let lastChangeAt = Date.now();

    const handle = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const data = event.data;
      if (data?.channel !== bridgeChannel || data.type !== "RESPONSE") return;
      if (data.requestId === id && !data.ok) {
        cleanup(); setBridgeLoading(false); setNotice(data.error || "خطای ارتباط با افزونه"); return;
      }
      if (data.requestId === id && data.ok && data.drafted) setNotice("درخواست ارسال شد؛ در انتظار ارزیابی...");
      if (data.originalRequestId !== id) return;
      if (!data.ok) {
        if (data.pending) setNotice("در انتظار تکمیل پاسخ ChatGPT...");
        else setNotice("خطا در دریافت پاسخ: " + (data.error || "نامشخص"));
        return;
      }
      if (!data.captured || typeof data.text !== "string") return;
      if (data.text !== lastCapture) {
        lastCapture = data.text;
        lastChangeAt = Date.now();

      }
      // ChatGPT may emit temporary search/progress messages while composing.
      // Never interpret these as the completed quality review.
      if (Date.now() - lastChangeAt < 5000) {
        setNotice("پاسخ در حال تکمیل است؛ منتظر پایدار شدن خروجی...");
        return;
      }
      try {
        const parsed = parseQualityReview(data.text);
        if (data.text === previous) stable++; else {previous = data.text; stable = 1;}
        if (stable < 2) return;
        localStorage.setItem(reviewKey, JSON.stringify(parsed));
        setRaw(data.text); setReview(parsed);
        setNotice("ارزیابی دریافت، اعتبارسنجی و ذخیره شد.");
        setBridgeLoading(false); cleanup();advance("quality","final");
      } catch (error) {
        lastValidationError = error instanceof Error ? error.message : "ساختار پاسخ معتبر نیست";
        setNotice("پاسخ هنوز کامل یا معتبر نیست؛ دریافت خودکار ادامه دارد: " + lastValidationError);
      }
    };
    const poll = () => {
      window.postMessage({channel:bridgeChannel,type:"CAPTURE_RESPONSE",requestId:crypto.randomUUID(),auto:true},location.origin);
    };
    const timer = window.setInterval(poll, 3000);
    const cleanup = () => {window.clearInterval(timer);window.removeEventListener("message",handle);};
    window.addEventListener("message",handle);
    return cleanup;
  }, [bridgeLoading]);

  function generateWithBridge() {
    if (!production) return;
    const requestId = crypto.randomUUID();
    sessionStorage.setItem("instagram-ai-admin:quality-bridge-id", requestId);
    setNotice("در حال ارسال درخواست کنترل کیفیت...");
    setBridgeLoading(true);
    window.postMessage({channel:bridgeChannel,type:"DRAFT_CHATGPT",requestId,
      payload:{task:"quality-review",project:"Instagram AI Admin"},
      prompt:buildPrompt(),autoSend:true},location.origin);
  }
  useEffect(()=>{
    if(!ready||!production||bridgeLoading)return;
    const flow=workflow();
    if(!flow?.active||flow.stage!=="quality")return;
    if(sessionStorage.getItem("instagram-ai-admin:workflow-quality-started")==="1")return;
    sessionStorage.setItem("instagram-ai-admin:workflow-quality-started","1");
    generateWithBridge();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,production]);
  function saveReview() {
    try {
      const parsed = parseQualityReview(raw);
      localStorage.setItem(reviewKey, JSON.stringify(parsed));
      setReview(parsed);
      setNotice("ارزیابی ذخیره شد. اصلاحات را پیش از تولید نهایی بررسی کن.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "خروجی نامعتبر است."); }
  }
  return <main dir="rtl" className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900"><div className="mx-auto max-w-3xl">
    <p className="text-sm font-semibold text-indigo-700">Instagram AI Admin · مرحله چهارم</p>
    <h1 className="mt-2 text-3xl font-bold">کنترل کیفیت محتوا</h1>
    <p className="mt-3 text-sm leading-7 text-slate-600">ارزیابی مستقل سناریو و کپشن؛ این مرحله به‌تنهایی تأیید انتشار ویدیوی نهایی نیست.</p>
    {!ready ? <p className="mt-6">در حال بارگذاری...</p> : !production ? <section className="mt-6 rounded-2xl bg-white p-6"><p>ابتدا بسته تولید مرحله سوم را ذخیره کن.</p><Link href="/production" className="mt-3 inline-block text-indigo-700 underline">بازگشت به تولید</Link></section> : <>
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm">بسته در حال بررسی: <strong>{production.title}</strong> · قالب: <strong>{brief?.format === "single-image" ? "پست تک‌تصویری" : brief?.format === "carousel" ? "کاروسل" : "ریلز"}</strong></p>
        <button onClick={generateWithBridge} disabled={bridgeLoading} className="mt-5 ml-3 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{bridgeLoading ? "در حال دریافت ارزیابی..." : "کنترل کیفیت خودکار با ChatGPT Bridge"}</button>
        <button onClick={copyPrompt} className="mt-5 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">کپی درخواست کنترل کیفیت برای ChatGPT</button>
        <label htmlFor="qa-json" className="mt-5 block text-sm font-semibold">پاسخ JSON از ChatGPT</label>
        <textarea id="qa-json" dir="ltr" rows={8} value={raw} onChange={e => setRaw(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs" placeholder='{"verdict":"revise", ...}' />
        <button disabled={!raw.trim()} onClick={saveReview} className="mt-3 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-40">اعتبارسنجی و ذخیره ارزیابی</button>
        {notice && <p role="status" className="mt-3 text-sm text-indigo-700">{notice}</p>}
      </section>
      {review && <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">نتیجه: {review.verdict === "pass" ? "قبول مشروط به تولید نهایی" : review.verdict === "revise" ? "نیازمند اصلاح" : "متوقف تا رفع ایراد"}</h2>
        <p className="mt-3 text-sm leading-7">{review.summary}</p>
        <h3 className="mt-6 font-bold">چک‌لیست</h3><div className="mt-3 space-y-3">{review.checks.map((c, i) => <div key={i} className="rounded-xl bg-slate-50 p-4 text-sm leading-7"><strong>{c.criterion} — {c.status}</strong><p>شاهد: {c.evidence}</p><p>اصلاح: {c.fix || "نیاز ندارد"}</p></div>)}</div>
        <h3 className="mt-6 font-bold">اصلاحات ضروری</h3>{review.requiredChanges.length ? <ul className="mt-2 list-inside list-disc text-sm leading-7">{review.requiredChanges.map((x,i) => <li key={i}>{x}</li>)}</ul> : <p className="mt-2 text-sm">اصلاح ضروری ثبت نشده است.</p>}
        <h3 className="mt-6 font-bold">آمادگی انتشار</h3><p className="mt-2 text-sm leading-7">{review.publicationReadiness}</p>
        <Link href="/final-image-prompt" className="mt-5 inline-block rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">ادامه به پرامپت نهایی</Link>
      </section>}
    </>}
  </div></main>;
}
