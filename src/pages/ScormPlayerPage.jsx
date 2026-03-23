import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMaximize2, FiMinimize2, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const SCORM_API = '/api/scorm';
const COURSES_API = '/api/courses';

const ScormPlayerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  });

  const handleCompletion = async () => {
    if (completionSentRef.current || !user?.id) return;
    
    try {
      completionSentRef.current = true;
      addLog('🚀 Reporting Completion (100%)...');
      
      // Update local state immediately to protect against race conditions
      cmiRef.current['cmi.core.lesson_status'] = 'completed';
      cmiRef.current['cmi.completion_status'] = 'completed';

      const res = await fetch(`${SCORM_API}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId })
      });
      
      if (res.ok) {
        addLog('✅ Completion Saved to DB');
        // Final sync of suspend data alongside completion
      }
    } catch (err) {
      addLog('❌ Completion Error: ' + err.message);
    }
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

        if (!courseRes.ok || !scormRes.ok) throw new Error('Course or SCORM package not found.');
        
        const courseData = await courseRes.json();
        const scormData = await scormRes.json();
        setCourse(courseData);
        setEntryPoint(scormData.entryPoint);

        try {
          if (user?.id) {
            const suspRes = await fetch(`/api/payments/suspend/${user.id}/${courseId}`);
            if (suspRes.ok) {
              const data = await suspRes.json();
              cmiRef.current['cmi.suspend_data'] = data.suspendData || '';
              cmiRef.current['cmi.core.lesson_location'] = data.lessonLocation || '';
              cmiRef.current['cmi.location'] = data.lessonLocation || '';
              cmiRef.current['cmi.core.lesson_status'] = data.status || 'incomplete';
              cmiRef.current['cmi.completion_status'] = data.status || 'incomplete';
              cmiRef.current['cmi.success_status'] = data.status === 'passed' ? 'passed' : 'unknown';
              addLog('📖 Progress Restored');
            }
          }
        } catch (err) { console.error('Resume fetch error:', err); }

        const syncToBackend = async () => {
          if (!user?.id) return;
          try {
            await fetch('/api/payments/suspend', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: user.id, 
                courseId, 
                suspendData: cmiRef.current['cmi.suspend_data'],
                lessonLocation: cmiRef.current['cmi.core.lesson_location'] || cmiRef.current['cmi.location'],
                status: cmiRef.current['cmi.core.lesson_status'] || cmiRef.current['cmi.completion_status']
              })
            });
            addLog('💾 Position Synced');
          } catch (e) { /* silent */ }
        };

        const onStatusSet = async (status, progressValue = null) => {
          const lowerStatus = status?.toLowerCase() || '';
          
          // Protect "completed" status - once finished, don't let it go back to incomplete
          const currentStatus = cmiRef.current['cmi.core.lesson_status'] || cmiRef.current['cmi.completion_status'];
          if ((currentStatus === 'completed' || currentStatus === 'passed') && (lowerStatus === 'incomplete' || lowerStatus === 'browsed')) {
            addLog('🛡️ Protected Finished Status');
            return;
          }

          addLog(`📡 SET Status: ${status}${progressValue !== null ? ` (${progressValue}%)` : ''}`);
          
          if (lowerStatus === 'completed' || lowerStatus === 'passed') {
            handleCompletion();
          } else if (progressValue !== null) {
            try {
              await fetch('/api/payments/progress', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, courseId, progress: progressValue })
              });
            } catch (err) { /* silent */ }
          }
          syncToBackend();
        };

        // 4. SCORM 1.2 API
        window.API = {
          LMSInitialize: () => { 
            addLog('🔌 SCORM 1.2 Initialized'); 
            const entryStr = (cmiRef.current['cmi.suspend_data'] || cmiRef.current['cmi.core.lesson_location']) ? 'resume' : 'ab-initio';
            cmiRef.current['cmi.core.entry'] = entryStr;
            return 'true'; 
          },
          LMSFinish: () => { syncToBackend(); addLog('🔌 SCORM 1.2 Finished'); return 'true'; },
          LMSGetValue: (element) => {
            if (element === 'cmi.core.entry') return cmiRef.current['cmi.core.entry'] || 'ab-initio';
            if (element === 'cmi.core.credit') return 'credit';
            if (element === 'cmi.core.lesson_mode') return 'normal';
            if (element === 'cmi.core.student_id') return user?.id || 'guest';
            if (element === 'cmi.core.student_name') return user?.name || 'Guest Student';
            if (element === 'cmi.core.lesson_status') return cmiRef.current[element] || 'incomplete';
            return cmiRef.current[element] || '';
          },
          LMSSetValue: (element, value) => {
            addLog(`📝 1.2 Set: ${element}`);
            cmiRef.current[element] = value;
            if (element === 'cmi.core.lesson_status') {
              onStatusSet(value);
            } else if (element === 'cmi.core.score.raw') {
              const val = Math.round(parseFloat(value));
              if (!isNaN(val)) onStatusSet('incomplete', val);
            } else {
              syncToBackend(); 
            }
            return 'true';
          },
          LMSCommit: () => { syncToBackend(); return 'true'; },
          LMSGetLastError: () => '0',
          LMSGetErrorString: () => 'No error',
          LMSGetDiagnostic: () => 'No error',
        };

        // 5. SCORM 2004 API
        window.API_1484_11 = {
          Initialize: () => { 
            addLog('🔌 SCORM 2004 Initialized'); 
            const entryStr = (cmiRef.current['cmi.suspend_data'] || cmiRef.current['cmi.location']) ? 'resume' : 'ab-initio';
            cmiRef.current['cmi.entry'] = entryStr;
            return 'true'; 
          },
          Terminate: () => { syncToBackend(); addLog('🔌 SCORM 2004 Terminated'); return 'true'; },
          GetValue: (element) => {
            if (element === 'cmi.entry') return cmiRef.current['cmi.entry'] || 'ab-initio';
            if (element === 'cmi.credit') return 'credit';
            if (element === 'cmi.mode') return 'normal';
            if (element === 'cmi.learner_id') return user?.id || 'guest';
            if (element === 'cmi.learner_name') return user?.name || 'Guest Student';
            if (element === 'cmi.completion_status' || element === 'cmi.success_status') return cmiRef.current[element] || 'incomplete';
            return cmiRef.current[element] || '';
          },
          SetValue: (element, value) => {
            addLog(`📝 2004 Set: ${element}`);
            cmiRef.current[element] = value;
            if (element === 'cmi.completion_status' || element === 'cmi.success_status') {
              onStatusSet(value);
            } else if (element === 'cmi.progress_measure' || element === 'cmi.score.scaled') {
              const val = Math.round(parseFloat(value) * 100);
              if (!isNaN(val)) onStatusSet('incomplete', val);
            } else if (element === 'cmi.score.raw') {
              const val = Math.round(parseFloat(value));
              if (!isNaN(val)) onStatusSet('incomplete', val);
            } else {
              syncToBackend();
            }
            return 'true';
          },
          Commit: () => { syncToBackend(); return 'true'; },
          GetLastError: () => '0',
          GetErrorString: () => 'No error',
          GetDiagnostic: () => 'No error',
        };

        const deepPeekProgress = () => {
          try {
            const iframe = document.getElementById('scorm-iframe');
            if (!iframe || !iframe.contentWindow) return;
            
            const win = iframe.contentWindow;
            let foundProgress = null;

            // 1. Try Articulate Rise internal state
            if (win.Rise && win.Rise.state && typeof win.Rise.state.progress === 'number') {
              foundProgress = Math.round(win.Rise.state.progress * 100);
            } 
            // 2. Try generic Articulate Player
            else if (win.Articulate && typeof win.Articulate.progress === 'number') {
              foundProgress = Math.round(win.Articulate.progress * 100);
            }
            // 3. Try standard SCORM objects in the global scope (sometimes mirror)
            else if (win.LMS && typeof win.LMS.progress === 'number') {
              foundProgress = Math.round(win.LMS.progress);
            }

            if (foundProgress !== null && foundProgress > (cmiRef.current['_last_peeked_progress'] || 0)) {
              cmiRef.current['_last_peeked_progress'] = foundProgress;
              onStatusSet('incomplete', foundProgress);
            }
          } catch (e) {
            // Likely cross-domain security if not same-origin, silent fail
          }
        };

        autoSaveTimer = setInterval(() => {
          syncToBackend();
          deepPeekProgress();
        }, 15000); 

        setIsDataReady(true);

      } catch (err) {
        console.error('SCORM Player Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();

    const handleUnload = () => {
      const data = JSON.stringify({ 
        userId: user?.id, 
        courseId, 
        suspendData: cmiRef.current['cmi.suspend_data'],
        lessonLocation: cmiRef.current['cmi.core.lesson_location'] || cmiRef.current['cmi.location'],
        status: cmiRef.current['cmi.core.lesson_status'] || cmiRef.current['cmi.completion_status']
      });
      fetch('/api/payments/suspend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true
      });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (autoSaveTimer) clearInterval(autoSaveTimer);
      window.removeEventListener('beforeunload', handleUnload);
      delete window.API;
      delete window.API_1484_11;
    };
  }, [courseId, user]);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4 text-white">
        <FiLoader className="w-12 h-12 animate-spin text-primary" />
        <p className="text-lg font-bold text-slate-300">Loading SCORM package…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-6 text-white p-8">
        <div className="text-6xl">📦</div>
        <h2 className="text-2xl font-black">SCORM Package Not Found</h2>
        <p className="text-slate-400 font-medium text-center max-w-md">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all"
        >
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#0F172A] ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1E293B] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-white font-black text-sm sm:text-base leading-tight line-clamp-1">
                {course?.title}
              </h1>
              {course?.instructor && (
                <p className="text-slate-400 text-xs font-medium">{course.instructor}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Visual Logs for Debugging */}
           <div className="hidden lg:flex flex-col items-end gap-1 overflow-hidden h-10 pr-4">
              {logs.map((log, i) => (
                <div key={i} className={`text-[10px] font-bold ${i === 0 ? 'text-primary' : 'text-slate-500'}`}>
                  {log}
                </div>
              ))}
           </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* SCORM iframe (Only loads when data is ready) */}
      <div className="flex-1 relative">
        {isDataReady && entryPoint ? (
          <iframe
            id="scorm-frame"
            src={entryPoint}
            title={course?.title || 'SCORM Course'}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 72px)' }}
            allowFullScreen
            allow="fullscreen"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0F172A]">
             <FiLoader className="w-10 h-10 animate-spin text-primary" />
             <p className="text-slate-400 font-bold">Restoring your progress…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScormPlayerPage;
