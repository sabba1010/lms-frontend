import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CompanySidebar from '../components/company/CompanySidebar';
import CompanyHeader from '../components/company/CompanyHeader';
import ManageStudents from '../components/company/ManageStudents';
import StudentAnalytics from '../components/company/StudentAnalytics';
import ExploreCourses from '../components/company/ExploreCourses';
import MyLicenses from '../components/company/MyLicenses';
import EditAccount from '../components/dashboard/EditAccount';

const COMPANY_API = '/api/company';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`${COMPANY_API}/students/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  // Calculate real stats
  const dashboardStats = useMemo(() => {
    const totalStudents = students.length;
    
    // Count unique courses across all students
    const activeCoursesSet = new Set();
    let totalProgress = 0;
    let enrollmentCount = 0;

    students.forEach(student => {
      if (student.courses) {
        student.courses.forEach(c => {
          activeCoursesSet.add(c.title);
          totalProgress += (c.progress || 0);
          enrollmentCount++;
        });
      }
    });

    const avgProgress = enrollmentCount > 0 
      ? Math.round(totalProgress / enrollmentCount) 
      : 0;

    return {
      totalStudents,
      activeCourses: activeCoursesSet.size,
      avgProgress: `${avgProgress}%`
    };
  }, [students]);

  // Derive recent activity from student enrollments
  const recentActivity = useMemo(() => {
    const activity = [];
    students.forEach(student => {
      if (student.courses) {
        student.courses.forEach(course => {
          activity.push({
            name: student.name,
            action: course.progress >= 100 ? 'Completed' : 'is taking',
            course: course.title,
            time: course.enrolledAt ? new Date(course.enrolledAt).toLocaleDateString() : 'Recently',
            timestamp: course.enrolledAt ? new Date(course.enrolledAt).getTime() : 0
          });
        });
      }
    });
    // Sort by most recent and take top 5
    return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [students]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    switch(activeTab) {
      case 'Manage Students':
        return <ManageStudents />;
      case 'Explore Courses':
        return <ExploreCourses />;
      case 'My Licenses':
        return <MyLicenses />;
      case 'Edit Account':
        return <EditAccount />;
      case 'Overview':
      default:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-dark tracking-tight">Company Dashboard</h1>
                <p className="text-slate-500 font-medium">Welcome back! Here's what's happening with your students.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Students" value={dashboardStats.totalStudents} icon="👨‍🎓" trend="Linked Students" />
              <StatCard label="Active Courses" value={dashboardStats.activeCourses} icon="📚" trend="Courses in Progress" />
              <StatCard label="Average Progress" value={dashboardStats.avgProgress} icon="📈" trend="Across all students" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
               <h3 className="text-xl font-bold text-dark mb-6">Recent Student Activity</h3>
               {recentActivity.length === 0 ? (
                 <p className="text-slate-400 text-center py-4">No recent activity found.</p>
               ) : (
                 <div className="space-y-4">
                    {recentActivity.map((activity, idx) => (
                      <ActivityItem 
                        key={idx}
                        name={activity.name} 
                        action={activity.action} 
                        course={activity.course} 
                        time={activity.time} 
                      />
                    ))}
                 </div>
               )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <CompanySidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        handleLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CompanyHeader 
          setIsSidebarOpen={setIsSidebarOpen} 
          handleLogout={handleLogout} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-dark tracking-tight">{value}</p>
      </div>
    </div>
    <div className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full inline-block">
       {trend}
    </div>
  </div>
);

const ActivityItem = ({ name, action, course, time }) => (
  <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
    <div className="flex items-center gap-4">
       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
          {name.charAt(0)}
       </div>
       <div>
          <p className="text-sm font-bold text-dark">
             {name} <span className="text-slate-400 font-medium">{action}</span> <span className="text-primary">{course}</span>
          </p>
          <p className="text-xs font-medium text-slate-400">{time}</p>
       </div>
    </div>
    <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
);

export default CompanyDashboard;
