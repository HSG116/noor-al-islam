import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface JobStatusData {
  status: 'processing' | 'done' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  outputs?: any[];
  caption?: string;
  ready?: boolean;
}

interface ReelsJobContextProps {
  jobId: string | null;
  jobStatus: JobStatusData | null;
  resultUrl: string | null;
  genError: string | null;
  setJobId: (id: string | null) => void;
  clearJob: () => void;
}

const ReelsJobContext = createContext<ReelsJobContextProps | undefined>(undefined);

export const ReelsJobProvider = ({ children }: { children: ReactNode }) => {
  const [jobId, setJobIdState] = useState<string | null>(() => {
    return localStorage.getItem('active_reels_job_id');
  });
  const [jobStatus, setJobStatus] = useState<JobStatusData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const setJobId = (id: string | null) => {
    setJobIdState(id);
    if (id) {
      localStorage.setItem('active_reels_job_id', id);
    } else {
      localStorage.removeItem('active_reels_job_id');
    }
    // Reset previous states when setting a new job
    setJobStatus(null);
    setResultUrl(null);
    setGenError(null);
  };

  const clearJob = () => {
    setJobId(null);
  };

  // Poll the job status when jobId is present
  useEffect(() => {
    if (!jobId) return;

    let isPolling = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/reels/status/${jobId}`);
        if (!res.ok) {
          if (res.status === 404) {
            // Job might have been cleaned up on the server
            if (isPolling) {
              setGenError('انتهت صلاحية المهمة أو لم يتم العثور عليها.');
              localStorage.removeItem('active_reels_job_id');
            }
          }
          return;
        }
        
        const d: JobStatusData = await res.json();
        if (!isPolling) return;
        
        setJobStatus(d);
        
        if (d.status === 'done') {
          setResultUrl(`/reels-media/${jobId}.mp4`);
          // Note: we leave the job in state so the user can download it. 
          // They must manually click "clearJob" to dismiss the UI.
        } else if (d.status === 'error') {
          setGenError(d.error || 'حدث خطأ غير متوقع أثناء توليد الفيديو.');
        } else {
          // Still processing, poll again after 2s
          setTimeout(poll, 2000);
        }
      } catch (err) {
        if (!isPolling) return;
        // On transient network errors, keep polling but maybe wait a bit longer
        setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      isPolling = false;
    };
  }, [jobId]);

  return (
    <ReelsJobContext.Provider value={{ jobId, jobStatus, resultUrl, genError, setJobId, clearJob }}>
      {children}
    </ReelsJobContext.Provider>
  );
};

export const useReelsJob = () => {
  const context = useContext(ReelsJobContext);
  if (context === undefined) {
    throw new Error('useReelsJob must be used within a ReelsJobProvider');
  }
  return context;
};
