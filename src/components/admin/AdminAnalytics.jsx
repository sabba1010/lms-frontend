import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiBookOpen, 
  FiDollarSign, 
  FiActivity, 
  FiPieChart,
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const API_URL = '/api/stats';

const AdminAnalytics = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [filterDays, setFilterDays] = useState(null); // null = All Time, 30 = Last 30 Days
  const [monthOffset, setMonthOffset] = useState(0); // 0 = Current year, 1 = Previous year, etc.

  const fetchStats = async () => {
    try {
      // Only show global spinner on first load
      if (!statsData) setLoading(true);
      else setChartLoading(true);

      let url = filterDays ? `/api/stats?days=${filterDays}` : '/api/stats';
      url += url.includes('?') ? `&offset=${monthOffset}` : `?offset=${monthOffset}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterDays, monthOffset]);

  if (loading && !statsData) {
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
          value={statsData?.engagement || '0%'} 
          icon={<FiActivity />} 
          trend="Real-time" 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Line Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm lg:col-span-2 relative overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="font-bold text-dark text-xl tracking-tight">Revenue Stream</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Yearly financial trend</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100 mr-2">
                    <button 
                      onClick={() => setMonthOffset(prev => prev + 1)}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-primary"
                      title="Previous Year"
                    >
                       <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
                      disabled={monthOffset === 0}
                      className={`p-1.5 rounded-lg transition-all ${monthOffset === 0 ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-primary'}`}
                      title="Next Year"
                    >
                       <FiChevronRight className="w-5 h-5" />
                    </button>
                 </div>
                 <FiTrendingUp className="text-emerald-500 w-8 h-8" />
              </div>
           </div>
           
           <div className={`h-64 mt-4 relative transition-opacity duration-300 ${chartLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
             <RevenueLineChart data={statsData?.monthlyRevenue || []} />
             {chartLoading && (
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
               </div>
             )}
           </div>
        </div>

        {/* Course Popularity */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-dark text-xl tracking-tight">Course Dist.</h3>
              <FiPieChart className="text-primary w-6 h-6" />
           </div>
           <div className="space-y-6">
              {(statsData?.topCourses || []).length > 0 ? (
                statsData.topCourses.map((course, idx) => (
                  <CourseRow 
                    key={idx}
                    label={course.label} 
                    color={['bg-primary', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500'][idx % 4]} 
                    percent={course.percent} 
                  />
                ))
              ) : (
                <p className="text-sm text-slate-400 font-bold italic">No enrollment data yet.</p>
              )}
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

const RevenueLineChart = ({ data }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  
  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 240;
  const padding = { top: 30, right: 40, bottom: 50, left: 20 };
  
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = padding.left + (i * (chartWidth / (data.length - 1)));
    const y = padding.top + chartHeight - (d.revenue / maxRevenue * chartHeight);
    return { x, y, revenue: d.revenue, month: d.month };
  });

  // SVG Path string
  const pathData = points.reduce((acc, point, i) => {
    return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
  }, "");

  return (
    <div className="relative w-full h-full group/chart">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line 
            key={i}
            x1={padding.left}
            y1={padding.top + i * (chartHeight / 4)}
            x2={width - padding.right}
            y2={padding.top + i * (chartHeight / 4)}
            stroke="#F1F5F9"
            strokeWidth="1"
          />
        ))}

        {/* Area under the curve */}
        <path 
          d={`${pathData} L ${points[points.length-1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`}
          fill="url(#chartGradient)"
          className="opacity-20"
        />

        {/* Main Line */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="var(--color-primary, #3b82f6)" 
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-lg"
        />

        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Interactive Points */}
        {points.map((p, i) => (
           <g 
             key={i} 
             onMouseEnter={() => setHoverIdx(i)}
             onMouseLeave={() => setHoverIdx(null)}
             className="cursor-pointer"
           >
             <circle 
               cx={p.x} 
               cy={p.y} 
               r={hoverIdx === i ? "10" : "6"} 
               fill="white" 
               stroke="var(--color-primary, #3b82f6)" 
               strokeWidth="3"
               className="transition-all duration-300"
             />
             {/* Virtual Hit Box */}
             <rect 
               x={p.x - 20} 
               y={0} 
               width={40} 
               height={height} 
               fill="transparent" 
             />
           </g>
        ))}

        {/* X-axis Labels */}
        {points.map((p, i) => (
          <text 
            key={i}
            x={p.x}
            y={padding.top + chartHeight + 30}
            textAnchor="end"
            transform={`rotate(-45, ${p.x}, ${padding.top + chartHeight + 30})`}
            className="text-[10px] font-black fill-slate-400 uppercase tracking-widest"
          >
            {p.month}
          </text>
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoverIdx !== null && (
        <div 
          className="absolute bg-dark text-white p-3 rounded-2xl shadow-2xl z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: `${(points[hoverIdx].x / width) * 100}%`,
            top: `${(points[hoverIdx].y / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
            minWidth: '100px'
          }}
        >
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {points[hoverIdx].month} Revenue
          </div>
          <div className="text-sm font-black text-white">
            ${points[hoverIdx].revenue.toLocaleString()}
          </div>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-dark rotate-45"></div>
        </div>
      )}
    </div>
  );
};

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
