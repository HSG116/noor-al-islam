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
  type?: 'website' | 'article' | 'WebApplication';
  priority?: number; // For sitemap
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export const SEO_MAP: Record<ViewState | 'HOME', SEOData> = {
  HOME: {
    title: 'نور الإسلام | طريقك للجنة - أكبر منصة إسلامية شاملة',
    description: 'موقع نور الإسلام هو رفيقك اليومي. استمع للقرآن الكريم، تابع مواقيت الصلاة، حافظ على أذكارك، واستمتع بأدوات الذكاء الاصطناعي الإسلامية. اكتشف الكنز الإسلامي الآن!',
    keywords: 'نور الإسلام, موقع إسلامي, القرآن الكريم, أذكار الصباح والمساء, مواقيت الصلاة, تسبيح, فتاوى, الموسوعة الحديثية, راديو قرآن, ريلز إسلامي',
    path: '/',
    type: 'website',
    priority: 1.0,
    changefreq: 'daily'
  },
  REELS_STUDIO: {
    title: 'استوديو الريلز القرآني | أنشئ فيديوهات دعوية بالذكاء الاصطناعي',
    description: 'الآن وبضغطة زر، أنشئ مقاطع ريلز قرآنية احترافية بجودة عالية جداً. اختر السورة والقارئ والخلفية، ودع الذكاء الاصطناعي يصمم لك فيديو جاهز للنشر في تيك توك وانستقرام.',
    keywords: 'ريلز قرآن, تصميم فيديو إسلامي, صانع الريلز, الذكاء الاصطناعي الإسلامي, فيديو قرآن قصير, quran reels, tiktok quran',
    path: '/reels-studio',
    type: 'WebApplication',
    priority: 0.9,
    changefreq: 'weekly'
  },
  AUTH: {
    title: 'تسجيل الدخول | نور الإسلام',
    description: 'انضم إلى مجتمع نور الإسلام. أنشئ حسابك المجاني لحفظ تقدمك في قراءة القرآن، وجمع النقاط، والمشاركة في التحديات الإسلامية.',
    keywords: 'تسجيل دخول نور الإسلام, حساب إسلامي, مستخدم نور الإسلام',
    path: '/auth',
    priority: 0.5,
    changefreq: 'monthly'
  },
  QURAN_LIST: {
    title: 'المصحف الشريف | اقرأ واستمع للقرآن الكريم بصوت أشهر القراء',
    description: 'تصفح المصحف الشريف كاملاً بخط عثماني واضح. استمع لتلاوات خاشعة لأكثر من 100 قارئ، مع تفاسير وتراجم دقيقة. ابدأ ختمتك الآن.',
    keywords: 'المصحف الشريف, القرآن الكريم, قراءة القرآن, استماع القرآن, تفاسير القرآن, تلاوات خاشعة, سور القرآن, ماهر المعيقلي, عبدالباسط عبدالصمد',
    path: '/quran',
    priority: 0.9,
    changefreq: 'weekly'
  },
  QURAN_READ: {
    title: 'تلاوة وتدبر القرآن الكريم | المصحف الشريف | نور الإسلام',
    description: 'عش مع آيات الله في تجربة قراءة لا مثيل لها. مصحف إلكتروني متطور يوفر لك القراءة المريحة للعين، التفسير الميسر، والاستماع الآية بالآية.',
    keywords: 'مصحف إلكتروني, تلاوة القرآن, قراءة المصحف, تفسير القرآن, حفظ القرآن',
    path: '/quran/read',
    priority: 0.8,
    changefreq: 'weekly'
  },
  AZKAR: {
    title: 'حصن المسلم | أذكار الصباح والمساء والأدعية الصحيحة',
    description: 'حافظ على أذكارك اليومية مع حصن المسلم الرقمي. أذكار الصباح والمساء، أذكار النوم، الرقية الشرعية، وأدعية جامعة من الكتاب والسنة مع عداد ذكي.',
    keywords: 'أذكار الصباح والمساء, حصن المسلم, أذكار النوم, دعاء الاستخارة, الرقية الشرعية, أدعية مستجابة, أذكار المسلم',
    path: '/azkar',
    priority: 0.9,
    changefreq: 'daily'
  },
  TASBIH: {
    title: 'المسبحة الإلكترونية الذكية | سبح الله في أي وقت',
    description: 'مسبحة إلكترونية ذكية تحفظ عدد تسبيحاتك. اختر الذكر المفضل (سبحان الله، الحمد لله، الاستغفار) وتتبع إنجازك اليومي بكل سهولة.',
    keywords: 'مسبحة إلكترونية, سبحة رقمية, تسبيح, استغفار, سبحان الله, عداد التسبيح, مسبحة الجوال',
    path: '/tasbih',
    priority: 0.7,
    changefreq: 'weekly'
  },
  PRAYER_TIMES: {
    title: 'مواقيت الصلاة الدقيقة والأذان | أوقات الصلاة في مدينتك',
    description: 'احصل على مواقيت الصلاة الدقيقة لأي مكان في العالم. تنبيهات الأذان، وقت الفجر، الظهر، العصر، المغرب، العشاء، وحساب وقت الثلث الأخير من الليل.',
    keywords: 'مواقيت الصلاة, أوقات الصلاة, موعد الأذان, صلاة الفجر, صلاة العصر, أذان المغرب, وقت العشاء, قيام الليل',
    path: '/prayer-times',
    priority: 0.9,
    changefreq: 'daily'
  },
  RADIO: {
    title: 'إذاعة القرآن الكريم | راديو إسلامي بث مباشر 24/7',
    description: 'استمع إلى البث المباشر لإذاعات القرآن الكريم من مختلف الدول. قراءات متواصلة بأصوات كبار القراء، ودروس إسلامية على مدار الساعة.',
    keywords: 'إذاعة القرآن الكريم, راديو إسلامي, بث مباشر قرآن, راديو القرآن, قنوات إسلامية, تلاوات متواصلة',
    path: '/radio',
    priority: 0.8,
    changefreq: 'monthly'
  },
  HADITH: {
    title: 'الموسوعة الحديثية الكبرى | صحيح البخاري ومسلم والسنن',
    description: 'ابحث في أضخم موسوعة للأحاديث النبوية. تشمل صحيح البخاري، صحيح مسلم، سنن الترمذي، والنسائي، ومسند أحمد. تحقق من صحة الحديث ومعناه.',
    keywords: 'أحاديث نبوية, صحيح البخاري, صحيح مسلم, الموسوعة الحديثية, السيرة النبوية, حديث صحيح, تخريج الأحاديث',
    path: '/hadith',
    priority: 0.8,
    changefreq: 'monthly'
  },
  FATAWA: {
    title: 'موسوعة الفتاوى الشرعية | سؤال وجواب إسلامي',
    description: 'ابحث عن إجابات موثوقة لأسئلتك الشرعية. فتاوى في الصلاة، الصيام، الزكاة، المعاملات، والأسرة من كبار العلماء والمصادر المعتمدة.',
    keywords: 'فتاوى إسلامية, أحكام شرعية, سؤال وجواب ديني, فقه السنة, فتاوى الصيام, فتاوى الزواج',
    path: '/fatawa',
    priority: 0.8,
    changefreq: 'weekly'
  },
  COMPETITIONS: {
    title: 'التحديات والمسابقات الإسلامية | اختبر معلوماتك الدينية',
    description: 'شارك في تحديات يومية ومسابقات إسلامية ممتعة. اختبر حفظك للقرآن، ومعلوماتك في السيرة والفقه، واكسب النقاط وتصدر لوحة الشرف العالمية.',
    keywords: 'مسابقات إسلامية, تحديات دينية, أسئلة دينية, مسابقة القرآن, اختبر معلوماتك الإسلامية, ألعاب إسلامية',
    path: '/competitions',
    priority: 0.8,
    changefreq: 'daily'
  },
  MOSQUES: {
    title: 'خريطة المساجد القريبة | ابحث عن أقرب مسجد إليك',
    description: 'حدد موقعك واكتشف أقرب المساجد والجوامع من حولك بضغطة زر. احصل على الاتجاهات الدقيقة وتفاصيل المسافة للوصول للمسجد.',
    keywords: 'أقرب مسجد, مساجد قريبة مني, خريطة المساجد, البحث عن مسجد, جامع قريب, الاتجاه للمسجد',
    path: '/mosques',
    priority: 0.7,
    changefreq: 'monthly'
  },
  QIBLA: {
    title: 'بوصلة القبلة الدقيقة | تحديد اتجاه الكعبة المشرفة',
    description: 'حدد اتجاه القبلة بدقة متناهية من أي مكان في العالم باستخدام بوصلة نور الإسلام الذكية. صلي بثقة أينما كنت.',
    keywords: 'اتجاه القبلة, بوصلة القبلة, تحديد القبلة, أين القبلة, الكعبة المشرفة, اتجاه مكة',
    path: '/qibla',
    priority: 0.8,
    changefreq: 'monthly'
  },
  REMIX: {
    title: 'واحة الإبداع الإسلامي | تصميم بطاقات تهنئة دعوية',
    description: 'صمم أجمل بطاقات التهنئة الإسلامية، صور الأدعية، وشاركها مع عائلتك وأصدقائك في الأعياد والمناسبات ويوم الجمعة.',
    keywords: 'بطاقات تهنئة إسلامية, تهنئة عيد الفطر, جمعة مباركة, صور أدعية, تصميم إسلامي, واحة الإبداع',
    path: '/remix',
    type: 'WebApplication',
    priority: 0.7,
    changefreq: 'monthly'
  },
  PLANNER: {
    title: 'خطة حفظ القرآن الكريم | جدول مخصص ومتابعة دقيقة',
    description: 'اصنع خطة حفظ قرآن مخصصة لك حسب قدرتك ووقتك. النظام سيقوم بتنظيم جدولك، تنبيهك بأوقات المراجعة، ومتابعة إنجازك اليومي خطوة بخطوة.',
    keywords: 'جدول حفظ القرآن, خطة حفظ القرآن, حفظ كتاب الله, مراجعة القرآن, جدول تحفيظ, تنظيم الوقت للقرآن',
    path: '/planner',
    type: 'WebApplication',
    priority: 0.8,
    changefreq: 'weekly'
  },
  PROFILE: {
    title: 'الملف الشخصي وإنجازاتك | نور الإسلام',
    description: 'تابع مسيرتك الإيمانية، راقب عدد ساعات تلاوتك، التزامك بالأذكار، ونقاطك التي حصدتها في منصة نور الإسلام.',
    keywords: 'حساب نور الإسلام, إنجازات إسلامية, تقدمي',
    path: '/profile',
    priority: 0.5,
    changefreq: 'monthly'
  },
  DASHBOARD: {
    title: 'لوحة التحكم الإسلامية الخاصة بك | نور الإسلام',
    description: 'نظرة شاملة على يومك الإسلامي. الآية اليومية، تقدمك في القرآن، المهام المطلوبة منك، ومستوى تفاعلك.',
    keywords: 'لوحة التحكم, يومي, تقدم القرآن, مهام إسلامية',
    path: '/dashboard',
    priority: 0.6,
    changefreq: 'daily'
  },
  AI_TUTOR: {
    title: 'المعلم الذكي بالذكاء الاصطناعي | اسأل في الدين',
    description: 'لديك سؤال ديني؟ المعلم الذكي يجيبك استناداً على القرآن والسنة وتفاسير العلماء الكبار الموثوقة وبسرعة فائقة.',
    keywords: 'ذكاء اصطناعي إسلامي, اسأل شيخ, سؤال وجواب ديني الذكاء الاصطناعي, معلم قرآن ذكي, فتاوى ذكاء اصطناعي',
    path: '/ai-tutor',
    type: 'WebApplication',
    priority: 0.8,
    changefreq: 'weekly'
  },
  ADMIN: {
    title: 'لوحة الإدارة | نور الإسلام',
    description: 'نظام الإدارة الخاص بموقع نور الإسلام.',
    keywords: 'إدارة',
    path: '/admin',
    priority: 0.1,
    changefreq: 'never'
  },
  LEGAL: {
    title: 'سياسة الخصوصية والشروط | نور الإسلام',
    description: 'تعرف على الشروط والأحكام وسياسة الخصوصية لحماية بياناتك أثناء استخدامك لمنصة نور الإسلام.',
    keywords: 'سياسة الخصوصية, شروط الاستخدام, القوانين',
    path: '/legal',
    priority: 0.3,
    changefreq: 'yearly'
  },
  ARAFAH_DAY: {
    title: 'يوم عرفة | دليل الحاج والمشتاق | أدعية وأعمال يوم عرفة',
    description: 'الدليل الأضخم ليوم عرفة. أفضل الأدعية المأثورة، جدول أعمال يوم عرفة لحظة بلحظة، فتاوى الحج، التكبيرات، وبث مباشر لخطبة عرفة من مكة.',
    keywords: 'يوم عرفة, دعاء يوم عرفة, فضل يوم عرفة, الحج, تكبيرات العيد, لبيك اللهم لبيك, صيام يوم عرفة, أعمال عرفة',
    path: '/arafah',
    priority: 0.9,
    changefreq: 'yearly'
  },
};

