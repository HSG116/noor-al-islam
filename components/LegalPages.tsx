import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, FileText, Cookie, Users, Mail, Scale } from 'lucide-react';

interface LegalPagesProps {
  onBack: () => void;
}

const pages = [
  {
    id: 'privacy',
    label: 'سياسة الخصوصية',
    icon: <Shield size={20} />,
    content: [
      { title: 'المقدمة', body: 'نحن في نور الإسلام نلتزم بحماية خصوصية مستخدمينا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها عند استخدام تطبيقنا.' },
      { title: 'المعلومات التي نجمعها', body: 'قد نجمع المعلومات التالية: البريد الإلكتروني، الاسم الكامل، البلد والمدينة، وتقدمك في الحفظ والقراءة. يتم جمع هذه المعلومات فقط عند إنشاء حساب أو استخدام خدماتنا.' },
      { title: 'كيف نستخدم معلوماتك', body: 'نستخدم معلوماتك لتقديم وتحسين خدماتنا، وتخصيص تجربتك، والتواصل معك بشأن التحديثات، ودعم المسابقات والتحديات.' },
      { title: 'حماية المعلومات', body: 'نستخدم إجراءات أمنية مشددة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو الإفشاء.' },
      { title: 'مشاركة المعلومات', body: 'لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا بموجب القانون أو لحماية حقوقنا.' },
      { title: 'حقوقك', body: 'لديك الحق في طلب الوصول إلى بياناتك أو تعديلها أو حذفها في أي وقت. يمكنك إدارة حسابك من صفحة الإعدادات.' },
      { title: 'التحديثات على السياسة', body: 'قد نقوم بتحديث سياسة الخصوصية من وقت لآخر وسنبلغك بأي تغييرات جوهرية.' },
      { title: 'اتصل بنا', body: 'للاستفسارات المتعلقة بالخصوصية، يرجى التواصل معنا عبر صفحة "اتصل بنا".' },
    ],
  },
  {
    id: 'terms',
    label: 'شروط الاستخدام',
    icon: <FileText size={20} />,
    content: [
      { title: 'القبول بالشروط', body: 'باستخدامك لتطبيق نور الإسلام، فإنك توافق على شروط الاستخدام هذه. إذا كنت لا توافق، يرجى عدم استخدام التطبيق.' },
      { title: 'الحسابات', body: 'أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يجب أن تبلغنا فوراً عن أي استخدام غير مصرح به.' },
      { title: 'المحتوى', body: 'جميع محتويات التطبيق بما في ذلك النصوص والصور والصوتيات هي ملك لتطبيق نور الإسلام ما لم يُذكر خلاف ذلك.' },
      { title: 'الاستخدام المسموح', body: 'يُسمح باستخدام التطبيق للأغراض الشخصية والتعليمية فقط. لا يُسمح بإعادة بيع المحتوى أو توزيعه تجارياً.' },
      { title: 'المسابقات', body: 'المشاركة في المسابقات تخضع للشروط والأحكام المعلنة في كل مسابقة. يحق للإدارة استبعاد أي مشارك يخالف القواعد.' },
      { title: 'حدود المسؤولية', body: 'نور الإسلام غير مسؤول عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام التطبيق.' },
      { title: 'التعديلات', body: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنقوم بإخطار المستخدمين المسجلين بأي تغييرات.' },
    ],
  },
  {
    id: 'cookies',
    label: 'سياسة ملفات تعريف الارتباط',
    icon: <Cookie size={20} />,
    content: [
      { title: 'ما هي ملفات تعريف الارتباط؟', body: 'ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة موقعنا. تساعدنا في تحسين تجربتك.' },
      { title: 'كيف نستخدمها', body: 'نستخدم ملفات تعريف الارتباط لتذكر تفضيلاتك، وتحليل استخدام التطبيق، وتحسين خدماتنا. لا نستخدمها لجمع معلومات شخصية دون علمك.' },
      { title: 'أنواع ملفات التعريف', body: 'نستخدم ملفات تعريف الارتباط الأساسية (الضرورية للتشغيل) وملفات التحليل (لفهم كيفية استخدام التطبيق).' },
      { title: 'التحكم', body: 'يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح. قد يؤثر تعطيلها على بعض وظائف التطبيق.' },
    ],
  },
  {
    id: 'about',
    label: 'من نحن',
    icon: <Users size={20} />,
    content: [
      { title: 'رؤيتنا', body: 'نور الإسلام هو تطبيق إسلامي شامل يهدف إلى تقديم تجربة متكاملة للمسلمين في جميع أنحاء العالم. نسعى لأن نكون رفيقك الإيماني في كل زمان ومكان.' },
      { title: 'رسالتنا', body: 'تقديم محتوى إسلامي موثوق وسهل الوصول، مع أدوات تفاعلية تساعد المسلمين على تلاوة القرآن وحفظه وفهمه، بالإضافة إلى خدمات إسلامية متنوعة.' },
      { title: 'خدماتنا', body: 'المصحف الشريف مع التلاوات، خطط الحفظ والمتابعة، الأذكار، مواقيت الصلاة، القبلة، المسابقات الإسلامية، المكتبة الحديثية، الفتاوى، الراديو، والمزيد.' },
      { title: 'قيمنا', body: 'الأصالة والموثوقية في المحتوى، الابتكار في التقديم، سهولة الاستخدام، والالتزام بتعاليم الإسلام السمحة.' },
    ],
  },
  {
    id: 'contact',
    label: 'اتصل بنا',
    icon: <Mail size={20} />,
    content: [
      { title: 'يسعدنا تواصلك', body: 'نرحب باستفساراتكم وملاحظاتكم واقتراحاتكم. فريق نور الإسلام متاح للرد على جميع استفساراتكم.' },
      { title: 'الدعم الفني', body: 'للاستفسارات التقنية والمشكلات المتعلقة بالتطبيق، يرجى التواصل عبر البريد الإلكتروني أدناه.' },
      { title: 'اقتراحات', body: 'نقدر اقتراحاتكم لتطوير التطبيق وإضافة ميزات جديدة تخدم المجتمع الإسلامي.' },
      { title: 'الشراكات', body: 'للراغبين في التعاون أو الشراكة مع نور الإسلام، يرجى التواصل معنا.' },
    ],
  },
];

export const LegalPages: React.FC<LegalPagesProps> = ({ onBack }) => {
  const [activePage, setActivePage] = useState(pages[0].id);

  const currentPage = pages.find(p => p.id === activePage) || pages[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-16">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          <ArrowRight size={24} />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <Scale className="text-emerald-400" size={24} />
          <h1 className="text-2xl md:text-3xl font-black text-white">الصفحات القانونية</h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activePage === page.id
                ? 'bg-emerald-500 text-[#0f172a] shadow-lg shadow-emerald-900/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            {page.icon}
            {page.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6 md:p-10 rounded-[2.5rem] border border-white/5"
      >
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            {currentPage.icon}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">{currentPage.label}</h2>
        </div>

        <div className="space-y-8">
          {currentPage.content.map((section, i) => (
            <div key={i}>
              <h3 className="text-base md:text-lg font-bold text-emerald-300 mb-2">{section.title}</h3>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
