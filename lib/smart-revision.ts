import type { QualityReview } from "./quality-review";
export type Answers = { brand: string; filming: "yes"|"no"|"unknown"; players: "yes"|"no"|"unknown"; beginner: "yes"|"no"|"unknown"; contact: "profile"|"dm"|"caption"|"unknown"; profileVerified: boolean; extra: string };
export const defaultAnswers: Answers = {brand:"",filming:"unknown",players:"unknown",beginner:"unknown",contact:"unknown",profileVerified:false,extra:""};
export type QuestionKey = keyof Answers;
export function questionsForReview(review: QualityReview): QuestionKey[] {
 const evidence = [...review.checks.filter(c=>c.status!=="pass").map(c=>c.criterion+" "+c.evidence+" "+c.fix),...review.requiredChanges].join(" ");
 const rules: [QuestionKey,RegExp][] = [
  ["brand",/برند|نام کافه|لوگو|هویت/],
  ["filming",/فیلم.?برداری|تصویربرداری|منابع تولید|امکانات واقعی/],
  ["players",/بازیکن|حضور افراد|چند نفر/],
  ["beginner",/مبتدی|حرفه.?ای|راهنمایی|آموزش/],
  ["contact",/مراجعه|آدرس|نشانی|پروفایل|دایرکت|CTA/],
  ["profileVerified",/پروفایل|آدرس|نشانی|ساعات فعالیت/]
 ];
 const found = rules.filter(([,rx])=>rx.test(evidence)).map(([key])=>key);
 return [...found,"extra"];
}
export function buildRevisionPrompt(profile:unknown,brief:unknown,original:unknown,review:QualityReview,answers:Answers) {
 return ["نقش تو ویراستار ارشد محتوای اینستاگرام است. بسته قبلی را بر اساس QA و پاسخ‌های تأییدشده اصلاح کن؛ نقاط قوت را حفظ کن، جزئیات را اختراع نکن.","فقط JSON معتبر بدون Markdown و با این ساختار بده:",'{"title":"...","concept":"...","visualDirection":"...","scenes":[{"seconds":"0-3","shot":"...","onScreenText":"...","audio":"..."}],"caption":"...","callToAction":"...","productionNotes":["..."],"unknowns":["..."]}',"اگر اطلاعاتی هنوز نامشخص است در unknowns نگه دار. پاسخ profileVerified=false به معنی تأیید نبودن اطلاعات آدرس و ساعات در پروفایل است. ادعای آماده انتشار بودن نکن.","BusinessProfile:",JSON.stringify(profile,null,2),"ContentBrief:",JSON.stringify(brief,null,2),"OriginalCreativePackage:",JSON.stringify(original,null,2),"QualityReview:",JSON.stringify(review,null,2),"VerifiedUserAnswers:",JSON.stringify(answers,null,2)].join("\n\n");
}
