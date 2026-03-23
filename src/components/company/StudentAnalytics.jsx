import React, { useMemo } from 'react';
import { FiTrendingUp, FiCheckCircle, FiClock, FiActivity, FiUsers, FiBookOpen } from 'react-icons/fi';

const StudentAnalytics = ({ students = [] }) => {
  const stats = useMemo(() => {
    let totalEnrollments = 0;
    let totalProgress = 0;
    let completedCourses = 0;
    const courseMap = {};

    students.forEach(student => {
      if (student.courses) {
        student.courses.forEach(course => {
          totalEnrollments++;
          totalProgress += (course.progress || 0);
          if (course.progress >= 100) completedCourses++;

          if (!courseMap[course.title]) {
            courseMap[course.title] = { count: 0, totalProgress: 0 };
          }
          courseMap[course.title].count++;
          courseMap[course.title].totalProgress += (course.progress || 0);
        });
      }
    });

    const avgProgress = totalEnrollments > 0 ? Math.round(totalProgress / totalEnrollments) : 0;
    const completionRate = totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0;
    
    const courseDistribution = Object.keys(courseMap).map(title => ({
      title,
      count: courseMap[title].count,
      avgProgress: Math.round(courseMap[title].totalProgress / courseMap[title].count),
      percent: Math.round((courseMap[title].count / totalEnrollments) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 4);

    return {
      totalEnrollments,
      avgProgress,
      completionRate,
      courseDistribution,
      totalStudents: students.length
    };
  }, [students]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-dark tracking-tight">Student Analytics</h1>
        <p className="text-slate-500 font-medium mt-1">Detailed performance metrics for your company students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Performance */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-dark text-lg">Top Courses by Enrollment</h3>
              <FiActivity className="text-primary w-6 h-6" />
           </div>
           <div className="space-y-6">
              {stats.courseDistribution.length > 0 ? (
                stats.courseDistribution.map((course, idx) => (
                  <ProgressRow 
                    key={idx} 
                    label={course.title} 
                    percent={course.avgProgress} 
                    count={course.count}
                    color={idx === 0 ? "bg-primary" : idx === 1 ? "bg-amber-500" : idx === 2 ? "bg-green-500" : "bg-red-500"} 
                  />
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">No course data available.</p>
              )}
           </div>
        </div>

        {/* Engagement Summary */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-dark text-lg">Platform Engagement</h3>
              <FiTrendingUp className="text-green-500 w-6 h-6" />
           </div>
           <div className="flex items-end justify-between h-48 gap-4 px-2">
              <Bar height="40%" label="M" />
              <Bar height="65%" label="T" />
              <Bar height="90%" label="W" active={true} />
              <Bar height="55%" label="T" />
              <Bar height="75%" label="F" />
              <Bar height="30%" label="S" />
              <Bar height="20%" label="S" />
           </div>
           <p className="text-xs text-slate-400 text-center mt-6 font-medium">Activity based on student logins this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricBox 
            icon={<FiUsers />} 
            label="Total Students" 
            value={stats.totalStudents} 
            sub="Active members"
            color="text-blue-600"
            bg="bg-blue-50"
         />
         <MetricBox 
            icon={<FiBookOpen />} 
            label="Total Enrollments" 
            value={stats.totalEnrollments} 
            sub="Active course seats"
            color="text-primary"
            bg="bg-primary/5"
         />
         <MetricBox 
            icon={<FiCheckCircle />} 
            label="Completion Rate" 
            value={`${stats.completionRate}%`} 
            sub="Courses finished"
            color="text-green-600"
            bg="bg-green-50"
         />
         <MetricBox 
            icon={<FiTrendingUp />} 
            label="Avg. Progress" 
            value={`${stats.avgProgress}%`} 
            sub="Across all students"
            color="text-amber-600"
            bg="bg-amber-50"
         />
      </div>
    </div>
  );
};

const ProgressRow = ({ label, percent, count, color }) => (
  <div className="space-y-2">
     <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-slate-600 truncate mr-2">{label}</span>
        <div className="flex items-center gap-3">
           <span className="text-slate-400 font-medium text-xs">{count} Students</span>
           <span className="text-dark bg-slate-50 px-2 py-0.5 rounded text-xs">{percent}% Avg.</span>
        </div>
     </div>
     <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percent}%` }}
        />
     </div>
  </div>
);

const Bar = ({ height, label, active = false }) => (
  <div className="flex-1 flex flex-col items-center gap-3">
     <div 
       className={`w-full rounded-t-xl transition-all duration-700 ${active ? 'bg-primary' : 'bg-slate-100 hover:bg-slate-200 cursor-pointer'}`}
       style={{ height }}
     />
     <span className="text-xs font-bold text-slate-400">{label}</span>
  </div>
);

const MetricBox = ({ icon, label, value, sub, color, bg }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
     <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center text-xl mb-4`}>
        {icon}
     </div>
     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
     <p className="text-2xl font-black text-dark mt-2 tracking-tight">{value}</p>
     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase opacity-60">{sub}</p>
  </div>
);

export default StudentAnalytics;
