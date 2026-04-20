import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBookOpen,
  FiClock,
  FiAward,
  FiCheckCircle,
} from 'react-icons/fi';

// Auth context to get the current logged-in user
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';

// Import refactored components
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import Overview from '../components/dashboard/Overview';
import MyCourses from '../components/dashboard/MyCourses';
import Schedule from '../components/dashboard/Schedule';
import MyCertificates from '../components/dashboard/MyCertificates';
import EditAccount from '../components/dashboard/EditAccount';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Use global course state — updates instantly when player syncs progress
  const { enrolledCourses, loading: loadingCourses } = useCourses();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Derive stats from real enrolled data
  const stats = [
    {
      title: 'Courses Enrolled',
      value: String(enrolledCourses.length),
      icon: <FiBookOpen className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Completed Courses',
      value: String(enrolledCourses.filter((c) => Math.round(Number(c.progress || 0)) >= 99 || c.status === 'completed').length),
      icon: <FiCheckCircle className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      title: 'Learning Hours',
      value: (() => {
        const totalSeconds = enrolledCourses.reduce((acc, c) => acc + (c.totalTime || 0), 0);
        const hours = totalSeconds / 3600;
        return hours.toFixed(1);
      })(),
      icon: <FiClock className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
  ];

  const upcomingTasks = [
    { title: 'Python Basics Quiz', date: 'Tomorrow, 10:00 AM', type: 'Quiz', priority: 'High' },
    { title: 'Project Submission', date: 'Mar 15, 2025', type: 'Project', priority: 'Medium' },
    { title: 'Live Q&A Session', date: 'Mar 18, 2025', type: 'Event', priority: 'Normal' },
  ];

  const certificates = enrolledCourses
    .filter((c) => (c.progress || 0) >= 100)
    .map((course) => ({
      id: course._id || course.id,
      title: course.title,
      date: course.enrolledAt
        ? new Date(course.enrolledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A',
      issuer: 'Lumina Academy',
      img: course.image || 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=500&auto=format&fit=crop',
    }));

  const filteredCourses = enrolledCourses.filter(course => 
    course.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Edit Account':
        return <EditAccount />;
      case 'My Courses':
        return loadingCourses ? (
          <div className="flex items-center justify-center p-16">
            <span className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <MyCourses enrolledCourses={filteredCourses} />
        );
      case 'My Certificates':
        return <MyCertificates certificates={certificates} />;
      case 'Schedule':
        return <Schedule upcomingTasks={upcomingTasks} />;
      default:
        return (
          <Overview
            stats={stats}
            enrolledCourses={filteredCourses}
            upcomingTasks={upcomingTasks}
            setActiveTab={setActiveTab}
            loadingCourses={loadingCourses}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;