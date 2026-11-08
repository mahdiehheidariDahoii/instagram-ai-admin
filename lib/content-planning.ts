import type { Profile } from "./business-profile";

export type ContentBrief = {
  version: 1;
  objective: string;
  audience: string;
  topic: string;
  format: "single-image" | "carousel" | "reel";
  message: string;
  callToAction: string;
  rationale: string[];
  assumptions: string[];
  status: "draft";
};

export function createContentBrief(profile: Profile): ContentBrief {
  const business = profile.businessType.trim() || "این کسب‌وکار";
  const offering = profile.products.trim() || "محصولات یا خدمات کسب‌وکار";
  const audience = profile.audience.trim() || "مخاطبان بالقوه کسب‌وکار";
  const goal = profile.goal.trim();
  const isGrowth = /فالو|رشد|آگاهی|شناخت/.test(goal);
  const isSales = /فروش|سفارش|خرید/.test(goal);
  const objective = isGrowth ? "آشنایی مخاطب جدید با برند" : isSales ? "ایجاد علاقه و اعتماد اولیه برای خرید" : "معرفی کسب‌وکار و ایجاد آگاهی اولیه";
  const format: ContentBrief["format"] = "single-image";
  const topic = `معرفی ${business} و ${offering}`;
  const message = `این کسب‌وکار در زمینه ${offering} فعالیت می‌کند و می‌تواند برای ${audience} مرتبط باشد.`;
  const callToAction = isGrowth ? "برای آشنایی با محتوای بعدی صفحه را دنبال کنید." : "برای آشنایی بیشتر با محصولات یا خدمات، صفحه را دنبال کنید.";
  const rationale = [
    "برای اولین خروجی، معرفی روشن کسب‌وکار کم‌ریسک‌تر از ادعاهای تبلیغاتی تأییدنشده است.",
    "قالب تک‌تصویر برای آزمایش چرخه تولید و کنترل کیفیت ساده‌تر از ریلز یا کاروسل است.",
    goal ? `هدف ثبت‌شده کسب‌وکار: ${goal}` : "هدف دقیق ثبت نشده؛ معرفی اولیه به‌عنوان نقطه شروع انتخاب شد.",
  ];
  const assumptions = [
    ...(!profile.businessType.trim() ? ["نوع کسب‌وکار مشخص نیست؛ موضوع نیازمند بازبینی است."] : []),
    ...(!profile.products.trim() ? ["محصول یا خدمت دقیق مشخص نیست؛ پیش از انتشار باید تکمیل شود."] : []),
    ...(!profile.audience.trim() ? ["مخاطب دقیق ثبت نشده است؛ مخاطب بالقوه به‌صورت عمومی در نظر گرفته شد."] : []),
    ...(!profile.goal.trim() ? ["هدف مشخص نشده؛ هدف پیش‌فرض معرفی اولیه است."] : []),
  ];
  return { version: 1, objective, audience, topic, format, message, callToAction, rationale, assumptions, status: "draft" };
}
