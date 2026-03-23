import React from 'react';
import {
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiActivity,
  FiMoreVertical
} from 'react-icons/fi';
import { useState, useEffect } from 'react';

const API_URL = '/api/stats';

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-slate-500 font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-dark">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${color} shadow-lg shadow-current/20`}>
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className="text-sm font-bold text-green-500">{trend}</span>
      <span className="text-sm text-slate-400 font-medium">vs last month</span>
    </div>
  </div>
);

const AdminOverview = () => {
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const stats = [
    { title: 'Total Revenue', value: statsData?.revenue || '$0', icon: <FiDollarSign className="w-6 h-6" />, color: 'from-green-500 to-emerald-600', trend: '+12.5%' },
    { title: 'Total Students', value: statsData?.students || '0', icon: <FiUsers className="w-6 h-6" />, color: 'from-blue-500 to-indigo-600', trend: '+5.2%' },
    { title: 'Active Courses', value: statsData?.courses || '0', icon: <FiBookOpen className="w-6 h-6" />, color: 'from-purple-500 to-violet-600', trend: '+0 new' },
    { title: 'Server Load', value: statsData?.serverLoad || '0%', icon: <FiActivity className="w-6 h-6" />, color: 'from-amber-500 to-orange-600', trend: 'Stable' },
  ];

  const recentUsers = statsData?.recentUsers?.map(user => ({
    name: user.name,
    role: user.role,
    date: new Date(user.createdAt).toLocaleDateString(),
    img: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
  })) || [];

  const recentTransactions = statsData?.recentTransactions || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-dark tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 font-medium mt-1">Welcome back, Super Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Revenue Stream Graph Integration */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm mb-8">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="font-bold text-dark text-xl tracking-tight">Revenue Stream</h3>
               <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Monthly financial overview</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/10">
               <FiDollarSign />
            </div>
         </div>
         
         <div className="flex items-end justify-between h-64 gap-3 sm:gap-6 px-2 sm:px-4">
            {statsData?.monthlyRevenue?.map((data, idx) => {
               const maxRev = Math.max(...statsData.monthlyRevenue.map(m => m.revenue), 1);
               const heightPercent = Math.max((data.revenue / maxRev) * 100, 5);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-top">
        {/* Recent Registrations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-1 border-t-4 border-t-primary">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-dark">New Users</h3>
            <button className="text-slate-400 hover:text-primary"><FiMoreVertical /></button>
          </div>
          <div className="space-y-4">
            {recentUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img src={user.img} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-dark text-sm truncate">{user.name}</h4>
                  <p className="text-xs font-medium text-slate-500">{user.role}</p>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  {user.date}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:border-primary hover:text-primary transition-colors">
            View All Users
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-dark">Recent Transactions</h3>
            <button className="text-slate-400 hover:text-primary"><FiMoreVertical /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTransactions.map((trx, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 font-bold text-dark text-sm">{trx.id}</td>
                    <td className="py-4 font-medium text-slate-600 text-sm">{trx.user}</td>
                    <td className="py-4 font-bold text-slate-700 text-sm">{trx.amount}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider`}>
                        {trx.status || 'Success'}
                      </span>
                    </td>
                    <td className="py-4 font-medium text-slate-400 text-sm text-right">{trx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default AdminOverview;
