import type { QualityReview } from "./quality-review";
import type { CreativePackage } from "./creative-package";

export type Clarification = { id: string; question: string; required: boolean };
export type ClarificationAnswers = Record<string, string>;
const rules: { id: string; rx: RegExp; question: string; required: boolean }[] = [
 { id:"productType", rx:/مدل دقیق|نوع (واقعی |دقیق )?(بادام|محصول)|ظاهر واقعی|مغز بادام|پوست سخت|خام|شور|بوداده|تطبیق.*محصول/, question:"نام و مدل دقیق محصول موجود چیست؟ (نوع، حجم یا رنگ در صورت نیاز). عکس محصول اختیاری است؛ AI می‌تواند مرجع را جست‌وجو کند.", required:true },
 { id:"responseMethod", rx:/پاسخ.?گویی|بعد از.*کامنت|پس از.*کامنت|روش.*اطلاعات خرید|مسیر.*سفارش|فرایند.*خرید/, question:"پس از کامنت مشتری، اطلاعات خرید را چگونه و توسط چه کسی ارائه می‌کنید؟", required:true },
 { id:"brand", rx:/نام تجاری|نام برند|هویت بصری|لوگو|رنگ سازمانی|پالت رنگی/, question:"نام رسمی برند و در صورت وجود رنگ‌ها یا لوگوی رسمی چیست؟ (اگر ندارید بنویسید ندارم).", required:false },
 { id:"price", rx:/قیمت|واحد فروش|وزن بسته|شرایط پرداخت/, question:"قیمت، واحد فروش یا شرایط خرید تأییدشده‌ای که مایلید اعلام شود چیست؟ (اختیاری)", required:false },
 { id:"delivery", rx:/ارسال|هزینه حمل|سراسر ایران/, question:"شرایط ارسال تأییدشده چیست؟ (اختیاری)", required:false }
];
export function clarificationQuestions(review:QualityReview, pkg?:CreativePackage|null):Clarification[] {
 const issues=[...review.checks.filter(c=>c.status!=="pass").map(c=>c.criterion+" "+c.evidence+" "+c.fix),...review.requiredChanges,...(pkg?.unknowns||[])].join(" ");
 return rules.filter(r=>r.rx.test(issues)).map(({id,question,required})=>({id,question,required}));
}
export function missingRequired(questions:Clarification[], answers:ClarificationAnswers) {
 return questions.filter(q=>q.required && !answers[q.id]?.trim());
}
export function buildClarificationPrompt(profile:unknown,brief:unknown,pkg:unknown,review:QualityReview,questions:Clarification[],answers:ClarificationAnswers) {
 return ["نقش تو ویراستار ارشد محتوا است. ایرادهای QA را با پاسخ‌های تأییدشده مشتری رفع کن. اطلاعات نامشخص را اختراع نکن. قالب محتوا را تغییر نده.",
 "پاسخ را فقط در بلوک کد Markdown با زبان json و با یک شیء JSON معتبر بنویس. کلیدها دقیقاً این‌ها باشند:",
 '{"title":"...","concept":"...","visualDirection":"...","scenes":[{"seconds":"تصویر ثابت","shot":"...","onScreenText":"...","audio":""}],"caption":"...","callToAction":"...","productionNotes":["..."],"unknowns":["..."]}',
 "نبود عکس مشتری مانع ادامه نیست. اگر مرجع تصویری نداریم، در مرحله تولید تصویر AI باید با ابزار جست‌وجوی وب مرجع معتبر همان مدل را پیدا و اعتبارسنجی کند. اگر دسترسی وب وجود ندارد، تصویر بسته‌بندی را جعل نکند و وضعیت نیازمند تأیید مرجع را در unknowns نگه دارد؛ فقط فقدان عکس مشتری را دلیل توقف قرار نده. هر سؤال بدون پاسخ را در unknowns نگه دار. این فقط بسته تولید است، نه مجوز انتشار.",
 "BusinessProfile:",JSON.stringify(profile,null,2),"ContentBrief:",JSON.stringify(brief,null,2),"OriginalCreativePackage:",JSON.stringify(pkg,null,2),"QualityReview:",JSON.stringify(review,null,2),
 "VerifiedClarifications:",JSON.stringify(questions.filter(q=>answers[q.id]?.trim()).map(q=>({question:q.question,answer:answers[q.id]})),null,2)].join("\n\n");
}

import type { Profile } from "./business-profile";
import type { ContentBrief } from "./content-planning";
export const clarificationKey="instagram-ai-admin:clarifications:v1";
export type Decision={mode:"provided"|"delegate";value:string};
export type ClarificationState={fingerprint:string;decisions:Record<string,Decision>};
export type PlanningQuestion={id:string;question:string;hint:string;critical:boolean};
export function fingerprint(profile:Profile,brief:ContentBrief){
 return JSON.stringify([profile.businessType,profile.description,profile.products,profile.audience,profile.market,profile.goal,brief.format]);
}
export function questionsFor(_profile:Profile,_brief:ContentBrief):PlanningQuestion[]{
 return [
 {id:"product",question:"کدام محصول مشخص معرفی شود؟",hint:"نام محصول را بنویسید یا انتخاب را به AI بسپارید.",critical:true},
 {id:"availability",question:"آیا محصول انتخابی واقعاً برای فروش موجود است؟",hint:"موجودی را صریحاً تأیید یا رد کنید؛ واگذاری به AI مجاز نیست.",critical:true},
 {id:"visual",question:"تصویر یا مرجع معتبر برای سوژه اصلی دارید؟",hint:"اختیاری؛ اگر ندارید، جست‌وجو و انتخاب مرجع را به AI بسپارید.",critical:false},
 {id:"action",question:"مخاطب دقیقاً چگونه اقدام یا سفارش ثبت کند؟",hint:"روش اقدام را مشخص کنید یا پیشنهاد آن را به AI بسپارید.",critical:true}
 ];
}
export function decisionReady(q:PlanningQuestion,d?:Decision){
 if(!d)return false;
 if(d.mode==="provided")return !!d.value.trim();
 return d.mode==="delegate"&&q.id!=="availability";
}
export function unresolved(qs:PlanningQuestion[],ds:Record<string,Decision>){
 return qs.filter(q=>q.critical&&!decisionReady(q,ds[q.id]));
}
export function decisionInstructions(qs:PlanningQuestion[],ds:Record<string,Decision>){
 return qs.map(q=>q.question+" پاسخ مشتری: "+(ds[q.id]?.mode==="provided"?ds[q.id].value:ds[q.id]?.mode==="delegate"?"انتخاب به AI واگذار شده؛ پیشنهاد را واقعیت تأییدشده فرض نکن.":"نامشخص")).join("\n");
}
