"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { emptyProfile, type Profile } from "../../lib/business-profile";

const prefix = "instagram-ai-admin:";
const storageKey = prefix + "business-profile:v1";
const options = {
  businessType: ["کافه و رستوران", "فروشگاه", "خدمات", "تولیدکننده", "آموزش", "زیبایی و سلامت", "سایر"],
  goal: ["افزایش فروش", "افزایش مراجعه حضوری", "افزایش آگاهی از برند", "جذب مشتری از دایرکت", "افزایش تعامل"],
  audience: ["نوجوانان", "جوانان", "بزرگسالان", "خانواده‌ها", "کسب‌وکارها", "عموم مردم"],
  market: ["محلی", "در سطح شهر", "سراسر ایران", "بین‌المللی"],
  visualStyle: ["مینیمال", "مدرن", "لوکس", "سنتی", "رنگارنگ", "روشن و ساده", "تیره و جدی", "انتخاب با AI"],
  brandVoice: ["صمیمی", "رسمی", "محترمانه و روان", "شوخ و سرگرم‌کننده", "انتخاب با AI"],
  conversionPath: ["دایرکت اینستاگرام", "مراجعه حضوری", "وب‌سایت", "تماس تلفنی", "واتساپ"],
  resources: ["عکس واقعی", "ویدیو", "لوگو", "فعلاً تصویر ندارم"],
} as const;
type OptionKey = keyof typeof options;
const multi = new Set<OptionKey>(["audience", "visualStyle", "conversionPath", "resources"]);
const labels: Record<OptionKey,string> = {
 businessType:"نوع کسب‌وکار",goal:"هدف اصلی اینستاگرام",audience:"مخاطبان",market:"محدوده فعالیت",
 visualStyle:"سبک بصری",brandVoice:"لحن محتوا",conversionPath:"راه ارتباط یا خرید",resources:"منابع تصویری",
};
const detailFields: {key:keyof Profile;label:string;placeholder:string}[] = [
 {key:"differentiator",label:"مزیت رقابتی",placeholder:"اگر مزیت مشخصی ندارید، خالی بگذارید"},
 {key:"brandPromise",label:"وعده برند",placeholder:"فقط وعده‌های واقعی و قابل اثبات"},
 {key:"customerProblem",label:"نیاز مشتری",placeholder:"چه مشکلی را حل می‌کنید؟"},
 {key:"customerMotivation",label:"انگیزه مشتری",placeholder:"چه چیزی او را به خرید ترغیب می‌کند؟"},
 {key:"competitors",label:"رقبا",placeholder:"اختیاری"},
 {key:"brandPersonality",label:"شخصیت برند",placeholder:"مثلاً صمیمی و حرفه‌ای"},
 {key:"contentPillars",label:"موضوعات محتوایی",placeholder:"مثلاً معرفی محصول، آموزش، پشت صحنه"},
 {key:"brandBoundaries",label:"محدودیت‌های برند",placeholder:"مثلاً نمایش ندادن چهره مشتری"},
];
function splitValues(value:string){return value.split(/\s*،\s*/).map(v=>v.trim()).filter(Boolean);}
export default function BusinessPage(){
 const [profile,setProfile]=useState<Profile>(emptyProfile);
 const [loaded,setLoaded]=useState(false);
 const [saved,setSaved]=useState(false);
 const [details,setDetails]=useState(false);
 const [custom,setCustom]=useState<Partial<Record<OptionKey,boolean>>>({});
 useEffect(()=>{
  try{const raw=localStorage.getItem(storageKey);if(raw){const parsed=JSON.parse(raw);if(parsed.profile)setProfile({...emptyProfile,...parsed.profile});}}catch{}
  setLoaded(true);
 },[]);
 function update(key:keyof Profile,value:string){setProfile(p=>({...p,[key]:value}));setSaved(false);}
 function select(key:OptionKey,value:string){
  if(value==="سایر"){setCustom(c=>({...c,[key]:true}));update(key,"");return;}
  if(multi.has(key)){
   const current=splitValues(profile[key]);
   update(key,(current.includes(value)?current.filter(x=>x!==value):[...current,value]).join("، "));
  }else update(key,profile[key]===value?"":value);
 }
 function save(){
  if(!profile.brandName.trim()||!profile.businessType.trim()||!profile.products.trim()||!profile.goal.trim()){
   setSaved(false);return;
  }
  const next={...profile,description:profile.description.trim()||[profile.brandName,profile.businessType,profile.products].filter(Boolean).join("، ")};
  try{
   const previous=localStorage.getItem(storageKey);
   const changed=!previous||JSON.stringify(JSON.parse(previous).profile)!==JSON.stringify(next);
   localStorage.setItem(storageKey,JSON.stringify({profile:next,stage:"review"}));
   if(changed){
    for(const name of ["content-brief:v1","creative-package:v1","quality-review:v1","revised-package:v1","revision-answers:v1","final-image-prompt:v1"]){
     localStorage.removeItem(prefix+name);
    }
    sessionStorage.removeItem(prefix+"final-image-sent:v1");
    sessionStorage.removeItem(prefix+"workflow:v1");
   }
   setProfile(next);setSaved(true);
  }catch{setSaved(false);}
 }
 if(!loaded)return <main dir="rtl" className="p-8">در حال بارگذاری...</main>;
 const valid=!!(profile.brandName.trim()&&profile.businessType.trim()&&profile.products.trim()&&profile.goal.trim());
 const field=(key:OptionKey)=>(
  <div key={key} className="space-y-2">
   <label className="block text-sm font-semibold">{labels[key]} {["businessType","goal"].includes(key)&&<span className="text-rose-600">*</span>}</label>
   <div className="flex flex-wrap gap-2">{options[key].map(option=>{
    const selected=multi.has(key)?splitValues(profile[key]).includes(option):profile[key]===option;
    return <button key={option} type="button" aria-pressed={selected} onClick={()=>select(key,option)}
     className={`rounded-xl border px-3 py-2 text-sm transition-colors ${selected?"border-indigo-700 bg-indigo-700 text-white":"border-slate-300 bg-white hover:border-indigo-400"}`}>{option}</button>;
   })}</div>
   {(custom[key]||!!profile[key]&&!splitValues(profile[key]).every(v=>(options[key] as readonly string[]).includes(v)))&&
    <input aria-label={"توضیح "+labels[key]} value={profile[key]} onChange={e=>update(key,e.target.value)}
     placeholder="توضیح دلخواه" className="w-full rounded-xl border border-slate-300 p-3 text-sm"/>}
  </div>
 );
 return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
  <div className="mx-auto max-w-3xl space-y-5">
   <header><p className="text-sm font-semibold text-indigo-700">Instagram AI Admin</p>
    <h1 className="mt-2 text-3xl font-bold">معرفی کسب‌وکار</h1>
    <p className="mt-2 text-sm text-slate-600">همه اطلاعات در یک صفحه؛ گزینه‌ها را انتخاب کن و ذخیره کن. موارد اختیاری را می‌توانی خالی بگذاری.</p></header>
   <section className="space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
    <div className="grid gap-5 sm:grid-cols-2">
     <div><label htmlFor="brand" className="mb-2 block text-sm font-semibold">نام کسب‌وکار <span className="text-rose-600">*</span></label>
      <input id="brand" value={profile.brandName} onChange={e=>update("brandName",e.target.value)} placeholder="مثلاً مهره" className="w-full rounded-xl border border-slate-300 p-3"/></div>
     <div><label htmlFor="products" className="mb-2 block text-sm font-semibold">چه محصول یا خدماتی ارائه می‌کنی؟ <span className="text-rose-600">*</span></label>
      <input id="products" value={profile.products} onChange={e=>update("products",e.target.value)} placeholder="مثلاً بازی رومیزی و نوشیدنی" className="w-full rounded-xl border border-slate-300 p-3"/></div>
    </div>
    {field("businessType")}
    {field("goal")}
    {field("audience")}
    {field("market")}
    <div><label htmlFor="city" className="mb-2 block text-sm font-semibold">شهر یا بازار هدف (اختیاری)</label>
     <input id="city" value={profile.description} onChange={e=>update("description",e.target.value)} placeholder="مثلاً شهر بافق؛ یا یک توضیح کوتاه درباره کسب‌وکار" className="w-full rounded-xl border border-slate-300 p-3"/></div>
    {field("visualStyle")}
    {field("brandVoice")}
    {field("conversionPath")}
    {field("resources")}
    <div className="border-t pt-4"><button type="button" onClick={()=>setDetails(v=>!v)} className="text-sm font-semibold text-indigo-700">
     {details?"بستن جزئیات تکمیلی −":"جزئیات تکمیلی (اختیاری) +"}
    </button>
     {details&&<div className="mt-4 grid gap-4 sm:grid-cols-2">{detailFields.map(item=><div key={item.key}>
      <label className="mb-2 block text-sm font-medium">{item.label}</label>
      <input value={profile[item.key]} onChange={e=>update(item.key,e.target.value)} placeholder={item.placeholder} className="w-full rounded-xl border border-slate-300 p-3 text-sm"/>
     </div>)}</div>}
    </div>
    <div className="border-t pt-5">
     <button onClick={save} disabled={!valid} className="w-full rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white disabled:opacity-40">ذخیره اطلاعات کسب‌وکار</button>
     {!valid&&<p className="mt-2 text-xs text-amber-700">نام، نوع کسب‌وکار، محصول یا خدمات و هدف اینستاگرام الزامی‌اند.</p>}
     {saved&&<div className="mt-4 space-y-3"><p role="status" className="text-sm font-semibold text-emerald-700">اطلاعات ذخیره شد. خروجی‌های قبلی در صورت تغییر کسب‌وکار پاک شده‌اند.</p>
      <Link href="/planning" className="block rounded-xl bg-emerald-700 px-5 py-3 text-center font-semibold text-white">مرحله بعد: برنامه‌ریزی پست</Link></div>}
    </div>
   </section>
  </div>
 </main>;
}