const SEO_JSONLD_BASE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: BASE_URL,
  inLanguage: 'ar',
  creator: { '@type': 'Organization', name: 'نور الإسلام' },
};

export function applySEO(view: ViewState | 'HOME', titleBase?: string, descBase?: string) {
  const seo = SEO_MAP[view] || SEO_MAP.HOME;
  const fullTitle = titleBase || seo.title;
  const fullDesc = descBase || seo.description;
  const canonical = `${BASE_URL}${seo.path}`;

  document.title = fullTitle;
  document.documentElement.lang = 'ar';

  setMeta('description', fullDesc);
  setMeta('keywords', seo.keywords);
  setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  
  // Open Graph
  setMeta('og:type', seo.type || 'website');
  setMeta('og:title', fullTitle);
  setMeta('og:description', fullDesc);
  setMeta('og:url', canonical);
  setMeta('og:image', seo.image || LOGO_URL);
  setMeta('og:site_name', 'نور الإسلام');
  setMeta('og:locale', 'ar_SA');
  
  // Twitter
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', fullDesc);
  setMeta('twitter:image', seo.image || LOGO_URL);
  setMeta('twitter:site', '@NoorAlIslamApp');
  
  // PWA / Theme
  setMeta('theme-color', '#10b981');
  setMeta('apple-mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');

  setLink('canonical', canonical);

  // JSON-LD Schema Arrays
  const schemas: any[] = [];
  
  // 1. WebSite or WebApplication Schema
  schemas.push({
    ...SEO_JSONLD_BASE,
    '@type': seo.type === 'WebApplication' ? 'WebApplication' : 'WebSite',
    name: fullTitle,
    description: fullDesc,
    url: canonical,
    ...(seo.type === 'WebApplication' ? { applicationCategory: 'LifestyleApplication', operatingSystem: 'Any' } : {})
  });

  // 2. BreadcrumbList Schema
  if (view !== 'HOME') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'الرئيسية',
          item: BASE_URL
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: fullTitle.split('|')[0].trim(),
          item: canonical
        }
      ]
    });
  }

  // 3. Organization Schema (Only on Home)
  if (view === 'HOME') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'نور الإسلام',
      url: BASE_URL,
      logo: LOGO_URL,
      sameAs: [
        'https://twitter.com/NoorAlIslamApp',
        'https://facebook.com/NoorAlIslamApp'
      ]
    });
  }

  let script = document.getElementById('seo-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'seo-jsonld';
    (script as any).type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
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
