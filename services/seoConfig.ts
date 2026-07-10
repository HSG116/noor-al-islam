import { ViewState } from '../types';

const BASE_URL = 'https://noor-al-islam.vercel.app';
const LOGO_URL = `${BASE_URL}/logo.webp`;
const ICON_URL = `${BASE_URL}/icon.webp`;

interface SEOData {
  title: string;
  description: string;
  keywords: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
}

export const SEO_MAP: Record<ViewState | 'HOME', SEOData> = {
  HOME: {
    title: 'نور الإسلام | طريقك للجنة',
    description: 'موقع نور الإسلام الإسلامي الشامل. اقرأ واستمع للقرآن الكريم، أوقات الصلاة، الأذكار، التسبيح، المسابقات، الفتاوى، الموسوعة الحديثية، محاضرات إسلامية، يوم عرفة، والمزيد.',
    keywords: 'نور الإسلام, إسلام, قرآن, صلاة, أذكار, تسبيح, حج, عمرة, عرفة, فتاوى, أحاديث, دين',
    path: '/',
  },
  REELS_STUDIO: {
    title: 'استوديو الريلز القرآني | نور الإسلام',
    description: 'أنشئ فيديوهات قرآنية قصيرة احترافية بخلفيات طبيعية وقارئ تختاره وخاتمة تلقائية، جاهزة للمشاركة على وسائل التواصل.',
    keywords: 'ريلز قرآن, فيديو قرآن, quran reels, استوديو فيديو إسلامي, نور الإسلام',
    path: '/reels-studio',
  },
  AUTH: {
    title: 'تسجيل الدخول | نور الإسلام',
    description: 'أنشئ حسابك في نور الإسلام لمتابعة تقدمك في حفظ القرآن، المشاركة في المسابقات، وتخصيص تجربتك الإيمانية.',
    keywords: 'تسجيل دخول, إنشاء حساب, نور الإسلام, مستخدم',
    path: '/auth',
  },
  QURAN_LIST: {
    title: 'المصحف الشريف | إقرأ واستمع للقرآن الكريم | نور الإسلام',
    description: 'اقرأ واستمع للقرآن الكريم بخط واضح مع 604 صفحة. اختر سورة وارتق في تلاوة كتاب الله مع تفسير وتجويد.支持 القرآن الكريم مع الترجمة.',
    keywords: 'قرآن, قرآن كريم, مصحف, تلاوة, استماع القرآن, قراءة القرآن, سور القرآن, آيات, نور الإسلام',
    path: '/quran',
  },
  QURAN_READ: {
    title: 'قراءة القرآن | المصحف الشريف | نور الإسلام',
    description: 'اقرأ القرآن الكريم صفحة بخط واضح مع إمكانية الاستماع والتفسير. تدبر آيات الله في أجواء إيمانية.',
    keywords: 'قراءة القرآن, صفحة قرآن, تلاوة, استماع, تفسير, تجويد, نور الإسلام',
    path: '/quran/read',
  },
  AZKAR: {
    title: 'الأذكار والأدعية | حصن المسلم | نور الإسلام',
    description: 'أذكار الصباح والمساء، أذكار النوم، أذكار بعد الصلاة، الرقية الشرعية، وأدعية جامعة من القرآن والسنة. تابع أذكارك اليومية.',
    keywords: 'أذكار, حصن المسلم, أذكار الصباح والمساء, أدعية, أذكار النوم, أذكار بعد الصلاة, رقية, ذكر الله',
    path: '/azkar',
  },
  TASBIH: {
    title: 'المسبحة الإلكترونية | تسبيح وذكر | نور الإسلام',
    description: 'سبح الله online مع المسبحة الإلكترونية التفاعلية. اختر الذكر وحدد الهدف وابدأ التسبيح. تتبع تسبيحك اليومي.',
    keywords: 'تسبيح, مسبحة, سبحان الله, الحمد لله, لا إله إلا الله, الله أكبر, ذكر, استغفار, نور الإسلام',
    path: '/tasbih',
  },
  PRAYER_TIMES: {
    title: 'مواقيت الصلاة | أوقات الصلاة | نور الإسلام',
    description: 'اعرف مواقيت الصلاة في مدينتك بدقة. الفجر، الظهر، العصر، المغرب، العشاء. حساب دقيق لمواقيت الصلاة في أي مكان.',
    keywords: 'مواقيت الصلاة, أوقات الصلاة, الفجر, الظهر, العصر, المغرب, العشاء, أذان, صلاة, نور الإسلام',
    path: '/prayer-times',
  },
  RADIO: {
    title: 'الراديو الإسلامي | إذاعة القرآن | نور الإسلام',
    description: 'استمع إلى أشهر قراء القرآن الكريم والإذاعات الإسلامية المتنوعة. استمع إلى القرآن مباشرة من كبار القراء.',
    keywords: 'راديو إسلامي, إذاعة قرآن, استماع قرآن, قراء القرآن, إذاعة إسلامية, قرآن مباشر, نور الإسلام',
    path: '/radio',
  },
  HADITH: {
    title: 'الموسوعة الحديثية | صحيح البخاري ومسلم | نور الإسلام',
    description: 'أكبر موسوعة حديثية تشمل صحيح البخاري، صحيح مسلم، السنن، والمسانيد. اقرأ الأحاديث النبوية الشريفة مع الشرح والتخريج.',
    keywords: 'حديث, أحاديث, صحيح البخاري, صحيح مسلم, سنة, حديث نبوي, الموسوعة الحديثية, نور الإسلام',
    path: '/hadith',
  },
  FATAWA: {
    title: 'الفتاوى والأحكام الإسلامية | نور الإسلام',
    description: 'موسوعة الفتاوى والأحكام الشرعية. إجابات موثقة على أسئلتك الفقهية في العبادات والمعاملات من مصادر معتمدة.',
    keywords: 'فتاوى, أحكام إسلامية, فقه, عبادات, معاملات, إسلام, سؤال وجواب, دين, نور الإسلام',
    path: '/fatawa',
  },
  COMPETITIONS: {
    title: 'المسابقات والتحديات الإسلامية | نور الإسلام',
    description: 'شارك في المسابقات والتحديات الإسلامية اليومية. تحديات القرآن، الأذكار، التسبيح. اربح النقاط وتصدر لوحة الشرف.',
    keywords: 'مسابقات إسلامية, تحديات, جوائز, أسئلة دينية, ختمة قرآن, أذكار, تسبيح, نور الإسلام',
    path: '/competitions',
  },
  MOSQUES: {
    title: 'البحث عن المساجد القريبة | نور الإسلام',
    description: 'اعثر على أقرب المساجد إليك بسهولة. دليل المساجد القريبة مع إمكانية تحديد المسافة والاتجاه.',
    keywords: 'مساجد قريبة, مسجد, بحث عن مسجد, جامع, صلاة, اتجاه المسجد, نور الإسلام',
    path: '/mosques',
  },
  QIBLA: {
    title: 'اتجاه القبلة | بوصلة القبلة | نور الإسلام',
    description: 'اعرف اتجاه القبلة من موقعك الحالي بدقة عالية. بوصلة إسلامية لتحديد اتجاه الكعبة المشرفة من أي مكان.',
    keywords: 'قبلة, اتجاه القبلة, بوصلة القبلة, الكعبة, مكة, صلاة, تحديد القبلة, نور الإسلام',
    path: '/qibla',
  },
  REMIX: {
    title: 'واحة الإبداع | بطاقات تهنئة إسلامية | نور الإسلام',
    description: 'أنشئ بطاقات تهنئة إسلامية جميلة وشاركها مع أحبابك. تصاميم إبداعية للمناسبات الإسلامية والأعياد.',
    keywords: 'بطاقات تهنئة, واحة الإبداع, تصاميم إسلامية, بطاقات إسلامية, مناسبات, عيد, رمضان, نور الإسلام',
    path: '/remix',
  },
  PLANNER: {
    title: 'خطة حفظ القرآن الكريم | نور الإسلام',
    description: 'خطط لحفظ القرآن الكريم بخطة مخصصة حسب سرعتك. حدد عدد الصفحات اليومية أو تاريخ الإنتهاء واحصل على جدول متكامل.',
    keywords: 'حفظ القرآن, خطة حفظ, جدول حفظ, مراجعة, تجويد, تحفيظ, قرآن, نور الإسلام',
    path: '/planner',
  },
  PROFILE: {
    title: 'الملف الشخصي | نور الإسلام',
    description: 'صفحتك الشخصية في نور الإسلام. تابع تقدمك، نقاطك، تحدياتك، وإنجازاتك في رحلتك الإيمانية.',
    keywords: 'ملف شخصي, حساب, نقاط, تقدم, إنجازات, تحديات, نور الإسلام',
    path: '/profile',
  },
  DASHBOARD: {
    title: 'لوحة التحكم | نور الإسلام',
    description: 'لوحة التحكم الرئيسية لمتابعة تقدمك في حفظ القرآن وجميع أنشطتك الإيمانية.',
    keywords: 'لوحة تحكم, تقدم, حفظ, قرآن, نشاطات, نور الإسلام',
    path: '/dashboard',
  },
  AI_TUTOR: {
    title: 'المعلم الذكي | الذكاء الاصطناعي | نور الإسلام',
    description: 'تعلم وأسأل معلمك الذكي في نور الإسلام. أجب عن أسئلتك الدينية والقرآنية بتقنية الذكاء الاصطناعي.',
    keywords: 'ذكاء اصطناعي, معلم, تعليم, أسئلة دينية, قرآن, إسلام, نور الإسلام',
    path: '/ai-tutor',
  },
  ADMIN: {
    title: 'لوحة الإدارة | نور الإسلام',
    description: 'لوحة إدارة الموقع للمشرفين. إدارة المستخدمين والمحتوى والإعدادات.',
    keywords: 'إدارة, مشرف, لوحة تحكم, إعدادات, نور الإسلام',
    path: '/admin',
  },
  LEGAL: {
    title: 'الصفحات القانونية | نور الإسلام',
    description: 'سياسة الخصوصية، الشروط والأحكام، وصفحات المعلومات القانونية لموقع نور الإسلام.',
    keywords: 'سياسة خصوصية, شروط, قانوني, نور الإسلام, أحكام',
    path: '/legal',
  },
  ARAFAH_DAY: {
    title: 'يوم عرفة | فضل وأعمال وأدعية يوم عرفة المبارك | نور الإسلام',
    description: 'دليلك الإيماني الشامل ليوم عرفة: أدعية مخصصة، جدول زمني، فتاوى، أذكار وتكبيرات، خطبة عرفة، رحلة الحاج، بطاقات تهنئة، أحاديث، أنشطة عائلية، وأبواب الخير.',
    keywords: 'يوم عرفة, عرفة, الحج, دعاء عرفة, صيام عرفة, فضل يوم عرفة, أعمال يوم عرفة, تكبيرات, نور الإسلام',
    path: '/arafah',
  },
};

