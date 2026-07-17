import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReelsJob } from './ReelsJobContext';
import { Loader2, CheckCircle2, XCircle, Download, X, ArrowRight } from 'lucide-react';

interface Props {
  onNavigateToStudio: () => void;
  isOnStudio: boolean;
}

export const ReelsGlobalProgress = ({ onNavigateToStudio, isOnStudio }: Props) => {
  const { jobId, jobStatus, genError, resultUrl, clearJob } = useReelsJob();

  // Don't show if no active job, or if user is already on the studio page
  if ((!jobId && !genError) || isOnStudio) return null;

  const isDone = jobStatus?.status === 'done';
  const isError = jobStatus?.status === 'error' || !!genError;
  const progress = jobStatus?.progress || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-2 left-2 right-2 z-[100] md:left-auto md:right-4 md:top-4 md:w-[380px]"
      >
        <div className="bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 p-3 relative overflow-hidden">
          
          {/* Thin progress line at top */}
          {!isDone && !isError && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500/20' : isError ? 'bg-rose-500/20' : 'bg-blue-500/20'}`}>
              {isDone ? (
                <CheckCircle2 className="text-emerald-400" size={17} />
              ) : isError ? (
                <XCircle className="text-rose-400" size={17} />
              ) : (
                <Loader2 className="text-blue-400 animate-spin" size={17} />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-xs truncate">
                {isError 
                  ? 'حدث خطأ'
                  : isDone 
                    ? '✅ تم تجهيز الريلز!'
                    : `جاري التجهيز... ${Math.round(progress)}%`}
              </p>
              <p className="text-white/40 text-[10px] truncate">
                {isError 
                  ? (genError || jobStatus?.error || '')
                  : isDone 
                    ? 'اضغط لتحميل الفيديو'
                    : (jobStatus?.message || 'يرجى الانتظار')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isDone && resultUrl ? (
                <a 
                  href={resultUrl}
                  download="Quran-Reel.mp4"
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={12} /> تحميل
                </a>
              ) : !isError && !isDone ? (
                <button
                  onClick={onNavigateToStudio}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[11px] font-bold transition-colors"
                >
                  <ArrowRight size={11} /> العودة
                </button>
              ) : null}

              <button 
                onClick={clearJob} 
                className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
