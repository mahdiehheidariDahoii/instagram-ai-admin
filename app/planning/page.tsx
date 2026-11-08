"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { emptyProfile, type Profile } from "../../lib/business-profile";
import { createContentBrief, type ContentBrief } from "../../lib/content-planning";
import { parseAiBrief } from "../../lib/ai-brief-import";
import { clarificationKey, fingerprint, questionsFor, unresolved, decisionInstructions, type Decision, type ClarificationState } from "../../lib/clarification";

const profileKey = "instagram-ai-admin:business-profile:v1";
const briefKey = "instagram-ai-admin:content-brief:v1";

export default function PlanningPage() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [source, setSource] = useState<"rules" | "chatgpt">("rules");
  const [notice, setNotice] = useState("");
  const [desiredFormat, setDesiredFormat] = useState<ContentBrief["format"]>("single-image");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(profileKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { profile?: Profile };
        if (parsed.profile && typeof parsed.profile.description === "string") setProfile({ ...emptyProfile, ...parsed.profile });
      }
      const stored = localStorage.getItem(briefKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ContentBrief;
        if (parsed.version === 1) { setBrief(parsed); setDesiredFormat(parsed.format); setSource(localStorage.getItem(briefKey + ":source") === "chatgpt" ? "chatgpt" : "rules"); }
      }
    } catch { setError("اطلاعات ذخیره‌شده قابل خواندن نیستند."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!profile) return;
    try {
      const stored=localStorage.getItem(clarificationKey);
      if (stored) {const parsed=JSON.parse(stored) as ClarificationState;const b=brief || {...createContentBrief(profile),format:desiredFormat};setDecisions(parsed.fingerprint===fingerprint(profile,b) ? Object.fromEntries(Object.entries(parsed.decisions).filter(([, d]) => d.mode === "provided" || d.mode === "delegate")) : {});}
    } catch { /* ignore stale answers */ }
  }, [profile, brief, desiredFormat]);
  function updateDecision(id: string, value: Decision) { setDecisions(prev => ({ ...prev, [id]: value })); setNotice(""); }
  function generate() {
    if (!profile) return;
    const next = { ...createContentBrief(profile), format: desiredFormat };
    setBrief(next);
    localStorage.removeItem("instagram-ai-admin:creative-package:v1");
    localStorage.removeItem("instagram-ai-admin:quality-review:v1");
    setSource("rules");
    try { localStorage.setItem(briefKey, JSON.stringify(next)); localStorage.setItem(briefKey + ":source", "rules"); setError(""); }
    catch { setError("پیشنهاد ساخته شد، اما ذخیره در مرورگر انجام نشد."); }
  }
  async function copyForChatGPT() {
    if (!profile) return;
    const request = [
      "به عنوان استراتژیست ارشد محتوای اینستاگرام، پروفایل زیر را تحلیل کن و برای اولین محتوای مناسب این کسب‌وکار تصمیم بگیر.",
      `قالب انتخابی کاربر ${desiredFormat} است؛ آن را تغییر نده. محتوا را برای همین قالب و هدف کسب‌وکار طراحی کن. ادعای بدون پشتوانه، قیمت و ویژگی اختراعی نده.`,
      "پاسخ را فقط به‌صورت یک بلوک کد Markdown با زبان json (شروع با ```json و پایان با ```) بده تا دکمه Copy code نمایش داده شود. داخل بلوک فقط یک شیء JSON معتبر قرار بده؛ هیچ متن یا توضیحی بیرون بلوک ننویس. کلیدها دقیقاً این‌ها باشند:",
      '{"objective":"...","audience":"...","topic":"...","format":"single-image | carousel | reel","message":"...","callToAction":"...","rationale":["..."],"assumptions":["..."]}',
      "format فقط یکی از سه مقدار ذکرشده باشد. rationale دلایل واقعی و assumptions عدم‌قطعیت‌ها باشند.",
      "پاسخ‌ها و واگذاری تصمیم‌های مشتری (پیشنهاد AI را با واقعیت تأییدشده اشتباه نگیر):", decisionInstructions(questionsFor(profile, { ...createContentBrief(profile), format: desiredFormat }), decisions),
      "پروفایل:", JSON.stringify(profile, null, 2),
    ].join("\n\n");
    if (unresolved(questionsFor(profile, { ...createContentBrief(profile), format: desiredFormat }), decisions).length) { setError("ابتدا سؤال‌های ضروری را پاسخ بده یا به AI واگذار کن."); return; }
    try { await navigator.clipboard.writeText(request); setNotice("درخواست تحلیل کپی شد. آن را در همین گفت‌وگوی ChatGPT بفرست."); setError(""); }
    catch { setError("کپی خودکار ممکن نشد؛ دسترسی Clipboard مرورگر را بررسی کن."); }
  }
  function importAi() {
    try {
      if (profile && unresolved(questionsFor(profile, { ...createContentBrief(profile), format: desiredFormat }), decisions).length) throw new Error("ابتدا اطلاعات ضروری را تعیین تکلیف کن.");
      const parsed = parseAiBrief(aiResponse);
      if (parsed.format !== desiredFormat) throw new Error("قالب پاسخ AI با انتخاب شما مطابقت ندارد. قالب انتخابی: " + desiredFormat + "؛ قالب پاسخ: " + parsed.format);
      localStorage.removeItem("instagram-ai-admin:creative-package:v1");
      localStorage.removeItem("instagram-ai-admin:quality-review:v1");
      localStorage.setItem(briefKey, JSON.stringify(parsed));
      localStorage.setItem(briefKey + ":source", "chatgpt");
      setBrief(parsed); setSource("chatgpt"); setError(""); setNotice("پیشنهاد AI با موفقیت ذخیره شد.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "JSON نامعتبر است."); }
  }
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-700">Instagram AI Admin · مرحله دوم</p>
          <h1 className="mt-2 text-3xl font-bold">تصمیم‌گیری محتوایی</h1>
          <p className="mt-3 leading-7 text-slate-600">از پروفایل ثبت‌شده استفاده می‌کنیم تا اولین پیشنهاد محتوایی را بدون پرسش دوباره از مشتری بسازیم.</p>
        </header>
        {!ready ? <p>در حال بارگذاری...</p> : !profile ? (
          <section className="rounded-2xl bg-white p-7 shadow-sm">
            <h2 className="text-lg font-semibold">پروفایل کسب‌وکار پیدا نشد</h2>
            <p className="my-4 text-sm text-slate-600">باید در همین مرورگر و همین دامنه، مرحله شناخت کسب‌وکار را ثبت کرده باشی.</p>
            <Link href="/business" className="inline-block rounded-xl bg-indigo-700 px-5 py-3 text-white">رفتن به شناخت کسب‌وکار</Link>
          </section>
        ) : (
          <>
            <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-semibold">پروفایل متصل شد</h2><p className="mt-1 text-sm text-slate-600">{profile.businessType || "نوع کسب‌وکار نامشخص"} · {profile.products || "محصولات نامشخص"}</p></div>
                <Link href="/business" className="text-sm font-medium text-indigo-700 underline">ویرایش پروفایل</Link>
              </div>
              <label htmlFor="desired-format" className="mt-5 block text-sm font-semibold">قالب محتوای آزمایشی</label>
              <select id="desired-format" value={desiredFormat} onChange={e => { setDesiredFormat(e.target.value as ContentBrief["format"]); setBrief(null); setDecisions({}); setNotice("قالب تغییر کرد؛ برای ادامه پیشنهاد جدید بساز یا پاسخ AI مطابق قالب جدید وارد کن."); }} className="mt-2 rounded-xl border border-slate-300 bg-white p-3 text-sm"><option value="single-image">پست تک‌تصویری</option><option value="carousel">پست اسلایدی</option><option value="reel">ریلز</option></select>
              <p className="mt-2 text-xs text-slate-500">برای آزمایش فعلی، پست تک‌تصویری را انتخاب کن. قالب برای هر کسب‌وکار قابل تغییر است.</p>
              <div className="mt-6 space-y-4 border-t pt-5"><h3 className="font-semibold">تکمیل هوشمند اطلاعات پیش از تولید</h3><p className="text-sm text-slate-600">برای هر مورد اطلاعات را خودت وارد کن یا تصمیم را به AI بسپار. واگذاری، تأیید موجودی یا مشخصات واقعی نیست.</p>
              {questionsFor(profile, { ...createContentBrief(profile), format: desiredFormat }).map(q => <div key={q.id} className="rounded-xl border border-slate-200 p-4"><p className="font-medium">{q.question}{q.critical ? " *" : ""}</p><p className="mt-1 text-xs text-slate-500">{q.hint}</p><select aria-label={q.question} className="mt-3 w-full rounded-lg border p-2 text-sm" value={decisions[q.id]?.mode || ""} onChange={e => updateDecision(q.id,{mode:e.target.value as Decision["mode"],value:""})}><option value="">انتخاب کنید</option><option value="provided">اطلاعات را خودم وارد می‌کنم</option>{q.id !== "availability" && <option value="delegate">انتخاب را به AI می‌سپارم</option>}</select>{decisions[q.id]?.mode === "provided" && <textarea className="mt-2 w-full rounded-lg border p-2 text-sm" rows={2} placeholder="پاسخ تأییدشده شما" value={decisions[q.id].value} onChange={e => updateDecision(q.id,{mode:"provided",value:e.target.value})}/>}</div>)}
              <button className="rounded-xl border border-indigo-300 px-4 py-2 text-sm text-indigo-700" onClick={() => {const b={...createContentBrief(profile),format:desiredFormat};const state:ClarificationState={fingerprint:fingerprint(profile,b),decisions};localStorage.setItem(clarificationKey,JSON.stringify(state));setNotice("انتخاب‌ها ذخیره شدند.");}}>ذخیره پاسخ‌ها و واگذاری‌ها</button>{unresolved(questionsFor(profile, { ...createContentBrief(profile), format: desiredFormat }), decisions).length > 0 && <p className="text-sm text-amber-800">موارد ضروری باقی‌مانده: {unresolved(questionsFor(profile, { ...createContentBrief(profile), format: desiredFormat }), decisions).map(q=>q.question).join("، ")}</p>}</div>
              <button onClick={generate} className="mt-5 block rounded-xl border border-slate-300 px-5 py-3 text-sm">ساخت پیشنهاد آزمایشی قانون‌محور</button>
            </section>
            <section className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">تحلیل با ChatGPT (بدون API)</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">۱. درخواست حاوی پروفایل را کپی کن و در گفت‌وگوی ChatGPT بفرست. ۲. پاسخ JSON را اینجا وارد کن. ۳. ذخیره کن. این مسیر در نسخه آزمایشی دستی است.</p>
              <button onClick={copyForChatGPT} className="mt-4 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">کپی درخواست تحلیل برای ChatGPT</button>
              <label htmlFor="ai-brief" className="mt-5 block text-sm font-semibold">پاسخ JSON از ChatGPT</label>
              <textarea id="ai-brief" dir="ltr" value={aiResponse} onChange={e => setAiResponse(e.target.value)} rows={7} placeholder='{"objective":"...","audience":"...", ...}' className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs" />
              <button onClick={importAi} disabled={!aiResponse.trim()} className="mt-3 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-40">اعتبارسنجی و ذخیره پیشنهاد AI</button>
              {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
            </section>
            {brief && (
              <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold">پیشنهاد اولین محتوا</h2>
                <p className="mt-2 text-xs text-amber-800">{source === "chatgpt" ? "پیشنهاد واردشده از ChatGPT؛ هنوز محتوا تولید نشده است." : "پیش‌نویس قانون‌محور، نه خروجی AI؛ هنوز محتوا تولید نشده است."}</p>
                <dl className="mt-6 divide-y divide-slate-100">
                  {[
                    ["هدف", brief.objective], ["مخاطب", brief.audience], ["موضوع", brief.topic],
                    ["قالب", brief.format === "single-image" ? "پست تک‌تصویر" : brief.format === "carousel" ? "کاروسل" : "ریلز"],
                    ["پیام اصلی", brief.message], ["دعوت به اقدام", brief.callToAction],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-2 py-3 sm:grid-cols-3"><dt className="text-sm font-semibold text-slate-600">{label}</dt><dd className="text-sm leading-7 sm:col-span-2">{value}</dd></div>
                  ))}
                </dl>
                <div className="mt-5 rounded-xl bg-slate-50 p-5">
                  <h3 className="font-semibold">چرا این پیشنهاد انتخاب شد؟</h3>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-7">{brief.rationale.map(item => <li key={item}>{item}</li>)}</ul>
                </div>
                {brief.assumptions.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-5"><h3 className="font-semibold text-amber-900">اطلاعات نامشخص</h3><ul className="mt-2 list-inside list-disc space-y-2 text-sm text-amber-900">{brief.assumptions.map(item => <li key={item}>{item}</li>)}</ul></div>}
                <p role="status" className="mt-5 text-sm text-emerald-700">پیشنهاد در همین مرورگر ذخیره شده و برای اتصال به مرحله سوم آماده است.</p>
                <Link href="/production" onClick={e => { if (unresolved(questionsFor(profile, brief), decisions).length) {e.preventDefault();setError("قبل از تولید، سؤال‌های ضروری را پاسخ بده یا به AI بسپار.");return;} const state:ClarificationState={fingerprint:fingerprint(profile,brief),decisions};localStorage.setItem(clarificationKey,JSON.stringify(state)); }} className="mt-4 inline-block rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">مرحله سوم: کارگردانی و تولید محتوا</Link>
              </section>
            )}
          </>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <p className="mt-6 text-xs leading-6 text-slate-500">نسخه پایه: تصمیم اولیه قابل بازبینی است. پیشنهادها تضمین‌کننده رشد، فروش یا عملکرد اینستاگرام نیستند.</p>
      </div>
    </main>
  );
}
