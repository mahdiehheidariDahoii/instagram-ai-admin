"use client";
import Link from "next/link";
import {workflow,workflowKey} from "../../lib/workflow";
import { useEffect, useState } from "react";
import { buildImagePrompt, type ImagePromptDraft } from "../../lib/final-image-prompt";
import { parseCreativePackage, type CreativePackage } from "../../lib/creative-package";
import type { ContentBrief } from "../../lib/content-planning";
import type { Profile } from "../../lib/business-profile";
import { parseQualityReview } from "../../lib/quality-review";
const prefix = "instagram-ai-admin:";
const key = prefix + "final-image-prompt:v1";
const bridgeChannel = "INSTAGRAM_AI_ADMIN_BRIDGE_V1";
const sentKey = prefix + "final-image-sent:v1";
export default function FinalImagePromptPage() {
 const [pkg,setPkg]=useState<CreativePackage|null>(null);
 const [brief,setBrief]=useState<ContentBrief|null>(null);
 const [profile,setProfile]=useState<Profile|null>(null);
 const [brand,setBrand]=useState("");
 const [draft,setDraft]=useState<ImagePromptDraft|null>(null);
 const [message,setMessage]=useState("");
 const [ready,setReady]=useState(false);
 const [sending,setSending]=useState(false);
 const [blocked,setBlocked]=useState<string[]>([]);
 useEffect(()=>{
  try {
   const r=localStorage.getItem(prefix+"revised-package:v1");
   const o=localStorage.getItem(prefix+"creative-package:v1");
   const b=localStorage.getItem(prefix+"content-brief:v1");
   const p=localStorage.getItem(prefix+"business-profile:v1");
   const d=localStorage.getItem(key);
   const loadedPackage=r||o ? parseCreativePackage(r||o||"") : null;
   if(loadedPackage)setPkg(loadedPackage);
   const loadedBrief=b ? JSON.parse(b) as ContentBrief : null;
   const loadedProfile=p ? JSON.parse(p).profile as Profile : null;
   if(loadedBrief)setBrief(loadedBrief);
   if(loadedProfile)setProfile(loadedProfile);
   const confirmedBrand=loadedProfile?.brandName || "";
   setBrand(confirmedBrand);
   if(d)setDraft(JSON.parse(d));
   // Revision is temporarily disabled. Keep QA feedback visible, but
   // do not route through the removed revision stage.
   const blockers:string[]=[];
   setBlocked(blockers);
   if(loadedPackage&&loadedBrief&&loadedProfile&&loadedBrief.format==="single-image"&&!blockers.length&&!d){
     const generated=buildImagePrompt(loadedPackage,loadedBrief,loadedProfile,confirmedBrand);
     localStorage.setItem(key,JSON.stringify(generated));
     setDraft(generated);
   }
   const flow=workflow();

  }catch{setMessage("اطلاعات ذخیره‌شده نامعتبر است.");}
  setReady(true);
 },[]);
 useEffect(()=>{
  if(!ready||!draft||blocked.length||brief?.format!=="single-image")return;
  const flow=workflow();
  if(!flow?.active||flow.stage!=="final"||sessionStorage.getItem(sentKey)==="1")return;
  sendToChatGPT(draft.prompt);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[ready,draft,blocked,brief]);
 function sendToChatGPT(prompt:string){
  if(!prompt.trim()||sending)return;
  const requestId=crypto.randomUUID();
  setSending(true);
  setMessage("در حال ارسال پرامپت نهایی برای تولید تصویر به ChatGPT...");
  let finished=false;
  const timeout=window.setTimeout(()=>{
   if(finished)return;
   finished=true;
   window.removeEventListener("message",handle);
   setSending(false);
   setMessage("تأیید ارسال از افزونه دریافت نشد. وضعیت تب ChatGPT را بررسی کن؛ برای جلوگیری از ارسال تکراری، ارسال مجدد فقط دستی است.");
  },30000);
  const handle=(event:MessageEvent)=>{
   if(event.source!==window||event.origin!==location.origin)return;
   const data=event.data;
   if(data?.channel!==bridgeChannel||data.type!=="RESPONSE"||data.requestId!==requestId||finished)return;
   finished=true;
   window.clearTimeout(timeout);
   window.removeEventListener("message",handle);
   setSending(false);
   if(!data.ok){setMessage("ارسال پرامپت ناموفق بود: "+(data.error||"خطای افزونه"));return;}
   if(!data.autoSent){setMessage("پرامپت به ChatGPT منتقل شد، اما ارسال پیام تأیید نشد. تب ChatGPT را بررسی کن.");return;}
   sessionStorage.setItem(sentKey,"1");
   const flow=workflow();
   if(flow?.active&&flow.stage==="final")sessionStorage.setItem(workflowKey,JSON.stringify({...flow,active:false,updatedAt:Date.now()}));
   setMessage("پرامپت نهایی به ChatGPT ارسال شد. تولید تصویر در ChatGPT انجام می‌شود؛ خروجی تصویر هنوز تأیید نشده است.");
  };
  window.addEventListener("message",handle);
  window.postMessage({channel:bridgeChannel,type:"DRAFT_CHATGPT",requestId,
   payload:{task:"final-image-generation",project:"Instagram AI Admin"},
   prompt,autoSend:true},location.origin);
 }
 function generate(){
  if(!pkg||!brief||!profile)return;
  if(blocked.length){setMessage("ابتدا پاسخ‌های ضروری را در مرحله اصلاح تکمیل کن.");return;}
  try {const next=buildImagePrompt(pkg,brief,profile,brand);setDraft(next);localStorage.setItem(key,JSON.stringify(next));setMessage("پرامپت ساخته و ذخیره شد.");}
  catch(e){setMessage(e instanceof Error?e.message:"خطا در ساخت پرامپت");}
 }
 function edit(prompt:string){if(!draft)return;const next={...draft,prompt};setDraft(next);localStorage.setItem(key,JSON.stringify(next));}
 async function copy(value:string,label:string){try{await navigator.clipboard.writeText(value);setMessage(label+" کپی شد.");}catch{setMessage("کپی ناموفق بود؛ مجوز Clipboard را بررسی کن.");}}
 return <main dir="rtl" className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900"><div className="mx-auto max-w-3xl space-y-6">
 <header><p className="text-sm font-semibold text-indigo-700">Instagram AI Admin · مرحله ششم</p><h1 className="mt-2 text-3xl font-bold">Final Image Prompt</h1><p className="mt-3 text-sm text-slate-600">پرامپت نهایی به‌محض آماده‌بودن داده‌های معتبر، خودکار ساخته و ذخیره می‌شود.</p></header>
 {!ready?<p>در حال بارگذاری...</p>:!pkg||!brief||!profile?<section className="rounded-2xl bg-white p-6">ابتدا بسته تولید را ذخیره کن. <Link href="/production" className="text-indigo-700 underline">بازگشت به تولید</Link></section>:<>
 {blocked.length>0&&<section className="rounded-2xl border border-amber-300 bg-amber-50 p-5"><p className="font-bold">تولید تصویر تا رفع ابهام‌های ضروری متوقف است.</p><ul className="mt-2 list-disc pr-5 text-sm">{blocked.map(x=><li key={x}>{x}</li>)}</ul><Link href="/production" className="mt-3 inline-block text-indigo-700 underline">بازگشت به تولید</Link></section>}
 <section className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm">قالب: {brief.format} · {pkg.title}</p><label htmlFor="brand" className="mt-4 block font-semibold">نام برند تأییدشده</label><input id="brand" value={brand} onChange={e=>setBrand(e.target.value)} className="mt-2 w-full rounded-xl border p-3" placeholder="اختیاری؛ فقط نام تأییدشده"/><p className="mt-4 text-sm text-slate-600">تهیه و اعتبارسنجی تصویر محصول کاملاً بر عهده AI دریافت‌کننده پرامپت است. برنامه هیچ عکس یا لینک مرجعی درخواست، ذخیره یا ارسال نمی‌کند. AI در صورت امکان عکس واقعی را با ابزارهای خودش پیدا و استفاده می‌کند؛ اگر انتقال عکس ممکن نبود، باید تصویر تبلیغاتی را با المان گرافیکی عمومی و بدون جعل بسته‌بندی واقعی تولید کند، نه اینکه کار را متوقف کند.</p><button onClick={generate} disabled={brief.format!=="single-image"||blocked.length>0} className="mt-4 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white disabled:opacity-40">بازسازی پرامپت نهایی</button>{brief.format!=="single-image"&&<p className="mt-2 text-sm text-amber-700">این نسخه فقط پست تک‌تصویری را پشتیبانی می‌کند.</p>}</section>
 {draft&&!blocked.length&&<section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">پرامپت قابل ویرایش</h2><p className="mt-2 text-xs text-amber-800">بازسازی پرامپت، ویرایش‌های دستی فعلی را جایگزین می‌کند.</p><textarea aria-label="پرامپت نهایی تصویر" dir="ltr" rows={22} value={draft.prompt} onChange={e=>edit(e.target.value)} className="mt-4 w-full rounded-xl border p-4 font-mono text-sm leading-6"/><button onClick={()=>sendToChatGPT(draft.prompt)} disabled={sending||!draft.prompt.trim()} className="mt-4 ml-3 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white disabled:opacity-40">{sending?"در حال ارسال...":"ارسال پرامپت به ChatGPT"}</button><button onClick={()=>copy(draft.prompt,"پرامپت تصویر")} disabled={!draft.prompt.trim()} className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-40">کپی پرامپت تصویر</button><h3 className="mt-6 font-bold">کپشن جداگانه</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{draft.caption}</p><button onClick={()=>copy(draft.caption,"کپشن")} className="mt-3 rounded-xl border px-4 py-2 text-sm">کپی کپشن</button><h3 className="mt-6 font-bold">موارد نامشخص</h3><ul className="mt-2 list-inside list-disc text-sm leading-7">{draft.unknowns.map((x,i)=><li key={i}>{x}</li>)}</ul><p className="mt-5 text-xs text-amber-800">این خروجی تصویر نهایی نیست و پس از تولید باید کنترل کیفیت شود.</p></section>}
 {message&&<p role="status" className="rounded-xl bg-white p-4 text-sm text-indigo-700">{message}</p>}
 </>}
 </div></main>;
}
