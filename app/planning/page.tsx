"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {emptyProfile,type Profile} from "../../lib/business-profile";
import {createContentBrief,type ContentBrief} from "../../lib/content-planning";
import {parseAiBrief} from "../../lib/ai-brief-import";
import {clarificationKey,fingerprint,type ClarificationState} from "../../lib/clarification";
import {workflowKey,type WorkflowState,advance} from "../../lib/workflow";

const prefix="instagram-ai-admin:";
const intentKey=prefix+"post-intent:v1";
const briefKey=prefix+"content-brief:v1";
const bridgeChannel="INSTAGRAM_AI_ADMIN_BRIDGE_V1";
type Intent={goal:string;topic:string;format:ContentBrief["format"];action:string};
const initial:Intent={goal:"",topic:"",format:"single-image",action:""};
const goals=["معرفی کسب‌وکار","معرفی محصول یا خدمت","افزایش فروش","افزایش مراجعه حضوری","آموزش","افزایش تعامل","اعتمادسازی"];
const actions=["ارسال دایرکت","ثبت کامنت","مراجعه حضوری","خرید یا سفارش","دنبال کردن صفحه","انتخاب با AI"];
export default function PlanningPage(){
 const [profile,setProfile]=useState<Profile|null>(null);
 const [intent,setIntent]=useState<Intent>(initial);
 const [loaded,setLoaded]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [brief,setBrief]=useState<ContentBrief|null>(null);
 const requestRef=useRef("");
 const startedRef=useRef(false);
 const busyRef=useRef(false);
 useEffect(()=>{
  try{
   const p=JSON.parse(localStorage.getItem(prefix+"business-profile:v1")||"null");
   if(p?.profile)setProfile({...emptyProfile,...p.profile});
   const saved=JSON.parse(localStorage.getItem(intentKey)||"null");
   if(saved?.goal&&saved?.format)setIntent({...initial,...saved});
  }catch{setError("اطلاعات ذخیره‌شده معتبر نیست.");}
  setLoaded(true);
 },[]);
 const ready=!!(profile&&intent.goal&&intent.action);
 function update(key:keyof Intent,value:string){setIntent(p=>({...p,[key]:value}));setError("");}
 function request(profileValue:Profile,intentValue:Intent){
  return [
   "تو استراتژیست ارشد محتوای اینستاگرام هستی. فقط برای پست بعدی این کسب‌وکار یک برنامه مشخص و قابل اجرا تهیه کن.",
   "انتخاب‌های کاربر در PostIntent قطعی‌اند؛ هدف، قالب و مسیر اقدام را تغییر نده. اگر موضوع خالی است، موضوع مناسب پیشنهاد بده.",
   "واقعیت، قیمت، موجودی، آدرس، تخفیف، محصول، ویژگی یا لوگوی تأییدنشده اختراع نکن. برای کسب‌وکار خدماتی سؤال موجودی محصول مطرح نکن.",
   "پاسخ فقط یک بلوک کد Markdown با زبان json باشد (شروع با ```json و پایان با ```). هیچ توضیحی بیرون آن ننویس.",
   '{"objective":"...","audience":"...","topic":"...","format":"single-image","message":"...","callToAction":"...","rationale":["..."],"assumptions":["..."]}',
   "format دقیقاً برابر PostIntent.format باشد و یکی از single-image, carousel, reel است. objective مطابق هدف انتخابی و callToAction مطابق اقدام انتخابی باشد.",
   "BusinessProfile:",JSON.stringify(profileValue,null,2),
   "PostIntent:",JSON.stringify(intentValue,null,2)
  ].join("\n\n");
 }
 function start(){
  if(!profile||!intent.goal||!intent.action||busyRef.current)return;
  busyRef.current=true;startedRef.current=true;
  setBusy(true);setError("");setMessage("در حال ارسال درخواست برنامه‌ریزی به ChatGPT...");
  localStorage.setItem(intentKey,JSON.stringify(intent));
  for(const key of ["content-brief:v1","creative-package:v1","quality-review:v1","revised-package:v1","final-image-prompt:v1"]){localStorage.removeItem(prefix+key);}
  localStorage.removeItem(briefKey+":source");
  sessionStorage.removeItem(prefix+"final-image-sent:v1");
  ["planning","production","quality"].forEach(s=>sessionStorage.removeItem(prefix+"workflow-"+s+"-started"));
  const flow:WorkflowState={active:true,stage:"planning",updatedAt:Date.now()};
  sessionStorage.setItem(workflowKey,JSON.stringify(flow));
  const id=crypto.randomUUID();
  requestRef.current=id;
  sessionStorage.setItem(prefix+"planning-bridge-id",id);
  window.postMessage({channel:bridgeChannel,type:"DRAFT_CHATGPT",requestId:id,
   payload:{task:"content-brief",project:"Instagram AI Admin"},
   prompt:request(profile,intent),responseKind:"brief",autoSend:true},location.origin);
 }
 useEffect(()=>{
  if(!busy)return;
  const id=requestRef.current;
  let previous="";let stable=0;
  const handle=(event:MessageEvent)=>{
   if(event.source!==window||event.origin!==location.origin)return;
   const data=event.data;
   if(data?.channel!==bridgeChannel||data.type!=="RESPONSE")return;
   if(data.requestId===id&&!data.ok){cleanup();busyRef.current=false;setBusy(false);setError(data.error||"خطای افزونه ChatGPT Bridge");return;}
   if(data.requestId===id&&data.ok&&data.drafted)setMessage("درخواست به ChatGPT ارسال شد؛ منتظر پاسخ معتبر هستیم...");
   if(data.originalRequestId!==id)return;
   if(data.pending){setMessage("منتظر پاسخ ChatGPT: "+(data.error||"در حال تولید"));return;}
   if(data.ok===false){setMessage("مشکل دریافت پاسخ: "+(data.error||"نامشخص"));return;}
   if(!data.captured||typeof data.text!=="string")return;
   try{
    const parsed=parseAiBrief(data.text);
    if(parsed.format!==intent.format){setMessage("پاسخ دریافت شد اما قالب انتخابی رعایت نشده است.");return;}
    if(data.text===previous)stable++;else{previous=data.text;stable=1;}
    if(stable<2)return;
    localStorage.setItem(briefKey,JSON.stringify(parsed));
    localStorage.setItem(briefKey+":source","chatgpt");
    const state:ClarificationState={fingerprint:fingerprint(profile!,parsed),decisions:{}};
    localStorage.setItem(clarificationKey,JSON.stringify(state));
    setBrief(parsed);setMessage("برنامه تأیید شد؛ ورود به مرحله تولید...");
    cleanup();busyRef.current=false;setBusy(false);advance("planning","production");
   }catch(cause){setMessage("پاسخ هنوز JSON معتبر نیست: "+(cause instanceof Error?cause.message:"خطا"));}
  };
  const poll=()=>window.postMessage({channel:bridgeChannel,type:"CAPTURE_RESPONSE",requestId:crypto.randomUUID(),auto:true},location.origin);
  const timer=window.setInterval(poll,3000);
  const cleanup=()=>{window.clearInterval(timer);window.removeEventListener("message",handle);};
  window.addEventListener("message",handle);
  return cleanup;
 },[busy,intent.format,profile]);
 useEffect(()=>{
  if(!loaded||!profile||!ready||startedRef.current)return;
  if(new URLSearchParams(location.search).get("auto")==="1"){
   startedRef.current=true;start();
  }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[loaded,profile,ready]);
 if(!loaded)return <main dir="rtl" className="p-8">در حال بارگذاری...</main>;
 return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
  <div className="mx-auto max-w-2xl space-y-5">
   <header><p className="text-sm font-semibold text-indigo-700">Instagram AI Admin · مرحله دوم</p>
    <h1 className="mt-2 text-3xl font-bold">برنامه پست بعدی</h1>
    <p className="mt-2 text-sm text-slate-600">هدف این پست را مشخص کن؛ پس از تأیید، تمام مراحل تولید به‌صورت خودکار اجرا می‌شوند.</p></header>
   {!profile?<section className="rounded-2xl bg-white p-6"><p>ابتدا کسب‌وکار را معرفی کن.</p><Link href="/business" className="mt-3 inline-block text-indigo-700 underline">رفتن به Business</Link></section>:
   <section className="space-y-7 rounded-2xl bg-white p-6 shadow-sm">
    <div className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{profile.brandName||"کسب‌وکار"}</strong><p className="mt-1 text-slate-600">{profile.products}</p><Link href="/business" className="mt-2 inline-block text-indigo-700 underline">ویرایش کسب‌وکار</Link></div>
    <div><label className="mb-3 block font-semibold">۱. هدف اصلی این پست چیست؟ *</label>
     <div className="flex flex-wrap gap-2">{goals.map(x=><button key={x} onClick={()=>update("goal",x)} aria-pressed={intent.goal===x} className={`rounded-xl border px-3 py-2 text-sm ${intent.goal===x?"border-indigo-700 bg-indigo-700 text-white":"border-slate-300"}`}>{x}</button>)}</div></div>
    <div><label htmlFor="topic" className="mb-2 block font-semibold">۲. موضوع مشخصی در نظر داری؟</label>
     <input id="topic" value={intent.topic} onChange={e=>update("topic",e.target.value)} placeholder="اختیاری؛ خالی بگذار تا AI انتخاب کند" className="w-full rounded-xl border border-slate-300 p-3"/></div>
    <div><label htmlFor="format" className="mb-2 block font-semibold">۳. قالب پست چیست؟</label>
     <select id="format" value={intent.format} onChange={e=>update("format",e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white p-3"><option value="single-image">پست تک‌تصویری</option><option value="carousel">کاروسل</option><option value="reel">ریلز</option></select>
     {intent.format!=="single-image"&&<p className="mt-2 text-xs text-amber-700">تولید تصویر نهایی فعلاً فقط برای پست تک‌تصویری پیاده‌سازی شده است.</p>}</div>
    <div><label className="mb-3 block font-semibold">۴. مخاطب بعد از دیدن پست چه کاری انجام دهد؟ *</label>
     <div className="flex flex-wrap gap-2">{actions.map(x=><button key={x} onClick={()=>update("action",x)} aria-pressed={intent.action===x} className={`rounded-xl border px-3 py-2 text-sm ${intent.action===x?"border-indigo-700 bg-indigo-700 text-white":"border-slate-300"}`}>{x}</button>)}</div></div>
    <div className="border-t pt-5">
     <button disabled={!ready||busy} onClick={start} className="w-full rounded-xl bg-indigo-700 px-5 py-4 font-semibold text-white disabled:opacity-40">{busy?"در حال اجرای برنامه‌ریزی...":"تأیید و شروع تولید خودکار"}</button>
     {message&&<p role="status" className="mt-3 text-sm text-indigo-700">{message}</p>}
     {error&&<p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
     {brief&&<p className="mt-3 text-sm text-emerald-700">موضوع پیشنهادی: {brief.topic}</p>}
     <p className="mt-3 text-xs text-slate-500">برای اجرا، افزونه ChatGPT Bridge باید فعال باشد و ChatGPT در مرورگر قابل دسترسی باشد.</p>
    </div>
   </section>}
  </div>
 </main>;
}
