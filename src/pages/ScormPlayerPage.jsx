import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMaximize2, FiMinimize2, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// RISE SUSPEND_DATA PARSER
// Articulate Rise SCORM 1.2 encodes progress inside cmi.suspend_data as JSON.
// This function extracts a 0-100 integer from it — NO DOM scraping needed.
// ─────────────────────────────────────────────────────────────────────────────
function parseRiseProgress(suspendData) {
  if (!suspendData || typeof suspendData !== 'string') return null;
  try {
    const parsed = JSON.parse(suspendData);

    // Rise 360 most common format: { completion: { percent: 0.29 }, ... }
    if (typeof parsed?.completion?.percent === 'number') {
      return Math.round(parsed.completion.percent * 100);
    }
    // Alternate: { progress: 0.29 }
    if (typeof parsed?.progress === 'number') {
      const val = parsed.progress <= 1 ? parsed.progress * 100 : parsed.progress;
      return Math.round(val);
    }
    // Alternate: { completionPercentage: 29 }
    if (typeof parsed?.completionPercentage === 'number') {
      return Math.round(parsed.completionPercentage);
    }
    // Alternate: array of lesson completion booleans [ true, false, false, ... ]
    if (Array.isArray(parsed)) {
      const total = parsed.length;
      if (total === 0) return null;
      const done = parsed.filter(Boolean).length;
      return Math.round((done / total) * 100);
    }
    // Fallback: walk all keys that contain 'percent' or 'progress'
    for (const key of Object.keys(parsed)) {
      const lower = key.toLowerCase();
      if (lower.includes('percent') || lower.includes('progress')) {
        const val = parseFloat(parsed[key]);
        if (!isNaN(val)) return Math.round(val <= 1 ? val * 100 : val);
      }
    }
  } catch (e) {
    // Not JSON — plain string, ignore
  }
  return null;
}

