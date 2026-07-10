
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Sun, Moon, Star, Sparkles, Book, Heart, HandMetal, Users,
  Home, Plane, Gift, BadgeCheck, Calendar, Clock, Loader2, ArrowLeft,
  Volume2, Shield, Baby, BookOpen, Smile, Coffee, Cloud, Globe,
  ChevronRight, Copy, Check, Search, Share2, MessageCircle
} from 'lucide-react';
import { applySubSEO } from '../services/seoConfig';

interface ArafahDayProps {
  onBack: () => void;
}

// =================== SEO ===================
const ARAFAH_SEO = {
  title: 'يوم عرفة | نور الإسلام - فضل وأعمال وأدعية يوم عرفة المبارك',
  description: 'دليلك الشامل ليوم عرفة: أدعية مخصصة، جدول إيماني، فتاوى، أذكار، خطبة عرفة، رحلة الحاج، بطاقات تهنئة، أحاديث، أنشطة عائلية، وأبواب الخير.',
  keywords: 'يوم عرفة, عرفة, الحج, دعاء عرفة, صيام عرفة, فضل يوم عرفة, أعمال يوم عرفة, نور الإسلام',
  ogImage: './logo.webp',
};

// =================== DATA ===================

const SECTIONS = [
  { id: 'dua', label: 'مخطط الأدعية', icon: Heart, color: 'from-rose-500 to-pink-600', bgColor: 'rose' },
  { id: 'schedule', label: 'الجدول الإيماني', icon: Calendar, color: 'from-emerald-500 to-teal-600', bgColor: 'emerald' },
  { id: 'fiqh', label: 'المرشد الفقهي', icon: Shield, color: 'from-blue-500 to-indigo-600', bgColor: 'blue' },
  { id: 'dhikr', label: 'الأذكار والتكبير', icon: Volume2, color: 'from-amber-500 to-orange-600', bgColor: 'amber' },
  { id: 'sermon', label: 'خطبة عرفة', icon: Book, color: 'from-violet-500 to-purple-600', bgColor: 'violet' },
  { id: 'hajj', label: 'رحلة الحاج', icon: Globe, color: 'from-cyan-500 to-sky-600', bgColor: 'cyan' },
  { id: 'cards', label: 'بطاقات التهنئة', icon: Share2, color: 'from-fuchsia-500 to-pink-600', bgColor: 'fuchsia' },
  { id: 'hadith', label: 'الفضائل والأحاديث', icon: BookOpen, color: 'from-emerald-500 to-green-600', bgColor: 'emerald' },
  { id: 'family', label: 'العائلة والأطفال', icon: Baby, color: 'from-teal-500 to-cyan-600', bgColor: 'teal' },
  { id: 'charity', label: 'أبواب الخير', icon: Gift, color: 'from-yellow-500 to-amber-600', bgColor: 'yellow' },
];

const HADITHS = [
  { text: 'مَا مِنْ يَوْمٍ أَكْثَرَ مِنْ أَنْ يُعْتِقَ اللَّهُ فِيهِ عَبْدًا مِنَ النَّارِ مِنْ يَوْمِ عَرَفَةَ', source: 'صحيح مسلم', explanation: 'هذا الحديث يبين عظمة يوم عرفة، فهو أكثر الأيام التي يعتق الله فيها عباده من النار.' },
  { text: 'صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ', source: 'صحيح مسلم', explanation: 'صيام يوم عرفة يكفر ذنوب سنتين: السنة الماضية والسنة القادمة، وهذا فضل عظيم.' },
  { text: 'الْحَجُّ عَرَفَةُ، فَمَنْ أَدْرَكَ لَيْلَةَ عَرَفَةَ قَبْلَ طُلُوعِ الْفَجْرِ مِنْ لَيْلَةِ جَمْعٍ فَقَدْ تَمَّ حَجُّهُ', source: 'سنن الترمذي', explanation: 'الوقوف بعرفة هو ركن الحج الأعظم، من فاته فقد فاته الحج.' },
  { text: 'خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ', source: 'سنن الترمذي', explanation: 'أفضل الأدعية وأكثرها إجابة هو دعاء يوم عرفة، فأكثروا من الدعاء.' },
];

