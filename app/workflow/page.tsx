"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {workflowKey,type WorkflowState} from "../../lib/workflow";
export default function WorkflowPage(){
 const [state,setState]=useState<WorkflowState|null>(null);
 useEffect(()=>{try{const raw=sessionStorage.getItem(workflowKey);if(raw)setState(JSON.parse(raw));}catch{}},[]);
 function start(){
  if(!localStorage.getItem("instagram-ai-admin:business-profile:v1")){setState({active:false,stage:"planning",updatedAt:Date.now(),error:"ابتدا پروفایل برند را ثبت کنید."});return;}
  if(!localStorage.getItem("instagram-ai-admin:post-intent:v1")){window.location.assign("/planning");return;}
  ["planning","production","quality"].forEach(s=>sessionStorage.removeItem("instagram-ai-admin:workflow-"+s+"-started"));
  const next:WorkflowState={active:true,stage:"planning",updatedAt:Date.now()};
  sessionStorage.setItem(workflowKey,JSON.stringify(next));window.location.assign("/planning?auto=1");
 }
 function stop(){sessionStorage.removeItem(workflowKey);setState(null);}
 return <main dir="rtl" className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-2xl space-y-5">
 <h1 className="text-3xl font-bold">گردش‌کار هوشمند تولید محتوا</h1>
 <p className="leading-8 text-slate-600">از برنامه‌ریزی تا تولید، کنترل کیفیت و پرامپت نهایی. هر مرحله فقط پس از دریافت پاسخ معتبر ادامه پیدا می‌کند؛ تأیید اطلاعات تجاری همچنان با شماست.</p>
 <section className="rounded-2xl bg-white p-6 shadow-sm"><p>وضعیت: {state?.active?"در حال اجرا":state?.error||"آماده شروع"}</p>
 <div className="mt-5 flex flex-wrap gap-3"><button onClick={start} className="rounded-xl bg-indigo-700 px-5 py-3 font-bold text-white">شروع گردش‌کار خودکار</button><button onClick={stop} className="rounded-xl border px-5 py-3">لغو</button></div></section>
 <Link href="/business" className="text-indigo-700 underline">ویرایش پروفایل برند</Link>
 </div></main>;
}