// Derive progress from lesson_location "currentSlide/totalSlides" format
function deriveProgressFromLocation(location) {
  if (!location) return null;
  const slash = location.match(/^(\d+)\/(\d+)$/);
  if (slash) return Math.round((parseInt(slash[1]) / parseInt(slash[2])) * 100);
  return null;
}

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
    'cmi.core.score.raw': '',
    'cmi.score.raw': '',
    'cmi.score.scaled': '',
    'cmi.progress_measure': '',
    'cmi.core.session_time': '0000:00:00.00',
    'cmi.session_time': 'PT0H0M0S',
    '_last_synced_progress': 0,
  });

  const parseScormTime = (time, version) => {
    try {
      if (version === '1.2') {
        const parts = time.split(':');
        return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseFloat(parts[2]) || 0);
      } else {
        const match = time.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
        if (!match) return 0;
        return (parseFloat(match[1] || 0) * 3600) + (parseFloat(match[2] || 0) * 60) + parseFloat(match[3] || 0);
      }
    } catch (e) { return 0; }
  };

  // ── COMPUTE PROGRESS FROM ALL SCORM DATA SOURCES ──────────────────────────
  // Priority: SCORM 2004 fields → Rise suspend_data JSON → lesson_location → score.raw
  const computeCurrentProgress = () => {
    const cmi = cmiRef.current;

    // 1) SCORM 2004: cmi.progress_measure (0.0–1.0)
    const pm = parseFloat(cmi['cmi.progress_measure']);
    if (!isNaN(pm) && pm > 0) return Math.round(pm * 100);

    // 2) SCORM 2004: cmi.score.scaled (0.0–1.0)
    const scaled = parseFloat(cmi['cmi.score.scaled']);
    if (!isNaN(scaled) && scaled > 0) return Math.round(scaled * 100);

    // 3) Rise SCORM 1.2: parse suspend_data JSON ← THE KEY FIX FOR RISE
    const fromSuspend = parseRiseProgress(cmi['cmi.suspend_data']);
    if (fromSuspend !== null && fromSuspend > 0) return fromSuspend;

    // 4) Lesson location "x/total" format
    const fromLocation = deriveProgressFromLocation(cmi['cmi.core.lesson_location'] || cmi['cmi.location']);
    if (fromLocation !== null && fromLocation > 0) return fromLocation;

    // 5) score.raw as proxy for quiz-based courses
    const scoreRaw = parseFloat(cmi['cmi.core.score.raw'] || cmi['cmi.score.raw']);
    if (!isNaN(scoreRaw) && scoreRaw > 0) return Math.min(100, Math.round(scoreRaw));

    return 0;
  };

  // ── SYNC TO BACKEND ────────────────────────────────────────────────────────
  const syncToBackend = async (forceProgress = null) => {
    if (!user?.id) { console.warn('[SCORM] syncToBackend skipped — no user.id'); return; }
    try {
      const cmi = cmiRef.current;
      const rawSuspendData = cmi['cmi.suspend_data'];

      // ── VERBOSE DEBUG ── Print everything so we can see what Rise actually sends
      console.group('%c[SCORM Debug] syncToBackend called', 'color: #00bcd4; font-weight: bold');
      console.log('forceProgress:', forceProgress);
      console.log('lesson_status:', cmi['cmi.core.lesson_status']);
      console.log('lesson_location:', cmi['cmi.core.lesson_location']);
      console.log('score.raw:', cmi['cmi.core.score.raw']);
      console.log('suspend_data length:', rawSuspendData?.length || 0);
      console.log('suspend_data (first 300 chars):', rawSuspendData?.substring(0, 300) || '(empty)');
      // Try to parse suspend_data
      if (rawSuspendData && rawSuspendData.length > 0) {
        try {
          const parsed = JSON.parse(rawSuspendData);
          console.log('suspend_data parsed JSON:', parsed);
        } catch (e) {
          console.log('suspend_data is NOT JSON — raw string above');
        }
      }
      const progress = forceProgress ?? computeCurrentProgress();
      console.log('computed progress:', progress, '%');
      console.groupEnd();

      const s12Time = cmi['cmi.core.session_time'];
      const s2004Time = cmi['cmi.session_time'];
      const sessionSeconds = s12Time !== '0000:00:00.00'
        ? parseScormTime(s12Time, '1.2')
        : parseScormTime(s2004Time, '2004');

      const payload = {
        userId: user.id,
        courseId,
        suspendData: rawSuspendData,
        lessonLocation: cmi['cmi.core.lesson_location'] || cmi['cmi.location'],
        status: cmi['cmi.core.lesson_status'] || cmi['cmi.completion_status'],
        sessionTime: sessionSeconds,
        progress,
      };

      console.log('%c[SCORM] Sending progress to backend: ' + progress + '%', 'color: #4caf50; font-weight:bold');

      // Send to main endpoint
      await fetch('/api/payments/suspend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Also send to debug endpoint so backend terminal shows the raw data
      fetch('/api/payments/debug-scorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {}); // fire-and-forget

      cmiRef.current['_last_synced_progress'] = progress;
      addLog(`📡 Synced ${progress}%`);

      if (sessionSeconds > 0) {
        cmiRef.current['cmi.core.session_time'] = '0000:00:00.00';
        cmiRef.current['cmi.session_time'] = 'PT0H0M0S';
      }
    } catch (e) {
      console.warn('[SCORM Sync Error]', e);
    }
  };

  // ── COMPLETION ─────────────────────────────────────────────────────────────
  const handleCompletion = async () => {
    if (completionSentRef.current || !user?.id) return;
    completionSentRef.current = true;
    addLog('🏆 Completed!');
    cmiRef.current['cmi.core.lesson_status'] = 'completed';
    cmiRef.current['cmi.completion_status'] = 'completed';
    await syncToBackend(100);
  };

  // ── STATUS HANDLER ─────────────────────────────────────────────────────────
  const onStatusSet = (status) => {
    const lower = status?.toLowerCase() || '';
    const current = cmiRef.current['cmi.core.lesson_status'] || cmiRef.current['cmi.completion_status'];
    if ((current === 'completed' || current === 'passed') && (lower === 'incomplete' || lower === 'browsed')) {
      addLog('🛡️ Status Protected');
      return;
    }
    addLog(`📋 Status: ${status}`);
    if (lower === 'completed' || lower === 'passed') handleCompletion();
    else syncToBackend();
  };

  // ── UNIVERSAL SCORM 1.2 + 2004 API ────────────────────────────────────────
  const scormAPI = useMemo(() => {
    const api12 = {
      LMSInitialize: () => {
        addLog('🔌 SCORM 1.2 Init');
        const hasData = cmiRef.current['cmi.suspend_data'] || cmiRef.current['cmi.core.lesson_location'];
        cmiRef.current['cmi.core.entry'] = hasData ? 'resume' : 'ab-initio';
        return 'true';
      },
      LMSFinish: () => { syncToBackend(); addLog('🔌 Finish'); return 'true'; },
      LMSGetValue: (element) => {
        if (element === 'cmi.core.entry') return cmiRef.current['cmi.core.entry'] || 'ab-initio';
        if (element === 'cmi.core.credit') return 'credit';
        if (element === 'cmi.core.lesson_mode') return 'normal';
        if (element === 'cmi.core.student_id') return user?.id?.toString() || 'guest';
        if (element === 'cmi.core.student_name') return user?.name || 'Guest Student';
        return cmiRef.current[element] || '';
      },
      LMSSetValue: (element, value) => {
        const shortVal = typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '…' : value;
        console.log(`[LMSSetValue] ${element} =`, shortVal);
        cmiRef.current[element] = value;
        addLog(`📝 ${element.replace('cmi.core.', '')}`);

        if (element === 'cmi.core.lesson_status') {
          onStatusSet(value);
        } else if (element === 'cmi.suspend_data') {
          // Rise stores progress in suspend_data — parse and sync immediately
          const p = parseRiseProgress(value);
          console.log('[suspend_data → progress]', p);
          syncToBackend(p !== null && p > 0 ? p : undefined);
        } else if (element === 'cmi.core.lesson_location' || element === 'cmi.core.score.raw') {
          syncToBackend();
        }
        return 'true';
      },
      LMSCommit: () => {
        const suspendPreview = cmiRef.current['cmi.suspend_data']?.substring(0, 80);
        console.log('[LMSCommit] suspend_data preview:', suspendPreview);
        syncToBackend();
        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => 'No error',
      LMSGetDiagnostic: () => 'No error',
    };

    const api2004 = {
      Initialize: () => {
        addLog('🔌 SCORM 2004 Init');
        const hasData = cmiRef.current['cmi.suspend_data'] || cmiRef.current['cmi.location'];
        cmiRef.current['cmi.entry'] = hasData ? 'resume' : 'ab-initio';
        return 'true';
      },
      Terminate: () => { syncToBackend(); addLog('🔌 Terminate'); return 'true'; },
      GetValue: (element) => {
        if (element === 'cmi.entry') return cmiRef.current['cmi.entry'] || 'ab-initio';
        if (element === 'cmi.credit') return 'credit';
        if (element === 'cmi.mode') return 'normal';
        if (element === 'cmi.learner_id') return user?.id?.toString() || 'guest';
        if (element === 'cmi.learner_name') return user?.name || 'Guest Student';
        return cmiRef.current[element] || '';
      },
      SetValue: (element, value) => {
        const shortVal = typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '…' : value;
        console.log(`[SetValue 2004] ${element} =`, shortVal);
        cmiRef.current[element] = value;
        addLog(`📝 ${element}`);

        if (element === 'cmi.completion_status' || element === 'cmi.success_status') {
          onStatusSet(value);
        } else if (element === 'cmi.progress_measure' || element === 'cmi.score.scaled') {
          const p = Math.round(parseFloat(value) * 100);
          if (!isNaN(p) && p > 0) syncToBackend(p);
        } else if (element === 'cmi.suspend_data') {
          const p = parseRiseProgress(value);
          syncToBackend(p !== null && p > 0 ? p : undefined);
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

    return { api12, api2004 };
  }, [user, courseId]);

  // Bind APIs to window BEFORE iframe loads (synchronous)
  useLayoutEffect(() => {
    const bind = (win) => {
      if (!win) return;
      try {
        win.API = scormAPI.api12;
        win.API_Adapter = scormAPI.api12;
        win.API_1484_11 = scormAPI.api2004;
        win.findAPI = (w) => (w.API || w.API_1484_11 ? w : null);
        win.GetAPI = () => scormAPI.api12;
        win.IsLmsPresent = () => true;
        win.name = 'LMSFrame';
      } catch (e) {}
    };
    bind(window);
    try {
      if (window.parent && window.parent !== window) bind(window.parent);
      if (window.top && window.top !== window) bind(window.top);
      if (window.opener) bind(window.opener);
    } catch (e) {}
    return () => {
      try { delete window.API; delete window.API_Adapter; delete window.API_1484_11; } catch (e) {}
    };
  }, [scormAPI]);

  const injectToIframe = () => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.API = scormAPI.api12;
        win.API_Adapter = scormAPI.api12;
        win.API_1484_11 = scormAPI.api2004;
        win.findAPI = (w) => (w.API || w.API_1484_11 ? w : null);
        win.IsLmsPresent = () => true;
        console.log('✅ LMS API injected to iframe');
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
          fetch(`/api/scorm/entry/${courseId}`),
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
            cmiRef.current['_last_synced_progress'] = data.progress || 0;
            addLog(`📖 Restored ${data.progress || 0}%`);
          }
        }

        // Auto-save every 15s using suspend_data for progress
        autoSaveTimer = setInterval(() => syncToBackend(), 15000);

        setIsDataReady(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
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
