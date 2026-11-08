"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { emptyProfile, extractInitialProfile, profileFields, type Profile } from "../../lib/business-profile";

const storageKey = "instagram-ai-admin:business-profile:v1";
type Stage = "intro" | "questions" | "review";
const requiredKeys: (keyof Profile)[] = ["businessType", "products", "audience", "goal"];

export default function BusinessPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [description, setDescription] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { profile?: Profile; stage?: Stage };
        if (parsed.profile && typeof parsed.profile.description === "string") {
          setProfile({ ...emptyProfile, ...parsed.profile });
          setDescription(parsed.profile.description);
          setStage(parsed.stage === "review" ? "review" : "questions");
        }
      }
    } catch { /* Ignore invalid browser data. */ }
    setLoaded(true);
  }, []);

  function persist(next: Profile, nextStage: Stage) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ profile: next, stage: nextStage }));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function start() {
    if (!description.trim()) return;
    const next = extractInitialProfile(description);
    setProfile(next);
    setStage("questions");
    persist(next, "questions");
  }

  function update(key: keyof Profile, value: string) {
    setProfile(current => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function next() {
    setStage("review");
    persist(profile, "review");
  }

  const missing = requiredKeys.filter(key => !profile[key].trim());
  if (!loaded) return <main dir="rtl" className="min-h-screen bg-slate-50 p-8">در حال بارگذاری...</main>;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-700">Instagram AI Admin · نسخه آزمایشی</p>
            <h1 className="text-3xl font-bold">شناخت کسب‌وکار</h1>
            <p className="mt-2 text-sm text-slate-600">قدم اول برای تولید محتوای متناسب با کسب‌وکار تو</p>
          </div>
          <Link href="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm">صفحه تولید پرامپت قبلی</Link>
        </header>

        <div className="mb-7 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
          {([["intro", "۱. معرفی"], ["questions", "۲. تکمیل شناخت"], ["review", "۳. بررسی پروفایل"]] as const).map(([id, label]) => (
            <div key={id} className={`rounded-xl px-2 py-3 ${stage === id ? "bg-indigo-700 text-white" : "bg-white text-slate-500"}`}>{label}</div>
          ))}
        </div>

        {stage === "intro" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold">کسب‌وکارت رو با زبان خودت معرفی کن</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">لازم نیست اصطلاحات بازاریابی بلد باشی. بگو چه کاری انجام می‌دهی و از اینستاگرام چه می‌خواهی.</p>
            <label htmlFor="description" className="mt-6 block text-sm font-medium">معرفی کسب‌وکار</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={6}
              placeholder="مثلاً یک فروشگاه آنلاین عطر دارم؛ بیشتر عطر اقتصادی می‌فروشم و می‌خواهم پیجم را از صفر راه‌اندازی کنم."
              className="mt-2 w-full rounded-xl border border-slate-300 p-4 leading-7 outline-indigo-600" />
            <button disabled={!description.trim()} onClick={start} className="mt-5 w-full rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white disabled:opacity-40">بررسی معرفی و ادامه</button>
          </section>
        )}

        {stage === "questions" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold">شناخت اولیه کسب‌وکار</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">اطلاعاتی که از توضیحت تشخیص داده‌ایم از قبل وارد شده‌اند. آن‌ها را اصلاح کن و جاهای خالی مهم را تکمیل کن. پاسخ‌های نامشخص را می‌توانی خالی بگذاری.</p>
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">در این نسخه، استخراج اطلاعات با قواعد ساده انجام می‌شود؛ هنوز تحلیل زبانی هوشمند با مدل AI فعال نیست. هر مقدار را قبل از تأیید بررسی کن.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {profileFields.map(field => (
                <div key={field.key} className={field.key === "resources" ? "sm:col-span-2" : ""}>
                  <label htmlFor={field.key} className="mb-2 block text-sm font-semibold">{field.label} {requiredKeys.includes(field.key) && <span className="text-indigo-600">· مهم</span>}</label>
                  <textarea id={field.key} rows={field.key === "resources" ? 3 : 2} value={profile[field.key]}
                    onChange={e => update(field.key, e.target.value)} placeholder={field.hint}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-indigo-600" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={next} className="rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white">ساخت پروفایل اولیه</button>
              <button onClick={() => { setStage("intro"); setSaved(false); }} className="rounded-xl border border-slate-300 px-5 py-3">ویرایش معرفی</button>
            </div>
          </section>
        )}

        {stage === "review" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold">پروفایل اولیه کسب‌وکار</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">این اطلاعات، ورودی مرحله تصمیم‌گیری محتوایی خواهند بود. بخش‌های خالی به معنی «نامشخص» هستند، نه فرضیات تأییدشده.</p>
            <dl className="mt-6 divide-y divide-slate-100">
              {profileFields.map(field => (
                <div key={field.key} className="grid gap-1 py-3 sm:grid-cols-3">
                  <dt className="text-sm font-medium text-slate-600">{field.label}</dt>
                  <dd className="whitespace-pre-wrap text-sm sm:col-span-2">{profile[field.key].trim() || <span className="text-amber-700">نامشخص</span>}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              <strong>آمادگی اولیه:</strong> {missing.length === 0 ? "اطلاعات پایه ثبت شده‌اند." : `${missing.length} مورد مهم هنوز نامشخص است.`}
              <p className="mt-1 text-slate-600">این وضعیت مانع ذخیره پروفایل نمی‌شود؛ مرحله تصمیم‌گیری محتوایی اکنون به این پروفایل متصل است؛ تولید نهایی محتوا هنوز پیاده‌سازی نشده است.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => persist(profile, "review")} className="rounded-xl bg-indigo-700 px-6 py-3 font-semibold text-white">ذخیره پروفایل</button>
              <button onClick={() => { setStage("questions"); setSaved(false); }} className="rounded-xl border border-slate-300 px-5 py-3">ویرایش اطلاعات</button>
            </div>
            {saved && <p role="status" className="mt-4 text-sm text-emerald-700">پروفایل در همین مرورگر ذخیره شده است.</p>}
            <a href="/planning" className="mt-4 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white">ادامه به مرحله دوم: تصمیم محتوایی</a>
          </section>
        )}
        <p className="mt-5 text-xs leading-6 text-slate-500">ذخیره‌سازی نسخه آزمایشی فقط در مرورگر همین دستگاه انجام می‌شود؛ هنوز حساب کاربری، پایگاه داده و همگام‌سازی وجود ندارد.</p>
      </div>
    </main>
  );
}
