"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type ContentBrief } from "../../lib/content-planning";
import { type Profile } from "../../lib/business-profile";
import { clarificationKey, fingerprint, questionsFor, unresolved, decisionInstructions, type ClarificationState } from "../../lib/clarification";
import { parseCreativePackage, type CreativePackage } from "../../lib/creative-package";

const briefKey = "instagram-ai-admin:content-brief:v1";
const packageKey = "instagram-ai-admin:creative-package:v1";
export default function ProductionPage() {
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [result, setResult] = useState<CreativePackage | null>(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const b = localStorage.getItem(briefKey);
      const p = localStorage.getItem("instagram-ai-admin:business-profile:v1");
      const r = localStorage.getItem(packageKey);
      if (b) setBrief(JSON.parse(b));
      if (p) setProfile(JSON.parse(p).profile);
      if (r) setResult(parseCreativePackage(r));
    } catch { setMessage("داده ذخیره‌شده نامعتبر است."); }
    setLoaded(true);
  }, []);
  function clarificationStatus() {
    if (!brief || !profile) return {valid:false, instructions:""};
    try { const raw=localStorage.getItem(clarificationKey);if(!raw)return {valid:false,instructions:""};const state=JSON.parse(raw) as ClarificationState;const qs=questionsFor(profile,brief);return {valid:state.fingerprint===fingerprint(profile,brief)&&unresolved(qs,state.decisions).length===0,instructions:decisionInstructions(qs,state.decisions)}; }catch{return {valid:false,instructions:""};}
  }
  async function copyRequest() {
    if (!brief) return;
    const clarification=clarificationStatus();if(!clarification.valid){setMessage("پیش از تولید، اطلاعات ضروری را در مرحله برنامه‌ریزی تعیین تکلیف و ذخیره کن.");return;}
    const request = [
      "به عنوان کارگردان خلاق و تولیدکننده حرفه‌ای محتوای اینستاگرام، از ContentBrief زیر یک بسته اجرایی واقعی بساز.",
      brief.format === "single-image" ? "خروجی یک پست تک‌تصویری است: scenes دقیقاً یک عضو داشته باشد؛ seconds برابر «تصویر ثابت»، shot شرح طراحی و ترکیب‌بندی، onScreenText متن کوتاه روی تصویر، audio رشته خالی باشد. کپشن و CTA جداگانه ارائه شوند. هیچ شات‌لیست و دستور فیلم‌برداری تولید نکن." : brief.format === "carousel" ? "خروجی کاروسل است؛ scenes اسلایدهای مجزا هستند، seconds شماره اسلاید و audio رشته خالی باشد." : "خروجی ریلز است؛ scenes شات‌لیست زمان‌بندی‌شده و قابل فیلم‌برداری باشد.",
      "محدودیت‌های پروفایل، به‌خصوص عدم نمایش چهره را رعایت کن. جزئیات اثبات‌نشده، قیمت، آدرس یا رویداد اختراع نکن.",
      "پاسخ را فقط در یک بلوک کد Markdown با زبان json (شروع با ```json و پایان با ```) بنویس تا دکمه Copy code نمایش داده شود. داخل بلوک فقط JSON معتبر با کلیدهای زیر باشد و بیرون بلوک هیچ توضیحی ننویس:",
      '{"title":"...","concept":"...","visualDirection":"...","scenes":[{"seconds":"0-3","shot":"...","onScreenText":"...","audio":"..."}],"caption":"...","callToAction":"...","productionNotes":["..."],"unknowns":["..."]}',
      "تصمیم‌های مشتری و حدود اختیار AI:", clarification.instructions, "هر مورد واگذارشده را تا حد ممکن حل کن؛ بدون منبع معتبر، واقعیت محصول یا موجودی را قطعی فرض نکن. جای‌خالی تصویری را خروجی نهایی معرفی محصول جا نزن.",
      "ContentBrief:", JSON.stringify(brief, null, 2), "BusinessProfile:", JSON.stringify(profile, null, 2)
    ].join("\n\n");
    try { await navigator.clipboard.writeText(request); setMessage("درخواست کپی شد؛ آن را در ChatGPT ارسال کن."); }
    catch { setMessage("کپی انجام نشد؛ دسترسی Clipboard را بررسی کن."); }
  }
  function save() {
    try {
      if (!clarificationStatus().valid) throw new Error("تکمیل اطلاعات ضروری در مرحله برنامه‌ریزی لازم است.");
      const parsed = parseCreativePackage(input);
      localStorage.removeItem("instagram-ai-admin:quality-review:v1");
      localStorage.setItem(packageKey, JSON.stringify(parsed));
      setResult(parsed); setMessage("بسته تولید ذخیره شد؛ آماده بررسی کیفیت است.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "پاسخ نامعتبر است."); }
  }
  return <main dir="rtl" className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900"><div className="mx-auto max-w-3xl">
    <p className="text-sm font-semibold text-indigo-700">Instagram AI Admin · مرحله سوم</p>
    <h1 className="mt-2 text-3xl font-bold">کارگردانی خلاق و بسته تولید</h1>
    <p className="mt-3 text-sm leading-7 text-slate-600">در این نسخه، GPT در گفت‌وگو سناریو و کپشن می‌سازد و وب‌اپ خروجی را اعتبارسنجی و ذخیره می‌کند. تولید ویدیو یا تصویر نهایی هنوز انجام نمی‌شود.</p>
    {!loaded ? <p className="mt-6">در حال بارگذاری...</p> : !brief ? <section className="mt-6 rounded-2xl bg-white p-6"><p>ابتدا پیشنهاد محتوایی مرحله دوم را ذخیره کن.</p><Link href="/planning" className="mt-3 inline-block text-indigo-700 underline">بازگشت به مرحله دوم</Link></section> : <>
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-bold">ورودی تأییدشده برای تولید</h2>
        <p className="mt-2 text-sm">موضوع: {brief.topic}</p><p className="mt-1 text-sm">قالب: {brief.format}</p>
        <p className="mt-2 text-xs text-slate-500">اگر پیشنهاد مرحله دوم تغییر کند، برای تولید مجدد باید این درخواست را دوباره کپی کنی.</p>
<Link href="/planning" className="mt-3 block text-sm text-indigo-700 underline">ویرایش پاسخ‌ها و اختیار تصمیم‌گیری</Link>
        <button onClick={copyRequest} className="mt-5 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">کپی درخواست تولید خلاقانه برای ChatGPT</button>
        <label htmlFor="creative-json" className="mt-5 block text-sm font-semibold">پاسخ JSON از ChatGPT</label>
        <textarea id="creative-json" dir="ltr" rows={8} value={input} onChange={e => setInput(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-mono text-xs" placeholder='{"title":"...", "concept":"...", ...}' />
        <button disabled={!input.trim()} onClick={save} className="mt-3 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-40">اعتبارسنجی و ذخیره بسته تولید</button>
        {message && <p role="status" className="mt-3 text-sm text-indigo-700">{message}</p>}
      </section>
      {result && <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">{result.title}</h2><p className="mt-3 leading-7">{result.concept}</p>
        <h3 className="mt-6 font-bold">کارگردانی بصری</h3><p className="mt-2 text-sm leading-7">{result.visualDirection}</p>
        <h3 className="mt-6 font-bold">{brief.format === "single-image" ? "طرح تصویر و متن روی پست" : brief.format === "carousel" ? "اسلایدها" : "شات‌لیست"}</h3>
        <div className="mt-3 space-y-3">{result.scenes.map((s, i) => <div key={i} className="rounded-xl bg-slate-50 p-4 text-sm leading-7"><strong>بخش {i + 1} · {s.seconds}</strong><p>تصویر: {s.shot}</p><p>متن: {s.onScreenText}</p><p>صدا: {s.audio}</p></div>)}</div>
        <h3 className="mt-6 font-bold">کپشن آماده ویرایش</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{result.caption}</p>
        <p className="mt-3 text-sm font-semibold">CTA: {result.callToAction}</p>
        <h3 className="mt-6 font-bold">نکات تولید</h3><ul className="mt-2 list-inside list-disc text-sm leading-7">{result.productionNotes.map((x, i) => <li key={i}>{x}</li>)}</ul>
        {result.unknowns.length > 0 && <><h3 className="mt-5 font-bold">موارد نیازمند تأیید</h3><ul className="mt-2 list-inside list-disc text-sm leading-7">{result.unknowns.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
        <p className="mt-5 text-xs text-amber-800">این بسته، برنامه تولید است و به معنی آماده‌بودن فایل ویدیویی یا تصویری برای انتشار نیست.</p>
        <Link href="/quality" className="mt-5 inline-block rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">مرحله چهارم: کنترل کیفیت</Link>
      </section>}
    </>}
  </div></main>;
}
