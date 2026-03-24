import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMaximize2, FiMinimize2, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const SCORM_API = '/api/scorm';

const ScormPlayerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const iframeRef = useRef(null);
  const completionSentRef = useRef(false);

  const [course, setCourse] = useState(null);
  const [entryPoint, setEntryPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  const [logs, setLogs] = useState([]);
  const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 10));

  const cmiRef = useRef({
    'cmi.suspend_data': '',
    'cmi.core.lesson_location': '',
    'cmi.location': '',
    'cmi.core.lesson_status': 'incomplete',
    'cmi.completion_status': 'incomplete',
    'cmi.core.entry': 'ab-initio',
    'cmi.entry': 'ab-initio',
    'cmi.success_status': 'unknown',
    'cmi.score.raw': '',
    'cmi.core.session_time': '0000:00:00.00',
    'cmi.session_time': 'PT0H0M0S',
  });

  const parseScormTime = (time, version) => {
    try {
      if (version === '1.2') {
        const parts = time.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseFloat(parts[2]) || 0;
        return h * 3600 + m * 60 + s;
      } else {
        const match = time.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
        if (!match) return 0;
        return (parseFloat(match[1] || 0) * 3600) + (parseFloat(match[2] || 0) * 60) + parseFloat(match[3] || 0);
      }
    } catch (e) { return 0; }
  };

  const handleCompletion = async () => {
    if (completionSentRef.current || !user?.id) return;
    try {
      completionSentRef.current = true;
      addLog('🚀 Reporting Completion (100%)...');
      cmiRef.current['cmi.core.lesson_status'] = 'completed';
      cmiRef.current['cmi.completion_status'] = 'completed';
      const res = await fetch(`${SCORM_API}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId })
      });
      if (res.ok) addLog('✅ Completion Saved');
    } catch (err) { addLog('❌ Completion Error'); }
  };

  const syncToBackend = async () => {
    if (!user?.id) return;
    try {
      const s12Time = cmiRef.current['cmi.core.session_time'];
      const s2004Time = cmiRef.current['cmi.session_time'];
      const sessionSeconds = s12Time !== '0000:00:00.00' 
        ? parseScormTime(s12Time, '1.2') 
        : parseScormTime(s2004Time, '2004');

      await fetch('/api/payments/suspend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          courseId, 
          suspendData: cmiRef.current['cmi.suspend_data'],
          lessonLocation: cmiRef.current['cmi.core.lesson_location'] || cmiRef.current['cmi.location'],
          status: cmiRef.current['cmi.core.lesson_status'] || cmiRef.current['cmi.completion_status'],
          sessionTime: sessionSeconds
        })
      });
      
      // Reset session time after sync to avoid double counting
      if (sessionSeconds > 0) {
        cmiRef.current['cmi.core.session_time'] = '0000:00:00.00';
        cmiRef.current['cmi.session_time'] = 'PT0H0M0S';
      }
    } catch (e) {}
  };

  const onStatusSet = async (status, progressValue = null) => {
    const lowerStatus = status?.toLowerCase() || '';
    const currentStatus = cmiRef.current['cmi.core.lesson_status'] || cmiRef.current['cmi.completion_status'];
    if ((currentStatus === 'completed' || currentStatus === 'passed') && (lowerStatus === 'incomplete' || lowerStatus === 'browsed')) {
      addLog('🛡️ Protected Finished Status');
      return;
    }
    addLog(`📡 SET Status: ${status}${progressValue !== null ? ` (${progressValue}%)` : ''}`);
    if (lowerStatus === 'completed' || lowerStatus === 'passed') handleCompletion();
    else if (progressValue !== null) {
      try {
        await fetch('/api/payments/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, courseId, progress: progressValue })
        });
      } catch (err) {}
    }
    syncToBackend();
  };

  // --- UNIVERSAL SCORM ENGINE ---
  const scormAPI = useMemo(() => {
    const api12 = {
      LMSInitialize: (arg) => { 
        addLog('🔌 SCORM 1.2 Handshake'); 
        const hasData = (cmiRef.current['cmi.suspend_data'] || cmiRef.current['cmi.core.lesson_location']);
        cmiRef.current['cmi.core.entry'] = hasData ? 'resume' : 'ab-initio';
        return 'true'; 
      },
      LMSFinish: (arg) => { syncToBackend(); addLog('🔌 SCORM 1.2 Finished'); return 'true'; },
      LMSGetValue: (element) => {
        if (element === 'cmi.core.entry') return cmiRef.current['cmi.core.entry'] || 'ab-initio';
        if (element === 'cmi.core.credit') return 'credit';
        if (element === 'cmi.core.lesson_mode') return 'normal';
        if (element === 'cmi.core.student_id') return user?.id?.toString() || 'guest';
        if (element === 'cmi.core.student_name') return user?.name || 'Guest Student';
        return cmiRef.current[element] || '';
      },
      LMSSetValue: (element, value) => {
        addLog(`📝 1.2 Set: ${element}`);
        cmiRef.current[element] = value;
        if (element === 'cmi.core.lesson_status') onStatusSet(value);
        else if (element === 'cmi.core.score.raw') {
          const val = Math.round(parseFloat(value));
          if (!isNaN(val)) onStatusSet('incomplete', val);
        } else syncToBackend();
        return 'true';
      },
      LMSCommit: (arg) => { syncToBackend(); return 'true'; },
      LMSGetLastError: () => '0',
      LMSGetErrorString: (errCode) => 'No error',
      LMSGetDiagnostic: (errCode) => 'No error',
    };

    const api2004 = {
      Initialize: (arg) => { 
        addLog('🔌 SCORM 2004 Handshake'); 
        const hasData = (cmiRef.current['cmi.suspend_data'] || cmiRef.current['cmi.location']);
        cmiRef.current['cmi.entry'] = hasData ? 'resume' : 'ab-initio';
        return 'true'; 
      },
      Terminate: (arg) => { syncToBackend(); addLog('🔌 SCORM 2004 Terminated'); return 'true'; },
      GetValue: (element) => {
        if (element === 'cmi.entry') return cmiRef.current['cmi.entry'] || 'ab-initio';
        if (element === 'cmi.credit') return 'credit';
        if (element === 'cmi.mode') return 'normal';
        if (element === 'cmi.learner_id') return user?.id?.toString() || 'guest';
        if (element === 'cmi.learner_name') return user?.name || 'Guest Student';
        return cmiRef.current[element] || '';
      },
      SetValue: (element, value) => {
        addLog(`📝 2004 Set: ${element}`);
        cmiRef.current[element] = value;
        if (element === 'cmi.completion_status' || element === 'cmi.success_status') onStatusSet(value);
        else if (element === 'cmi.progress_measure' || element === 'cmi.score.scaled') {
          const val = Math.round(parseFloat(value) * 100);
          if (!isNaN(val)) onStatusSet('incomplete', val);
        } else if (element === 'cmi.score.raw') {
          const val = Math.round(parseFloat(value));
          if (!isNaN(val)) onStatusSet('incomplete', val);
        } else syncToBackend();
        return 'true';
      },
      Commit: (arg) => { syncToBackend(); return 'true'; },
      GetLastError: () => '0',
      GetErrorString: (errCode) => 'No error',
      GetDiagnostic: (errCode) => 'No error',
    };

    return { api12, api2004 };
  }, [user, courseId]);

  // 1. SYNC LOCK: Expose APIs BEFORE anything else
  useLayoutEffect(() => {
    const bindAPIs = (win) => {
      if (!win) return;
      try {
        // SCORM 1.2
        win.API = scormAPI.api12;
        win.API_Adapter = scormAPI.api12;
        
        // SCORM 2004
        win.API_1484_11 = scormAPI.api2004;
        
        // Helper Shims
        win.findAPI = (w) => (w.API || w.API_Adapter || w.API_1484_11 ? w : null);
        win.GetAPI = () => (scormAPI.api12);
        win.IsLmsPresent = () => true;
        
        // Articulate/Rise requirements
        win.name = "LMSFrame";
      } catch (e) {}
    };

    // Bind to current window and potential parents/openers
    bindAPIs(window);
    
    // Explicitly bind to standard global search points
    try {
      if (window.parent && window.parent !== window) bindAPIs(window.parent);
      if (window.top && window.top !== window) bindAPIs(window.top);
      if (window.opener) bindAPIs(window.opener);
    } catch (e) {}

    return () => {
      try {
        delete window.API; delete window.API_Adapter; delete window.API_1484_11; delete window.findAPI;
      } catch (e) {}
    };
  }, [scormAPI]);

  // 2. IFRAME LOCK: Injected explicitly upon render AND load
  const injectToIframe = () => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.API = scormAPI.api12;
        win.API_Adapter = scormAPI.api12;
        win.API_1484_11 = scormAPI.api2004;
        win.findAPI = (w) => (w.API || w.API_Adapter || w.API_1484_11 ? w : null);
        win.IsLmsPresent = () => true;
        console.log('🚀 LMS API Injected to Content Window');
      }
    } catch (e) {}
  };

  useEffect(() => {
    let autoSaveTimer;
    const loadCourse = async () => {
      try {
        setLoading(true);
        const [courseRes, scormRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/scorm/entry/${courseId}`)
        ]);
        if (!courseRes.ok || !scormRes.ok) throw new Error('Course not found.');
        const courseData = await courseRes.json();
        const scormData = await scormRes.json();
        setCourse(courseData);
        setEntryPoint(scormData.entryPoint);

        if (user?.id) {
          const suspRes = await fetch(`/api/payments/suspend/${user.id}/${courseId}`);
          if (suspRes.ok) {
            const data = await suspRes.json();
            cmiRef.current['cmi.suspend_data'] = data.suspendData || '';
            cmiRef.current['cmi.core.lesson_location'] = data.lessonLocation || '';
            cmiRef.current['cmi.location'] = data.lessonLocation || '';
            cmiRef.current['cmi.core.lesson_status'] = data.status || 'incomplete';
            cmiRef.current['cmi.completion_status'] = data.status || 'incomplete';
            addLog('📖 Progress Restored');
          }
        }

        autoSaveTimer = setInterval(() => {
          syncToBackend();
          try {
            const win = iframeRef.current?.contentWindow;
            if (win?.Rise?.state?.progress !== undefined) {
               const p = Math.round(win.Rise.state.progress * 100);
               if (p > (cmiRef.current['_last_p'] || 0)) {
                 cmiRef.current['_last_p'] = p;
                 onStatusSet('incomplete', p);
               }
            }
          } catch(e) {}
        }, 15000); 
        setIsDataReady(true);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    loadCourse();
    return () => clearInterval(autoSaveTimer);
  }, [courseId, user]);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  if (loading && !isDataReady) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4 text-white">
        <FiLoader className="w-12 h-12 animate-spin text-primary" />
        <p className="text-lg font-bold text-slate-300">Synchronizing LMS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-6 text-white p-8">
        <div className="text-8xl mb-4">📦</div>
        <h2 className="text-3xl font-black text-center">LMS Handshake Failed</h2>
        <p className="text-slate-400 font-medium text-center">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-8 px-8 py-4 bg-primary text-white rounded-2xl font-black transition-all shadow-xl shadow-primary/20">
          <FiArrowLeft className="inline mr-2" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#0F172A] ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      <div className="flex items-center justify-between px-6 py-4 bg-[#1E293B] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => { syncToBackend(); navigate('/dashboard'); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm">
            <FiArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Exit Course</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-1">
             <h1 className="text-white font-black text-sm sm:text-base leading-tight line-clamp-1">{course?.title}</h1>
             <span className="hidden md:inline px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded ml-2 tracking-widest uppercase">LMS Verified</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden lg:flex flex-col items-end gap-1 overflow-hidden h-10 pr-4">
              {logs.map((log, i) => (
                <div key={i} className={`text-[10px] font-bold ${i === 0 ? 'text-primary' : 'text-slate-500'}`}>{log}</div>
              ))}
           </div>
          <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        {isDataReady && entryPoint ? (
          <iframe
            ref={iframeRef}
            id="scorm-frame"
            src={entryPoint}
            title="LMS"
            onLoad={injectToIframe}
            className="w-full h-full border-0 focus:outline-none"
            style={{ minHeight: 'calc(100vh - 72px)' }}
            allowFullScreen
            allow="fullscreen; autoplay; encrypted-media"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
             <FiLoader className="w-10 h-10 animate-spin text-primary" />
             <p className="text-slate-400 font-extrabold tracking-tighter uppercase text-xs">Handshaking with course content...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScormPlayerPage;
