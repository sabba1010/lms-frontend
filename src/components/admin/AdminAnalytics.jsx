import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiBookOpen, 
  FiDollarSign, 
  FiActivity, 
  FiPieChart,
  FiArrowUpRight
} from 'react-icons/fi';

const API_URL = '/api/stats';

const AdminAnalytics = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(null); // null = All Time, 30 = Last 30 Days

  const fetchStats = async () => {
    try {
      setLoading(true);
      const url = filterDays ? `/api/stats?days=${filterDays}` : '/api/stats';
      const res = await fetch(url);
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterDays]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-dark tracking-tight mb-2">Platform Analytics</h1>
           <p className="text-slate-500 font-medium">Global performance and revenue overview.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
           <button 
             onClick={() => setFilterDays(null)}
             className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${!filterDays ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             All Time
           </button>
           <button 
             onClick={() => setFilterDays(30)}
             className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filterDays === 30 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Last 30 Days
           </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Revenue" 
          value={statsData?.revenue || '$0'} 
          icon={<FiDollarSign />} 
          trend="+12.5%" 
          color="bg-emerald-500" 
        />
        <MetricCard 
          label="Total Students" 
          value={statsData?.students || '0'} 
          icon={<FiUsers />} 
          trend="+5.2%" 
          color="bg-blue-500" 
        />
        <MetricCard 
          label="Active Courses" 
          value={statsData?.courses || '0'} 
          icon={<FiBookOpen />} 
          trend="+2 New" 
          color="bg-violet-500" 
        />
        <MetricCard 
          label="Engagement" 
          value="88%" 
          icon={<FiActivity />} 
          trend="Stable" 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Breakdown/Mock Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm lg:col-span-2">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="font-bold text-dark text-xl tracking-tight">Revenue Stream</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Monthly financial overview</p>
              </div>
              <FiTrendingUp className="text-emerald-500 w-8 h-8" />
           </div>
           
           <div className="flex items-end justify-between h-64 gap-3 sm:gap-6 px-2 sm:px-4">
              {statsData?.monthlyRevenue?.map((data, idx) => {
                 const maxRev = Math.max(...statsData.monthlyRevenue.map(m => m.revenue), 1);
                 const heightPercent = Math.max((data.revenue / maxRev) * 100, 5); // Min 5% for visibility
                 const isLatest = idx === statsData.monthlyRevenue.length - 1;
                 
                 return (
                   <BigBar 
                     key={idx} 
                     height={`${heightPercent}%`} 
                     label={data.month} 
                     active={isLatest} 
                   />
                 );
              })}
           </div>

        </div>

        {/* Course Popularity */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-dark text-xl tracking-tight">Course Dist.</h3>
              <FiPieChart className="text-primary w-6 h-6" />
           </div>
           <div className="space-y-6">
              <CourseRow label="Enterprise Python" color="bg-primary" percent={75} />
              <CourseRow label="UI Design Masterclass" color="bg-amber-500" percent={42} />
              <CourseRow label="Strategic Business" color="bg-emerald-500" percent={68} />
              <CourseRow label="Frontend Eng." color="bg-violet-500" percent={25} />
           </div>
           <button className="w-full mt-8 py-3 rounded-2xl bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors">
              Full Breakdown
           </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-dark text-xl tracking-tight">Recent Financial Activity</h3>
            <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
               View All <FiArrowUpRight />
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {(statsData?.recentTransactions || []).map((trx, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="py-5 font-bold text-dark text-sm">{trx.id}</td>
                       <td className="py-5 font-medium text-slate-600 text-sm">{trx.user}</td>
                       <td className="py-5 font-black text-dark text-sm">{trx.amount}</td>
                       <td className="py-5 text-sm">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                             {trx.status || 'Success'}
                          </span>
                       </td>
                       <td className="py-5 font-medium text-slate-400 text-sm text-right">{trx.date}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, trend, color }) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
    <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="relative z-10 flex flex-col gap-4">
       <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center text-xl shadow-lg shadow-current/20`}>
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <div className="flex items-center gap-3">
             <h3 className="text-2xl font-black text-dark tracking-tight">{value}</h3>
             <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{trend}</span>
          </div>
       </div>
    </div>
  </div>
);

const BigBar = ({ height, label, active = false }) => (
  <div className="flex-1 h-full flex flex-col items-center gap-4 group">
     <div className="w-full relative flex-1 flex flex-col justify-end min-h-[1px]">
        <div 
          className={`w-full rounded-2xl transition-all duration-700 relative overflow-hidden ${active ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-slate-100 hover:bg-slate-200'}`}
          style={{ height: height || '0%' }}
        >
           {active && (
             <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
           )}
        </div>
     </div>
     <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase transition-colors shrink-0 ${active ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
  </div>
);

const CourseRow = ({ label, color, percent }) => (
  <div className="space-y-2">
     <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
        <span className="text-slate-500 truncate mr-4">{label}</span>
        <span className="text-dark">{percent}%</span>
     </div>
     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percent}%` }}
        />
     </div>
  </div>
);

export default AdminAnalytics;