const AZKAR_LIST = [
  { text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 100 },
  { text: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ', count: 33 },
  { text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ', count: 100 },
  { text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', count: 100 },
  { text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', count: 100 },
  { text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', count: 100 },
];

const DUA_CATEGORIES = [
  { id: 'forgiveness', label: 'غفران الذنوب', icon: Star, duas: ['اللَّهُمَّ اجْعَلْنِي مِنْ عُتَقَائِكَ مِنَ النَّارِ فِي يَوْمِ عَرَفَةَ', 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا', 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', 'اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ'] },
  { id: 'provision', label: 'سعة الرزق', icon: Coffee, duas: ['اللَّهُمَّ ارْزُقْنِي رِزْقًا حَلَالًا طَيِّبًا', 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ', 'اللَّهُمَّ بَارِكْ لِي فِيمَا رَزَقْتَنِي'] },
  { id: 'children', label: 'صلاح الأبناء', icon: Baby, duas: ['رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي', 'اللَّهُمَّ أَصْلِحْ لِي ذُرِّيَّتِي', 'اللَّهُمَّ احْفَظْ أَوْلَادِي وَبَارِكْ فِيهِمْ'] },
  { id: 'health', label: 'الشفاء والعافية', icon: Heart, duas: ['اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', 'رَبِّ إِنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ', 'اللَّهُمَّ اشْفِ مَرْضَانَا وَمَرْضَى الْمُسْلِمِينَ'] },
  { id: 'deceased', label: 'للمتوفين', icon: Moon, duas: ['رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ', 'اللَّهُمَّ اغْفِرْ لِمَوْتَانَا وَارْحَمْهُمْ', 'اللَّهُمَّ أَدْخِلْهُمُ الْجَنَّةَ وَأَجِرْهُمْ مِنَ النَّارِ', 'اللَّهُمَّ نَوِّرْ قُبُورَهُمْ وَاغْفِرْ لَهُمْ'] },
];

const FAQ_ITEMS = [
  { q: 'ما حكم صيام يوم عرفة للحاج؟', a: 'السنة للحاج أن لا يصوم يوم عرفة لأنه يوم عبادة واجتهاد في الدعاء والذكر، والصيام قد يضعفه عن ذلك. أما غير الحاج فيستحب له صيام يوم عرفة.' },
  { q: 'هل يجوز صيام يوم عرفة إذا وافق السبت أو الجمعة؟', a: 'يكره إفراد يوم السبت بالصيام، لكن يصح. ويكره إفراد يوم الجمعة أيضاً. والأفضل أن يصوم يوماً قبله أو بعده معه. والأكثر على أن صيام عرفة مستحب حتى لو وافق السبت.' },
  { q: 'ماذا يفعل من فاته صيام عرفة بسبب الحيض أو المرض؟', a: 'يمكن إدراك أجر اليوم بأعمال أخرى: الإكثار من الدعاء والذكر والاستغفار والصدقة والتوبة.' },
  { q: 'هل يجوز الجمع بين قضاء رمضان وصيام عرفة بنية واحدة؟', a: 'الجمهور على أن الصيام لا يجزئ عن فرضين، فتصح نية القضاء وتحصل بركة اليوم دون نية التطوع.' },
  { q: 'ما هو أفضل دعاء يوم عرفة؟', a: 'أفضل الدعاء يوم عرفة هو دعاء النبي ﷺ: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير". ويكثر من الدعاء بما شاء من خيري الدنيا والآخرة.' },
  { q: 'متى يبدأ التكبير في يوم عرفة؟', a: 'التكبير المطلق يبدأ من فجر يوم عرفة إلى عصر آخر أيام التشريق. والتكبير المقيد يبدأ من بعد صلاة الفجر يوم عرفة إلى بعد صلاة العصر من آخر أيام التشريق.' },
];

const CARD_MESSAGES = [
  { title: 'دعوة عرفة', msg: 'تقبل الله منا ومنكم صالح الأعمال، وجعل يوم عرفة نوراً في قلوبكم وطمأنينة في صدروكم. كل عام وأنتم إلى الله أقرب.' },
  { title: 'تهنئة عيد الأضحى', msg: 'كل عام وأنتم بخير، أعاد الله عليكم عيد الأضحى باليمن والبركات، وتقبل الله طاعاتكم، وجعل أيامكم أفراحاً وسعادة.' },
  { title: 'رسالة للحجاج', msg: 'لبيك اللهم لبيك، أسأل الله أن يتقبل حجكم ويغفر ذنبكم ويكتب لكم الأجر والمغفرة. عوداً حميداً بحج مبرور وسعي مشكور.' },
  { title: 'للأهل والأحباب', msg: 'في يوم عرفة العظيم، أسأل الله أن يجمعنا بكم في الجنّة، وأن يبارك لكم في أهليكم وأولادكم وأرزاقكم. دعواتكم لي بالخير.' },
];

const CHARITY_IDEAS = [
  { icon: Heart, title: 'صلة الرحم', desc: 'اتصل بأقاربك اليوم واطمئن عليهم، فأفضل الصدقة أن تصل رحمك.', color: 'text-rose-400' },
  { icon: Smile, title: 'جبر الخواطر', desc: 'اعفُ عن من أساء إليك، وأدخل السرور على قلب مسلم بكلمة طيبة أو هدية بسيطة.', color: 'text-amber-400' },
  { icon: Users, title: 'الصدقة الجارية', desc: 'تبرع لمشروع ماء أو بناء مسجد أو كفالة يتيم عبر المنصات الموثوقة.', color: 'text-emerald-400' },
  { icon: Home, title: 'إطعام الطعام', desc: 'جهز وجبة لجيرانك أو تبرع لبنك الطعام، فإطعام الطعام من أحب الأعمال.', color: 'text-orange-400' },
  { icon: HandMetal, title: 'مساعدة المحتاج', desc: 'سدد دين معسر، أو اكفل أسرة محتاجة، أو قدم مساعدة عينية لعائلة فقيرة.', color: 'text-cyan-400' },
  { icon: Book, title: 'تعليم القرآن', desc: 'شارك في تعليم طفل أو مبتدئ سورة الفاتحة أو قصار السور.', color: 'text-indigo-400' },
];

const FAMILY_ACTIVITIES = [
  { title: 'ركن الدعاء العائلي', desc: 'جهز ركنًا في المنزل مع سجادة صلاة وورقة وأقلام واطلب من كل فرد كتابة دعائه ثم ارفعوا أكف الضراعة معًا.', icon: Heart },
  { title: 'قصة الحج للأطفال', desc: 'احكي لأطفالك قصة سيدنا إبراهيم وإسماعيل عليهما السلام بطريقة مشوقة باستخدام دمى أو رسومات.', icon: BookOpen },
  { title: 'مسابقة دينية', desc: 'أعد مسابقة منزلية بأسئلة عن الحج وعرفة مع جوائز رمزية لتحفيز الأطفال.', icon: Star },
  { title: 'مجسم الكعبة', desc: 'اصنعوا معًا مجسمًا للكعبة باستخدام الورق المقوى والألوان، وعلقوا عليه أعلام التكبير.', icon: Home },
  { title: 'بطاقات التهنئة', desc: 'شجع الأطفال على صنع بطاقات تهنئة يدوية لعيد الأضحى وإرسالها للأقارب.', icon: Gift },
  { title: 'التكبير الجماعي', desc: 'رددوا التكبير بصوت جماعي بعد الصلوات، وعلم الأطفال صيغ التكبير بطريقة مرحة.', icon: Volume2 },
];

const SERMON_NOTES = [
  'خطبة عرفة تُلقى من مسجد نمرة في صعيد عرفة بعد زوال الشمس (وقت الظهر).',
  'تكون الخطبة جامعة مانعة، تتناول قضايا الإسلام الكبرى وتذكر الحجاج بمقامهم العظيم.',
  'تتضمن الخطبة حثًا على التقوى، وتذكيرًا باليوم الآخر، ووصايا جامعة للحجاج وللأمة.',
  'بعد الخطبة، تؤدى صلاتا الظهر والعصر قصرًا وجمعًا (تقديم) بأذان واحد وإقامتين.',
  'ثم يشرع الحجاج في التوجه إلى الله بالدعاء والتضرع والذكر حتى غروب الشمس.',
];

const NON_HAJJ_SCHEDULE = [
  { time: 'قبل الفجر', duration: 'ساعتان', activities: ['قيام الليل مع سجود طويل', 'الاستغفار في السحر', 'الدعاء بتضرع', 'صلِّ ركعتين بخشوع'] },
  { time: 'الفجر', duration: '٣٠ دقيقة', activities: ['صلاة الفجر في وقتها', 'أذكار الصباح', 'الجلوس في المصلى للذكر', 'قراءة سورة يس أو الملك'] },
  { time: 'الشروق - الضحى', duration: 'ساعتان', activities: ['صلاة الضحى (ثماني ركعات)', 'قراءة القرآن بخشوع', 'الاستغفار والتسبيح', 'صدقة اليوم'] },
  { time: 'الظهر', duration: 'ساعة', activities: ['صلاة الظهر', 'قراءة سورة الكهف', 'استراحة قصيرة بنية صالحة', 'أذكار المساء (بعد العصر)'] },
  { time: 'العصر', duration: 'ساعتان', activities: ['صلاة العصر', 'الجلوس للذكر حتى المغرب', 'الإكثار من "لا إله إلا الله"', 'الدعاء بخشوع'] },
  { time: 'المغرب', duration: 'ساعة', activities: ['صلاة المغرب', 'الدعاء - وقت استجابة', 'أذكار المساء', 'صلة الرحم بالهاتف'] },
  { time: 'العشاء', duration: 'ساعة', activities: ['صلاة العشاء', 'الوتر والدعاء', 'محاسبة النفس', 'التخطيط ليوم العيد'] },
];

const HAJJ_SCHEDULE = [
  { time: 'ما قبل الفجر', duration: 'ساعتان', activities: ['الخروج من منى إلى عرفة', 'التلبية والتكبير في الطريق', 'الوصول إلى عرفة', 'النزول في الموقف'] },
  { time: 'طلوع الشمس', duration: 'ساعتان', activities: ['الاستعداد ليوم عرفة', 'الاغتسال والتطيب', 'الذكر والتلبية', 'الاستماع للمحاضرات'] },
  { time: 'الظهر', duration: '٣ ساعات', activities: ['الاستماع لخطبة عرفة من مسجد نمرة', 'صلاة الظهر والعصر قصرًا وجمعًا', 'التوجه إلى الموقف', 'رفع أكف الضراعة'] },
  { time: 'العصر - الغروب', duration: 'ساعتان', activities: ['التضرع والدعاء بخشوع', 'الإكثار من "لا إله إلا الله"', 'الوقوف عند الصخرات', 'البكاء من خشية الله'] },
  { time: 'بعد الغروب', duration: 'ساعتان', activities: ['النفرة إلى مزدلفة', 'السكينة والوقار في السير', 'صلاة المغرب والعشاء جمعًا', 'المبيت في مزدلفة'] },
  { time: 'ليلًا', duration: 'ساعتان', activities: ['جمع الحصى من مزدلفة', 'الذكر والدعاء في المبيت', 'الاستعداد ليوم النحر', 'التكبير والتهليل'] },
];

const TAKBEER_FORMULAS = [
  { title: 'التكبير المطلق', desc: 'يبدأ من فجر يوم عرفة إلى غروب شمس آخر أيام التشريق', formula: 'الله أكبر، الله أكبر، لا إله إلا الله، والله أكبر، الله أكبر ولله الحمد' },
  { title: 'التكبير المقيد', desc: 'يبدأ من بعد صلاة الفجر يوم عرفة إلى بعد صلاة العصر من آخر أيام التشريق', formula: 'الله أكبر، الله أكبر، الله أكبر، لا إله إلا الله، الله أكبر، الله أكبر، ولله الحمد' },
  { title: 'صيغة أخرى', desc: 'رويت عن الصحابة الكرام', formula: 'الله أكبر كبيرًا، والحمد لله كثيرًا، وسبحان الله بكرة وأصيلاً' },
];

// =================== COMPONENT ===================

const SECTION_SEO: Record<string, { title: string; desc: string }> = {
  dua: { title: 'مخطط الأدعية ليوم عرفة', desc: 'أدعية مخصصة ليوم عرفة في مجالات: غفران الذنوب، سعة الرزق، صلاح الأبناء، الشفاء، للمتوفين. أدعية مأثورة من القرآن والسنة.' },
  schedule: { title: 'الجدول الإيماني ليوم عرفة', desc: 'جدول زمني مقسم بالساعات لاستغلال يوم عرفة بالكامل. خيارات لغير الحاج وللحاج مع أنشطة محددة لكل وقت.' },
  fiqh: { title: 'المرشد الفقهي ليوم عرفة', desc: 'إجابات على الأسئلة الفقهية الشائعة ليوم عرفة: صيام عرفة للحاج، أحكام الصيام، أفضل الأدعية، التكبير.' },
  dhikr: { title: 'أذكار وتكبيرات يوم عرفة', desc: 'صيغ التكبير المطلق والمقيد، أذكار يوم عرفة المبارك مع عدادات تفاعلية للتسبيح والتهليل.' },
  sermon: { title: 'خطبة عرفة', desc: 'ملخص خطبة عرفة من مسجد نمرة. تعرف على دروس وعبر خطبة يوم عرفة وأهم الرسائل الإيمانية.' },
  hajj: { title: 'رحلة الحاج في يوم عرفة', desc: 'وصف روحي لرحلة الحجاج في يوم عرفة: السير إلى عرفة، الدعاء في الموقف، النفرة إلى مزدلفة.' },
  cards: { title: 'بطاقات تهنئة يوم عرفة وعيد الأضحى', desc: 'بطاقات تهنئة مميزة ليوم عرفة وعيد الأضحى. رسائل إيمانية راقية للمشاركة مع الأهل والأصدقاء.' },
  hadith: { title: 'أحاديث فضل يوم عرفة', desc: 'الأحاديث النبوية الصحيحة في فضل يوم عرفة: العتق من النار، صيام عرفة، أفضل الدعاء.' },
  family: { title: 'أنشطة عائلية ليوم عرفة', desc: 'أفكار عملية لإشراك الأطفال في روحانية يوم عرفة: قصص، مسابقات، ركن دعاء، مجسمات.' },
  charity: { title: 'أبواب الخير في يوم عرفة', desc: 'أعمال صالحة في يوم عرفة: صلة الرحم، الصدقة، جبر الخواطر، إطعام الطعام، تعليم القرآن.' },
};

export const ArafahDay: React.FC<ArafahDayProps> = ({ onBack }) => {
  const getInitialSection = () => {
    if (typeof window === 'undefined') return 'dua';
    const hash = window.location.hash.replace('#', '');
    if (SECTIONS.find(s => s.id === hash)) return hash;
    return 'dua';
  };

  const [activeSection, setActiveSectionState] = useState(getInitialSection);
  const [duaCategory, setDuaCategory] = useState('forgiveness');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleType, setScheduleType] = useState<'non_hajj' | 'hajj'>('non_hajj');
  const [cardIndex, setCardIndex] = useState(0);
  const [dhikrCounts, setDhikrCounts] = useState<Record<number, number>>({});
  const [duaCategory2, setDuaCategory2] = useState(0);
  const [showSermonDetail, setShowSermonDetail] = useState(false);

  const setActiveSection = useCallback((id: string) => {
    setActiveSectionState(id);
    window.history.replaceState(null, '', `#${id}`);
    const seo = SECTION_SEO[id];
    if (seo) {
      applySubSEO(seo.title, seo.desc, `/arafah#${id}`);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTIONS.find(s => s.id === hash)) {
      setActiveSectionState(hash);
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];
  const currentDuas = DUA_CATEGORIES.find(c => c.id === duaCategory)?.duas || DUA_CATEGORIES[0].duas;

  const getBgColor = (color: string) => {
    const map: any = { rose: 'rose', emerald: 'emerald', blue: 'blue', amber: 'amber', violet: 'violet', cyan: 'cyan', fuchsia: 'fuchsia', teal: 'teal', yellow: 'yellow' };
    return map[color] || 'emerald';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 md:px-6 pb-44">
      {/* Header */}
      <div className="relative mb-6 md:mb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-[3rem] blur-3xl -z-10" />
        <div className="relative z-10">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-amber-400/70 hover:text-amber-300 transition-colors mb-4 text-xs md:text-sm font-bold">
            <ChevronLeft size={18} /> العودة إلى الرئيسية
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[10px] md:text-xs font-black shadow-lg shadow-amber-900/20">
              <Sun size={14} /> أفضل أيام الدنيا <Sun size={14} />
            </div>
            <h1 className="text-4xl md:text-7xl font-black">
              <span className="bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">يوم عرفة</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-lg font-medium max-w-2xl mx-auto">
              دليلك الإيماني الشامل لاستغلال أفضل يوم طلعت فيه الشمس
            </p>
            <div className="flex items-center justify-center gap-4 text-[10px] md:text-xs text-gray-500 font-bold">
              <span>٩ ذو الحجة</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>يوم المغفرة والعتق من النار</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input type="text" placeholder="ابحث في قسم يوم عرفة..."
            className="w-full bg-[#1e293b]/60 border border-white/5 rounded-2xl py-3 pr-10 pl-4 text-white text-sm focus:outline-none focus:border-amber-500/40 transition-all placeholder:text-gray-600"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-8 md:mb-12">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <motion.button key={section.id} onClick={() => setActiveSection(section.id)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`relative p-3 md:p-4 rounded-2xl md:rounded-3xl border transition-all duration-300 text-right overflow-hidden
                ${isActive ? 'border-amber-500/40 shadow-lg shadow-amber-900/20 bg-[#1e293b]/80' : 'border-white/5 bg-[#1e293b]/30 hover:bg-[#1e293b]/60 hover:border-white/10'}`}>
              {isActive && <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />}
              <div className="relative z-10 flex flex-col items-center text-center gap-1.5">
                <div className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all ${isActive ? 'bg-amber-500/15 text-amber-400 scale-110' : 'bg-white/5 text-gray-400'}`}>
                  <Icon size={18} />
                </div>
                <span className={`text-[9px] md:text-[11px] font-bold leading-tight ${isActive ? 'text-amber-300' : 'text-gray-400'}`}>{section.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          <div className="space-y-6">
            {/* Section Header */}
            <div className={`bg-gradient-to-br ${currentSection.color} rounded-[2rem] p-6 md:p-10 text-center shadow-xl relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 space-y-2">
                <currentSection.icon size={40} className="mx-auto text-white/80" />
                <h2 className="text-2xl md:text-4xl font-black text-white">{currentSection.label}</h2>
              </div>
            </div>

            {/* 1. مخطط الأدعية المخصص */}
            {activeSection === 'dua' && (
              <div className="space-y-4">
                <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-4 md:p-6">
                  <p className="text-gray-300 text-sm md:text-base font-medium text-center leading-relaxed">
                    اختر مجال الدعاء الذي تريد التركيز عليه، وردد هذه الأدعية المباركة في يوم عرفة
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                  {DUA_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = duaCategory === cat.id;
                    return (
                      <button key={cat.id} onClick={() => setDuaCategory(cat.id)}
                        className={`p-3 md:p-4 rounded-xl md:rounded-2xl border text-center transition-all ${isSelected ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-[#1e293b]/30 border-white/5 text-gray-400 hover:bg-[#1e293b]/60'}`}>
                        <Icon size={20} className="mx-auto mb-1.5" />
                        <span className="text-[10px] md:text-xs font-bold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-3">
                  {currentDuas.map((dua, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="group bg-[#1e293b]/50 border border-white/5 hover:border-amber-500/20 rounded-2xl p-4 md:p-6 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/3 rounded-full blur-2xl" />
                      <div className="relative z-10">
                        <p className="font-quran text-lg md:text-2xl leading-[2.5] text-white/90 text-center">{dua}</p>
                        <button onClick={() => handleCopy(dua)} className="mt-2 mx-auto flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-amber-400 transition-colors">
                          {copiedText === dua ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ الدعاء</>}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. الجدول الإيماني التفصيلي */}
            {activeSection === 'schedule' && (
              <div className="space-y-4">
                <div className="flex gap-2 max-w-md mx-auto">
                  <button onClick={() => setScheduleType('non_hajj')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${scheduleType === 'non_hajj' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#1e293b]/40 text-gray-400 hover:bg-[#1e293b]/60'}`}>
                    لغير الحاج
                  </button>
                  <button onClick={() => setScheduleType('hajj')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${scheduleType === 'hajj' ? 'bg-amber-600 text-white shadow-lg' : 'bg-[#1e293b]/40 text-gray-400 hover:bg-[#1e293b]/60'}`}>
                    للحاج
                  </button>
                </div>
                <div className="space-y-2">
                  {(scheduleType === 'non_hajj' ? NON_HAJJ_SCHEDULE : HAJJ_SCHEDULE).map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-4 md:p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-emerald-400" />
                          <span className="text-sm md:text-base font-black text-white">{item.time}</span>
                        </div>
                        <div className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">{item.duration}</div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {item.activities.map((act, j) => (
                          <div key={j} className="flex items-center gap-2 text-gray-300 text-xs md:text-sm">
                            <Star size={10} className="text-emerald-500 shrink-0" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. المرشد الفقهي */}
            {activeSection === 'fiqh' && (
              <div className="space-y-3">
                {FAQ_ITEMS.map((item, i) => (
                  <motion.details key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="group bg-[#1e293b]/40 border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-blue-500/20">
                    <summary className="p-4 md:p-5 cursor-pointer flex items-center justify-between gap-3 text-sm md:text-base font-bold text-white hover:text-blue-300 transition-colors">
                      <span>{item.q}</span>
                      <ChevronLeft size={16} className="shrink-0 text-gray-500 group-open:-rotate-90 transition-transform" />
                    </summary>
                    <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-white/5 pt-3">
                      <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </motion.details>
                ))}
              </div>
            )}

            {/* 4. الأذكار والتكبير */}
            {activeSection === 'dhikr' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg md:text-xl font-black text-amber-300 text-center">صيغ التكبير</h3>
                  {TAKBEER_FORMULAS.map((item, i) => (
                    <div key={i} className="bg-[#1e293b]/40 border border-amber-500/10 rounded-2xl p-4 md:p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={14} className="text-amber-400" />
                        <span className="text-sm font-bold text-amber-300">{item.title}</span>
                        <span className="text-[9px] text-gray-500">{item.desc}</span>
                      </div>
                      <p className="font-quran text-lg md:text-2xl text-white/90 text-center my-3 leading-[2.5]">{item.formula}</p>
                      <button onClick={() => handleCopy(item.formula)} className="mx-auto flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-amber-400 transition-colors">
                        {copiedText === item.formula ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ</>}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg md:text-xl font-black text-emerald-300 text-center">أذكار اليوم المبارك</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {AZKAR_LIST.map((item, i) => {
                      const count = dhikrCounts[i] || 0;
                      const isComplete = count >= item.count;
                      return (
                        <div key={i} className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-4 md:p-5 text-center">
                          <p className="font-quran text-sm md:text-lg text-white/90 leading-[2] mb-3">{item.text}</p>
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => setDhikrCounts(p => ({ ...p, [i]: Math.min(item.count, (p[i] || 0) + 1) }))}
                              className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-black transition-all active:scale-90 ${isComplete ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'}`}>
                              {isComplete ? <BadgeCheck size={24} /> : count}
                            </button>
                            {!isComplete && (
                              <span className="text-[10px] text-gray-500">/{item.count}</span>
                            )}
                          </div>
                          {isComplete && <p className="text-[10px] text-emerald-400 mt-2 font-bold">أحسنت! 🎉</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. خطبة عرفة */}
            {activeSection === 'sermon' && (
              <div className="space-y-4">
                <div className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-5 md:p-8 text-center">
                  <Book size={32} className="mx-auto text-violet-400 mb-3" />
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    خطبة عرفة هي الخطبة التي تُلقى يوم عرفة في مسجد نمرة بصعيد عرفة، ويستمع إليها الحجاج قبل الصلاة، وتعد من أهم الخطب في العام.
                  </p>
                </div>
                <div className="space-y-2">
                  {SERMON_NOTES.map((note, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-[#1e293b]/30 border border-white/5 rounded-xl p-3 md:p-4 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-violet-400">{i + 1}</span>
                      </div>
                      <p className="text-gray-300 text-xs md:text-sm">{note}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-violet-500/10 to-transparent border border-violet-500/20 rounded-2xl p-5 text-center">
                  <p className="text-violet-300 text-xs md:text-sm font-bold">"الْحَجُّ عَرَفَةُ، فَمَنْ أَدْرَكَ عَرَفَةَ فَقَدْ أَدْرَكَ الْحَجَّ"</p>
                </div>
              </div>
            )}

            {/* 6. رحلة الحاج */}
            {activeSection === 'hajj' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-cyan-900/30 to-emerald-900/20 border border-cyan-500/20 rounded-[2rem] p-5 md:p-8 text-center">
                  <Globe size={36} className="mx-auto text-cyan-400 mb-3" />
                  <p className="text-gray-200 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                    تخيّل نفسك في صعيد عرفة… ملايين الحجاج بلباس الإحرام، رافعين أكف الضراعة، كلهم يرجون رحمة الله… إنه المشهد الأعظم في رحلة الإيمان.
                  </p>
                </div>
                <div className="space-y-2">
                  {HAJJ_SCHEDULE.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-[#1e293b]/40 border border-white/5 rounded-2xl p-4 md:p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={12} className="text-cyan-400" />
                        <span className="text-xs md:text-sm font-bold text-cyan-300">{item.time}</span>
                        <span className="text-[9px] text-gray-500">{item.duration}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {item.activities.map((act, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-gray-400 text-[11px] md:text-xs">
                            <Star size={8} className="text-cyan-500" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. بطاقات التهنئة */}
            {activeSection === 'cards' && (
              <div className="space-y-4">
                <div className="flex justify-center gap-2 flex-wrap">
                  {CARD_MESSAGES.map((_, i) => (
                    <button key={i} onClick={() => setCardIndex(i)}
                      className={`w-3 h-3 rounded-full transition-all ${cardIndex === i ? 'bg-fuchsia-400 w-6' : 'bg-white/10'}`} />
                  ))}
                </div>
                <motion.div key={cardIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-fuchsia-900/30 via-rose-900/20 to-pink-900/30 border border-fuchsia-500/20 rounded-[2.5rem] p-6 md:p-10 text-center shadow-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-[10px] font-bold mb-4">
                    <Share2 size={10} /> {CARD_MESSAGES[cardIndex].title}
                  </div>
                  <p className="text-white text-base md:text-xl leading-[2] md:leading-[2.5] font-medium">
                    {CARD_MESSAGES[cardIndex].msg}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button onClick={() => handleCopy(CARD_MESSAGES[cardIndex].msg)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] md:text-xs font-bold transition-all">
                      {copiedText === CARD_MESSAGES[cardIndex].msg ? <><Check size={14} /> تم النسخ</> : <><Copy size={14} /> نسخ</>}
                    </button>
                    <button onClick={() => { navigator.share ? navigator.share({ title: CARD_MESSAGES[cardIndex].title, text: CARD_MESSAGES[cardIndex].msg }) : handleCopy(CARD_MESSAGES[cardIndex].msg); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 text-[10px] md:text-xs font-bold transition-all">
                      <Share2 size={14} /> مشاركة
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 8. الفضائل والأحاديث */}
            {activeSection === 'hadith' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-900/20 to-green-900/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
                  <BookOpen size={28} className="mx-auto text-emerald-400 mb-2" />
                  <p className="text-gray-400 text-xs md:text-sm">الأحاديث الصحيحة الواردة في فضل يوم عرفة</p>
                </div>
                {HADITHS.map((hadith, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                    className="bg-[#1e293b]/40 border border-white/5 hover:border-emerald-500/20 rounded-2xl p-5 md:p-6 transition-all">
                    <p className="font-quran text-lg md:text-2xl text-white/90 leading-[2.5] text-center mb-4">{hadith.text}</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <BadgeCheck size={14} className="text-emerald-400" />
                      <span className="text-[11px] md:text-xs text-emerald-400 font-bold">{hadith.source}</span>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3 md:p-4 border border-white/5">
                      <p className="text-gray-400 text-[11px] md:text-sm leading-relaxed">{hadith.explanation}</p>
                    </div>
                    <button onClick={() => handleCopy(hadith.text)} className="mt-2 mx-auto flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-emerald-400">
                      {copiedText === hadith.text ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ الحديث</>}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 9. العائلة والأطفال */}
            {activeSection === 'family' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-teal-900/20 to-cyan-900/10 border border-teal-500/20 rounded-2xl p-5 text-center">
                  <Baby size={32} className="mx-auto text-teal-400 mb-2" />
                  <p className="text-gray-300 text-sm">أفكار عملية لإشراك أطفالك في روحانية يوم عرفة</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FAMILY_ACTIVITIES.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-[#1e293b]/40 border border-white/5 hover:border-teal-500/20 rounded-2xl p-4 md:p-5 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                            <Icon size={18} />
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-white">{item.title}</h3>
                        </div>
                        <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 10. أبواب الخير */}
            {activeSection === 'charity' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/10 border border-yellow-500/20 rounded-2xl p-5 text-center">
                  <Gift size={32} className="mx-auto text-yellow-400 mb-2" />
                  <p className="text-gray-300 text-sm">أعمال صالحة متنوعة تغتنم بها أجر هذا اليوم العظيم</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CHARITY_IDEAS.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-[#1e293b]/40 border border-white/5 hover:border-yellow-500/20 rounded-2xl p-4 md:p-5 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-xl bg-white/5 ${item.color}`}>
                            <Icon size={18} />
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-white">{item.title}</h3>
                        </div>
                        <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Dua */}
            <div className="text-center py-6 md:py-8">
              <p className="font-quran text-lg md:text-2xl text-emerald-400/70 leading-[2.5]">
                ﴿ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ﴾
              </p>
              <p className="text-gray-500 text-[10px] md:text-xs mt-3 font-medium">
                تقبل الله منا ومنكم صالح الأعمال • يوم عرفة • نور الإسلام
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ArafahDay;
