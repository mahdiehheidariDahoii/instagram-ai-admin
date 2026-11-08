"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { parseCreativePackage, type CreativePackage } from "../../lib/creative-package";
import { parseQualityReview, type QualityReview } from "../../lib/quality-review";
import { clarificationQuestions, missingRequired, buildClarificationPrompt, type ClarificationAnswers } from "../../lib/clarification";
const base = "instagram-ai-admin:";
const answerKey = base+"revision-answers:v1";
const revisionKey = base+"revised-package:v1";
const historyKey = base+"revision-history:v1";
export default function RevisionPage(){
 const [qa,setQa]=useState<QualityReview|null>(null);
 const [original,setOriginal]=useState<CreativePackage|null>(null);
 const [revised,setRevised]=useState<CreativePackage|null>(null);
 const [profile,setProfile]=useState<unknown>(null);
 const [brief,setBrief]=useState<unknown>(null);
 const [answers,setAnswers]=useState<ClarificationAnswers>({});
 const [raw,setRaw]=useState("");
 const [message,setMessage]=useState("");
 const [loaded,setLoaded]=useState(false);
 const [history,setHistory]=useState<CreativePackage[]>([]);
 useEffect(()=>{
  try{
   const q=localStorage.getItem(base+"quality-review:v1");
   const p=localStorage.getItem(base+"creative-package:v1");
   const b=localStorage.getItem(base+"content-brief:v1");
   const bp=localStorage.getItem(base+"business-profile:v1");
   const a=localStorage.getItem(answerKey);
   const r=localStorage.getItem(revisionKey);
   const h=localStorage.getItem(historyKey);
   if(q)setQa(parseQualityReview(q));
   if(p)setOriginal(parseCreativePackage(p));
   if(b)setBrief(JSON.parse(b));
   if(bp)setProfile(JSON.parse(bp).profile);
   if(a)setAnswers(JSON.parse(a));
   if(r)setRevised(parseCreativePackage(r));
   if(h)setHistory(JSON.parse(h));
  }catch{setMessage("داده‌های قبلی ناقص یا نامعتبر هستند.");}
  setLoaded(true);
 },[]);
 function update(key:string,value:string){setAnswers(prev=>({...prev,[key]:value}));}
 function persistAnswers(){localStorage.setItem(answerKey,JSON.stringify(answers));setMessage("پاسخ‌ها ذخیره شدند.");}
 const active=qa?clarificationQuestions(qa,original):[];
 const missing=missingRequired(active,answers);
 async function copy(){
  if(!qa||!original)return;
  if(missing.length){setMessage("ابتدا به سؤال‌های ضروری پاسخ بده: "+missing.map(x=>x.question).join(" | "));return;}
  persistAnswers();
  try{await navigator.clipboard.writeText(buildClarificationPrompt(profile,brief,original,qa,active,answers));setMessage("درخواست اصلاح با پاسخ‌های تأییدشده کپی شد.");}
  catch{setMessage("کپی ناموفق بود؛ مجوز Clipboard را بررسی کن.");}
 }
 function save(){
  try{
   const parsed=parseCreativePackage(raw);
   const next=[...history,parsed];
   localStorage.setItem(revisionKey,JSON.stringify(parsed));
   localStorage.setItem(historyKey,JSON.stringify(next));
   setRevised(parsed);setHistory(next);setRaw("");
   setMessage("نسخه اصلاح‌شده ذخیره شد. برای Re-QA از دکمه پایین استفاده کن.");
  }catch(e){setMessage(e instanceof Error?e.message:"JSON نامعتبر است.");}
 }
 function applyForQA(){
  if(!revised)return;
  if(missing.length){setMessage("پاسخ‌های ضروری تکمیل نشده‌اند.");return;}
  const previous=localStorage.getItem(base+"quality-review:v1");
  if(previous){const snapshots=JSON.parse(localStorage.getItem(base+"qa-history:v1")||"[]");snapshots.push(JSON.parse(previous));localStorage.setItem(base+"qa-history:v1",JSON.stringify(snapshots));}
  localStorage.setItem(base+"creative-package:v1",JSON.stringify(revised));
  localStorage.removeItem(base+"quality-review:v1");
  setMessage("نسخه اصلاح‌شده برای ارزیابی مجدد فعال شد؛ گزارش قبلی در چرخه اصلاح حفظ شده است.");
 }

 return <main dir="rtl" className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900"><div className="mx-auto max-w-3xl space-y-6">
  <header><p className="text-sm font-semibold text-indigo-700">Instagram AI Admin · مرحله پنجم</p><h1 className="mt-2 text-3xl font-bold">Smart Revision · اصلاح هوشمند</h1><p className="mt-3 text-sm text-slate-600">سؤال‌های مرتبط با گزارش QA را همین‌جا پاسخ بده؛ سناریوی اصلاح‌شده و نسخه‌های قبلی در برنامه ذخیره می‌شوند.</p></header>
  {!loaded?<p>در حال بارگذاری...</p>:!qa||!original?<section className="rounded-2xl bg-white p-6"><p>برای شروع، بسته تولید و گزارش QA ذخیره‌شده لازم است.</p><Link href="/quality" className="mt-3 inline-block text-indigo-700 underline">بازگشت به کنترل کیفیت</Link></section>:<>
   <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">۱. رفع ابهام‌ها</h2><p className="mt-2 text-sm text-slate-600">فقط سؤال‌هایی نمایش داده می‌شوند که با ایرادهای این گزارش مرتبط‌اند.</p><div className="mt-5 space-y-5">
    {active.map(q=><div key={q.id}><label htmlFor={"clarify-"+q.id} className="mb-2 block text-sm font-semibold">{q.question} {q.required?<span className="text-red-700">(ضروری)</span>:<span className="text-slate-500">(اختیاری)</span>}</label><textarea id={"clarify-"+q.id} value={answers[q.id]||""} onChange={e=>update(q.id,e.target.value)} rows={2} className="w-full rounded-lg border p-3" placeholder="پاسخ تأییدشده مشتری؛ اطلاعات را حدس نزنید"/></div>)}
    {!active.length&&<p className="text-sm text-slate-600">سؤال مشخصی از گزارش QA استخراج نشد؛ اصلاحات کیفی در پرامپت اعمال می‌شوند.</p>}
    {missing.length>0&&<p className="text-sm text-red-700">برای ادامه، {missing.length} پاسخ ضروری باقی مانده است.</p>}
   </div><div className="mt-5 flex flex-wrap gap-3"><button onClick={persistAnswers} className="rounded-xl border px-5 py-3 font-semibold">ذخیره پاسخ‌ها</button><button disabled={missing.length>0} onClick={copy} className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white disabled:opacity-40">ذخیره و کپی درخواست اصلاح</button></div></section>
   <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">۲. ثبت سناریوی اصلاح‌شده</h2><p className="mt-2 text-sm text-slate-600">در نسخه فعلی بدون API پولی، درخواست اصلاح را کپی و JSON خروجی را اینجا وارد کن. پاسخ‌های فرم دیگر لازم نیست در چت نوشته شوند.</p><textarea dir="ltr" rows={8} value={raw} onChange={e=>setRaw(e.target.value)} className="mt-4 w-full rounded-xl border p-3 font-mono text-xs" placeholder='{"title":"...", "scenes":[...], ...}'/><button disabled={!raw.trim()} onClick={save} className="mt-3 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-40">اعتبارسنجی و ذخیره نسخه اصلاح‌شده</button></section>
   {revised&&<section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">۳. نسخه اصلاح‌شده</h2><p className="mt-3 font-semibold">{revised.title}</p><p className="mt-2 text-sm leading-7">{revised.concept}</p><p className="mt-3 text-sm">تعداد نماها: {revised.scenes.length} · نسخه‌های اصلاح‌شده ذخیره‌شده: {history.length}</p><button onClick={applyForQA} className="mt-5 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">فعال‌سازی نسخه برای Re-QA</button><Link href="/quality" className="mr-4 text-indigo-700 underline">رفتن به QA</Link>{!missing.length&&<Link href="/final-image-prompt" className="mr-4 inline-block rounded-xl border px-4 py-3 text-indigo-700">مرحله ششم: پرامپت نهایی تصویر</Link>}</section>}
   {message&&<p role="status" className="rounded-xl bg-white p-4 text-sm text-indigo-700">{message}</p>}
  </>}
 </div></main>;
}
