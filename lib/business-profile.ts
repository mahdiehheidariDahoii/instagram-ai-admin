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
  brandName: string;
  brandPromise: string;
  brandPersonality: string;
  customerProblem: string;
  customerMotivation: string;
  competitors: string;
  contentPillars: string;
  brandVoice: string;
  conversionPath: string;
  brandBoundaries: string;
};

export const emptyProfile: Profile = {
  description: "", businessType: "", products: "", audience: "",
  market: "", goal: "", differentiator: "", visualStyle: "", resources: "",
  brandName: "", brandPromise: "", brandPersonality: "", customerProblem: "",
  customerMotivation: "", competitors: "", contentPillars: "", brandVoice: "",
  conversionPath: "", brandBoundaries: "",
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
  { key: "brandName", label: "نام برند شما چیست؟", hint: "نامی که می‌خواهید مخاطب برندتان را با آن بشناسد" },
  { key: "businessType", label: "برند شما در چه حوزه‌ای فعالیت می‌کند؟", hint: "مثلاً عطاری، کافه بازی، خدمات معماری یا فروشگاه آنلاین" },
  { key: "products", label: "محصولات و خدمات اصلی برند چیست؟", hint: "سه محصول یا خدمت اصلی و پرفروش را نام ببرید؛ اگر نمی‌دانید همان دسته‌بندی کلی کافی است" },
  { key: "audience", label: "مشتری ایده‌آل برند چه کسی است؟", hint: "سن تقریبی، علایق، نیازها و موقعیت خرید؛ فقط مواردی که واقعاً می‌دانید" },
  { key: "market", label: "برند در چه بازار یا محدوده‌ای فعالیت می‌کند؟", hint: "محلی، شهری، کشوری، آنلاین یا حضوری" },
  { key: "goal", label: "مهم‌ترین نتیجه‌ای که از اینستاگرام می‌خواهید چیست؟", hint: "مثلاً افزایش سفارش، دریافت پیام، آگاهی از برند یا ایجاد اعتماد" },
  { key: "differentiator", label: "چرا مشتری باید شما را به رقبا ترجیح دهد؟", hint: "فقط مزیت‌های واقعی و قابل اثبات؛ اگر هنوز مشخص نیست خالی بگذارید" },
  { key: "visualStyle", label: "هویت بصری مطلوب برند چگونه است؟", hint: "رنگ‌ها، سبک طراحی، نمونه برندهای الهام‌بخش؛ اگر هویت مصوب ندارید بنویسید پیشنهادی" },
  { key: "resources", label: "چه منابعی برای تولید محتوا دارید؟", hint: "عکس واقعی، ویدیو، لوگو، تیم تولید، امکان نمایش چهره و محدودیت‌ها" },
  { key: "brandPromise", label: "برند شما چه ارزشی را به مشتری وعده می‌دهد؟", hint: "مثلاً انتخاب آسان‌تر، تجربه خوشایند یا دسترسی به تنوع بیشتر؛ وعده بدون پشتوانه ننویسید" },
  { key: "customerProblem", label: "چه مشکل یا نیازی از مشتری را برطرف می‌کنید؟", hint: "مشتری قبل از خرید با چه دغدغه‌ای روبه‌روست؟" },
  { key: "customerMotivation", label: "چه چیزی مشتری را به خرید ترغیب می‌کند؟", hint: "اعتماد، کاربرد، زیبایی، قیمت، سرعت، تجربه یا عامل دیگر" },
  { key: "competitors", label: "مشتری شما چه گزینه‌های جایگزینی دارد؟", hint: "رقبای شناخته‌شده یا نوع فروشگاه‌های مشابه؛ اختیاری" },
  { key: "brandPersonality", label: "اگر برند شما یک شخصیت بود، چه ویژگی‌هایی داشت؟", hint: "مثلاً اصیل، متخصص، آرام، جسور، دوستانه یا لوکس؛ دو یا سه ویژگی" },
  { key: "brandVoice", label: "برند باید چگونه با مخاطب صحبت کند؟", hint: "رسمی یا محاوره‌ای؟ آموزشی یا سرگرم‌کننده؟ استفاده از ایموجی مجاز است؟" },
  { key: "contentPillars", label: "دوست دارید پیج بیشتر درباره چه موضوعاتی محتوا منتشر کند؟", hint: "آموزش، معرفی محصول، پشت‌صحنه، داستان برند، تجربه مشتری و ..." },
  { key: "conversionPath", label: "مخاطب پس از دیدن محتوا چطور می‌تواند اقدام کند؟", hint: "دایرکت، سایت، تماس، مراجعه حضوری؛ فقط مسیرهای فعال و تأییدشده" },
  { key: "brandBoundaries", label: "برند چه چیزهایی را نباید در محتوا نمایش دهد یا ادعا کند؟", hint: "مثلاً عدم نمایش چهره، عدم اعلام قیمت، ممنوعیت ادعای درمانی یا استفاده از لوگوی ساختگی" },
];
