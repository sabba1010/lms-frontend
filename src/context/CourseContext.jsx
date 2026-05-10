import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import API_BASE from '../lib/api';

const CourseContext = createContext();

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEnrolledCourses = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      console.log('[CourseContext] Fetching enrolled courses for user:', user.id);
      const res = await fetch(`${API_BASE}/payments/enrolled/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[CourseContext] Fetched enrolled courses:', data.length, 'courses');
        // Normalize progress for every course (safety net)
        const normalized = data.map(c => ({
          ...c,
          progress: Math.round(Number(c.progress || 0)),
          status: c.status || 'incomplete',
        }));
        setEnrolledCourses(normalized);
        console.log('[CourseContext] Updated enrolled courses state:', normalized.length, 'courses');
      } else {
        console.error('[CourseContext] Failed to fetch enrolled courses:', res.status);
      }
    } catch (err) {
      console.error('[CourseContext] Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchEnrolledCourses();
    } else {
      setEnrolledCourses([]);
    }
  }, [user?.id, fetchEnrolledCourses]);

  /**
   * Optimistically update a single course's progress and status in global state.
   * Called directly from ScormPlayerPage after a successful backend sync.
   */
  const updateCourseProgress = useCallback((courseId, rawProgress, status) => {
    const progress = Math.round(Number(rawProgress || 0));
    const finalProgress = progress >= 99 ? 100 : progress;
    const finalStatus = finalProgress >= 100 ? 'completed' : (status || 'incomplete');

    console.log(`[CourseContext] updateCourseProgress: courseId=${courseId} progress=${finalProgress} status=${finalStatus}`);

    setEnrolledCourses(prev => prev.map(course => {
      const id = (course._id || course.id)?.toString();
      if (id === courseId?.toString()) {
        return { ...course, progress: finalProgress, status: finalStatus };
      }
      return course;
    }));
  }, []);

  return (
    <CourseContext.Provider value={{
      enrolledCourses,
      loading,
      refreshCourses: fetchEnrolledCourses,
      updateCourseProgress,
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export default CourseContext;
