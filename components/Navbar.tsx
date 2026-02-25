
import React, { useState } from 'react';
import { ViewState } from '../types';
import {
  BookOpen, Home, CalendarClock, Sun, Clock, MapPin,
  Radio as RadioIcon, Sparkles, MoreHorizontal, X, ChevronLeft, Disc, Library, HelpCircle, Trophy
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryItems = [
    { id: ViewState.HOME, label: 'الرئيسية', icon: <Home size={20} /> },
    { id: ViewState.QURAN_LIST, label: 'المصحف', icon: <BookOpen size={20} /> },
    { id: ViewState.AZKAR, label: 'الأذكار', icon: <Sun size={20} /> },
    { id: ViewState.PRAYER_TIMES, label: 'الصلاة', icon: <Clock size={20} /> },
    { id: ViewState.RADIO, label: 'الراديو', icon: <RadioIcon size={20} /> },
  ];

  const moreItems = [
    { id: ViewState.FATAWA, label: 'الأحكام الشائعة', desc: 'موسوعة الفتاوى والأحكام', icon: <HelpCircle size={24} />, color: 'text-emerald-400' },
    { id: ViewState.HADITH, label: 'الموسوعة الحديثية', desc: 'صحيح البخاري ومسلم والسنن', icon: <Library size={24} />, color: 'text-amber-400' },
    { id: ViewState.TASBIH, label: 'المسبحة', desc: 'تسبيح وذكر وتثبيت', icon: <Disc size={24} />, color: 'text-amber-400' },
    { id: ViewState.MOSQUES, label: 'المساجد', desc: 'ابحث عن أقرب بيت لله', icon: <MapPin size={24} />, color: 'text-teal-400' },
    { id: ViewState.REMIX, label: 'ريمكس رمضان', desc: 'صمم بطاقات تهنئة فاخرة', icon: <Sparkles size={24} />, color: 'text-rose-400' },
    { id: ViewState.COMPETITIONS, label: 'مسابقات رمضان', desc: 'شارك واربح جوائز قيمة', icon: <Trophy size={24} />, color: 'text-yellow-400' }
  ];

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsMoreOpen(false);
  };

  const isMoreActive = moreItems.some(item => item.id === currentView);

  return (
    <>
      {/* More Menu Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isMoreOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMoreOpen(false)}
      />

      <div
        className={`fixed bottom-0 inset-x-0 z-[70] transition-transform duration-500 ease-out transform ${isMoreOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto max-w-lg bg-[#0f172a] border-t border-white/10 rounded-t-[2.5rem] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white">المزيد من الأقسام</h3>
            <button onClick={() => setIsMoreOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
            {moreItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 
                  ${currentView === item.id
                    ? 'bg-emerald-600/20 border-emerald-500/50 shadow-lg'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className={`p-3 rounded-xl bg-black/20 ${item.color} group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="flex-1 text-right">
                  <p className={`font-bold text-base ${currentView === item.id ? 'text-white' : 'text-gray-200'}`}>{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="fixed bottom-4 inset-x-3 z-50 md:top-6 md:bottom-auto pointer-events-none">
        <div className="glass-panel rounded-2xl md:rounded-3xl p-1.5 flex items-center shadow-2xl pointer-events-auto mx-auto w-full max-w-5xl overflow-hidden border border-white/10">
          <div className="flex items-center gap-1 md:gap-4 w-full px-1 justify-between md:justify-center">
            {primaryItems.map((item) => {
              const isActive = currentView === item.id || (item.id === ViewState.QURAN_LIST && currentView === ViewState.QURAN_READ);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    relative flex items-center gap-2 px-3 py-2.5 md:px-6 md:py-3 rounded-2xl transition-all duration-500 group shrink-0
                    ${isActive
                      ? 'bg-emerald-600 text-white shadow-lg scale-105 z-10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>

                  <span className={`text-[10px] md:text-sm font-black whitespace-nowrap transition-all duration-500 overflow-hidden ${isActive ? 'max-w-[70px] md:max-w-[100px] opacity-100' : 'max-w-0 opacity-0 hidden md:block md:max-w-[100px] md:opacity-100'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* The "More" Button */}
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`
                relative flex items-center gap-2 px-3 py-2.5 md:px-6 md:py-3 rounded-2xl transition-all duration-500 group shrink-0
                ${isMoreActive
                  ? 'bg-emerald-600 text-white shadow-lg scale-105 z-10'
                  : isMoreOpen ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <MoreHorizontal size={20} className={`transition-transform duration-300 ${isMoreOpen ? 'rotate-90' : ''}`} />
              <span className={`text-[10px] md:text-sm font-black whitespace-nowrap transition-all duration-500 overflow-hidden ${isMoreActive ? 'max-w-[70px] md:max-w-[100px] opacity-100' : 'max-w-0 opacity-0 hidden md:block md:max-w-[100px] md:opacity-100'}`}>
                المزيد
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};