const SEO_JSONLD_BASE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: BASE_URL,
  inLanguage: 'ar',
  creator: { '@type': 'Organization', name: 'نور الإسلام' },
};

export function applySEO(view: ViewState, titleBase?: string, descBase?: string) {
  const seo = SEO_MAP[view] || SEO_MAP.HOME;
  const fullTitle = titleBase || seo.title;
  const fullDesc = descBase || seo.description;
  const canonical = `${BASE_URL}${seo.path}`;

  document.title = fullTitle;

  setMeta('description', fullDesc);
  setMeta('keywords', seo.keywords);
  setMeta('robots', 'index, follow');
  setMeta('og:type', seo.type || 'website');
  setMeta('og:title', fullTitle);
  setMeta('og:description', fullDesc);
  setMeta('og:url', canonical);
  setMeta('og:image', seo.image || LOGO_URL);
  setMeta('og:site_name', 'نور الإسلام');
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', fullDesc);
  setMeta('twitter:image', seo.image || LOGO_URL);
  setLink('canonical', canonical);

  const jsonLD = { ...SEO_JSONLD_BASE, name: fullTitle, description: fullDesc, url: canonical };
  let script = document.getElementById('seo-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'seo-jsonld';
    (script as any).type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLD);
}

export function applySubSEO(title: string, description: string, path: string) {
  document.title = `${title} | نور الإسلام`;
  setMeta('description', description);
  setMeta('og:title', document.title);
  setMeta('og:description', description);
  setMeta('twitter:title', document.title);
  setMeta('twitter:description', description);
  const canonical = `${BASE_URL}${path}`;
  setMeta('og:url', canonical);
  setLink('canonical', canonical);
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:')) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
