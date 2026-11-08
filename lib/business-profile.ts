export type Profile = {
  description: string;
  businessType: string;
  products: string;
  audience: string;
  market: string;
  goal: string;
  differentiator: string;
  visualStyle: string;
  resources: string;
};

export const emptyProfile: Profile = {
  description: "", businessType: "", products: "", audience: "",
  market: "", goal: "", differentiator: "", visualStyle: "", resources: "",
};

export function extractInitialProfile(description: string): Profile {
  const text = description.trim();
  const perfume = /عطر|ادکلن|پرفیوم/.test(text);
  const cafe = /کافه|کافی.?شاپ/.test(text);
  const stone = /سنگ|سنگبری/.test(text);
  const online = /آنلاین|اینترنتی/.test(text);
  const businessType = perfume ? "فروش عطر" : cafe ? "کافه" : stone ? "کسب‌وکار سنگ" : "";
  const products = perfume && /های.?کپی|شرکتی/.test(text) ? "عطرهای های‌کپی و شرکتی" : "";
  const audience = /اقتصادی|قیمت مناسب/.test(text) ? "مشتریان علاقه‌مند به محصولات اقتصادی" : "";
  const market = /سراسر ایران|تمام ایران|کل ایران/.test(text) ? "سراسر ایران" : "";
  const goal = /فالوئر|فالوور/.test(text) ? "افزایش فالوئر" : /فروش/.test(text) ? "افزایش فروش" : "";
  return { ...emptyProfile, description: text, businessType: businessType + (online && businessType ? " آنلاین" : ""), products, audience, market, goal };
}

export const profileFields: { key: keyof Profile; label: string; hint: string }[] = [
  { key: "businessType", label: "نوع کسب‌وکار", hint: "مثلاً فروشگاه آنلاین عطر" },
  { key: "products", label: "محصولات یا خدمات", hint: "دقیقاً چه چیزی عرضه می‌کنی؟" },
  { key: "audience", label: "مخاطب اصلی", hint: "مشتری مناسب تو چه کسی است؟" },
  { key: "market", label: "محدوده فعالیت", hint: "مثلاً سراسر ایران یا یک شهر" },
  { key: "goal", label: "هدف اینستاگرام", hint: "مثلاً معرفی برند، رشد مخاطب یا فروش" },
  { key: "differentiator", label: "دلیل انتخاب تو توسط مشتری", hint: "اگر هنوز نمی‌دانی خالی بگذار" },
  { key: "visualStyle", label: "سبک و لحن دلخواه", hint: "مثلاً مینیمال و صمیمی؛ اختیاری" },
  { key: "resources", label: "امکانات و محدودیت‌ها", hint: "مثلاً عکس محصول دارم، چهره نشان نمی‌دهم" },
];
