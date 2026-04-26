import { useState, useEffect } from 'react';
import { FiSearch, FiTrash2, FiFilter, FiUsers, FiUser, FiBriefcase, FiEye, FiX, FiClock, FiCheckCircle, FiCalendar, FiLoader } from 'react-icons/fi';
import Swal from 'sweetalert2';

const API_URL = '/api/users';

const ManageUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'company'
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setUserList(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setUserList((prev) => prev.filter((user) => (user._id || user.id) !== id));
          Swal.fire({
            title: 'Deleted!',
            text: `${name} has been removed.`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setViewLoading(true);
    try {
      const response = await fetch(`${API_URL}/${user._id || user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API_URL}/${selectedUser._id || selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    let interval;
    if (isViewModalOpen && selectedUser && selectedUser.role === 'student') {
      interval = setInterval(refreshUserData, 30000); // Auto refresh every 30s
    }
    return () => clearInterval(interval);
  }, [isViewModalOpen, selectedUser]);

  const filteredUsers = userList.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const studentCount = userList.filter((u) => u.role === 'student').length;
  const companyCount = userList.filter((u) => u.role === 'company').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-dark tracking-tight">Manage Users</h1>
          <p className="text-slate-500 font-medium mt-1">View and manage student and company accounts.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-black text-dark">{userList.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FiUser className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students</p>
            <p className="text-2xl font-black text-dark">{studentCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <FiBriefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Companies</p>
            <p className="text-2xl font-black text-dark">{companyCount}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400 w-4 h-4" />
            {['all', 'student', 'company'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  roleFilter === r
                    ? 'bg-[#59B1C9] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium">Loading users...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Enrolled/Progress</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user._id || user.id} className="hover:bg-slate-50 transition-colors group">
                    {/* User details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                            alt={user.name}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-dark text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">@{user.username}</span>
                    </td>

                    {/* Role badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                        user.role === 'company'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'company' ? <FiBriefcase className="w-3 h-3" /> : <FiUser className="w-3 h-3" />}
                        {user.role === 'company' ? 'Company' : 'Student'}
                      </span>
                    </td>

                    {/* Progress Column */}
                    <td className="px-6 py-4">
                      {user.role === 'student' ? (
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                            <span className="text-slate-400">{user.enrolledCourses?.length || 0} Courses</span>
                            <span className="text-primary">
                              {user.enrolledCourses?.length > 0 
                                ? Math.round(user.enrolledCourses.reduce((acc, c) => acc + (c.status === 'completed' ? 100 : (c.progress || 0)), 0) / user.enrolledCourses.length) 
                                : 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-700"
                              style={{ 
                                width: `${user.enrolledCourses?.length > 0 
                                  ? Math.round(user.enrolledCourses.reduce((acc, c) => acc + (c.status === 'completed' ? 100 : (c.progress || 0)), 0) / user.enrolledCourses.length) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">—</span>
                      )}
                    </td>

                    {/* Joined date from MongoDB */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="View User Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id || user.id, user.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium">
              {searchTerm || roleFilter !== 'all'
                ? 'No users match your search or filter.'
                : 'No users registered yet.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <p>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{userList.length}</strong> users
          </p>
        </div>
      </div>

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`}
                    alt={selectedUser.name}
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-black text-dark tracking-tight">{selectedUser.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">@{selectedUser.username} • {selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
              >
                <FiX className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Type</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${
                      selectedUser.role === 'company' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined On</p>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-dark">
                    <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
              </div>

              {viewLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <FiLoader className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching latest progress...</p>
                </div>
              ) : (
                <>
                  {/* Stats Bar */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-around border border-slate-100">
                {selectedUser.role === 'company' ? (
                  <>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Students Managed</p>
                      <p className="text-xl font-black text-[#59B1C9]">
                        {userList.filter(u => u.role === 'student' && (u.companyId?._id || u.companyId) === (selectedUser._id || selectedUser.id)).length}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Enrolled</p>
                      <p className="text-xl font-black text-[#59B1C9]">{selectedUser.enrolledCourses?.length || 0}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                      <p className="text-xl font-black text-green-600">
                        {selectedUser.enrolledCourses?.filter(c => c.status === 'completed').length || 0}
                      </p>
                    </div>
                    {/* Learning Hours hidden per request
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Learning Hours</p>
                      <p className="text-xl font-black text-purple-600">
                        {((selectedUser.enrolledCourses?.reduce((acc, c) => acc + (c.totalTime || 0), 0) || 0) / 3600).toFixed(1)}
                      </p>
                    </div>
                    */}
                  </>
                )}
              </div>

              {/* Dynamic Section: Courses for Students or Students for Companies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {selectedUser.role === 'company' ? (
                    <h3 className="text-sm font-black text-dark uppercase tracking-wider flex items-center gap-2">
                      Company Students
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-500">
                        {userList.filter(u => u.role === 'student' && (u.companyId?._id || u.companyId) === (selectedUser._id || selectedUser.id)).length}
                      </span>
                    </h3>
                  ) : (
                    <h3 className="text-sm font-black text-dark uppercase tracking-wider flex items-center gap-2">
                      Enrolled Courses
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-500">
                        {selectedUser.enrolledCourses?.length || 0}
                      </span>
                    </h3>
                  )}
                </div>

                {selectedUser.role === 'company' ? (
                  // Student List for Companies
                  userList.filter(u => u.role === 'student' && (u.companyId?._id || u.companyId) === (selectedUser._id || selectedUser.id)).length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {userList
                        .filter(u => u.role === 'student' && (u.companyId?._id || u.companyId) === (selectedUser._id || selectedUser.id))
                        .map((student) => (
                          <div key={student._id || student.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                                  alt={student.name}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-dark truncate">{student.name}</p>
                                <p className="text-[10px] font-medium text-slate-500">@{student.username} • {student.email}</p>
                              </div>
                              <div className="shrink-0 text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                {student.enrolledCourses?.length || 0} Course(s)
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                      <p className="text-xs font-bold uppercase tracking-widest mb-1">No Students Linked</p>
                      <p className="text-[11px]">No students have been assigned to this company yet.</p>
                    </div>
                  )
                ) : (
                  // Course list for students (current behavior)
                  selectedUser.enrolledCourses && selectedUser.enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedUser.enrolledCourses.map((enrollment, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                              <img
                                src={enrollment.courseId?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=100&q=80'}
                                alt="Course"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-dark truncate">
                                {enrollment.courseId?.title || 'Unknown Course'}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-slate-400">
                                <FiCalendar className="w-3 h-3" />
                                Enrolled: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('en-GB', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                }) : 'N/A'}
                              </div>
                              {/* Dual Progress Bars */}
                              <div className="flex flex-col gap-2 mt-1.5">
                                {/* Bar 1: Course Progress */}
                                <div>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">ð Course Progress</span>
                                    <span className="text-[10px] font-black" style={{ color: '#6366f1' }}>
                                      {enrollment.status === 'completed' ? '100%' : `${enrollment.progress || 0}%`}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                                    <div
                                      className="h-full rounded-full transition-all duration-1000"
                                      style={{
                                        width: `${enrollment.status === 'completed' ? 100 : (enrollment.progress || 0)}%`,
                                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                      }}
                                    />
                                  </div>
                                </div>
                                {/* Bar 2: Quiz Score */}
                                <div>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">ð¯ Quiz Score</span>
                                    <span className="text-[10px] font-black text-amber-500">
                                      {(() => {
                                        const quizScore = enrollment.score != null && enrollment.score !== ''
                                          ? Math.round(Number(enrollment.score))
                                          : (enrollment.progress || 0);
                                        return `${quizScore}%`;
                                      })()}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                                    <div
                                      className="h-full rounded-full transition-all duration-1000"
                                      style={{
                                        width: `${(() => {
                                          const quizScore = enrollment.score != null && enrollment.score !== ''
                                            ? Math.round(Number(enrollment.score))
                                            : (enrollment.progress || 0);
                                          return Math.min(100, quizScore);
                                        })()}%`,
                                        background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {enrollment.status === 'completed' ? (
                                <span className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                  <FiCheckCircle className="w-3 h-3" /> Done
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                  <FiClock className="w-3 h-3" /> In Progress
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                      <p className="text-xs font-bold uppercase tracking-widest mb-1">No Courses Found</p>
                      <p className="text-[11px]">This user hasn't enrolled in any courses yet.</p>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Tracking Enabled
              </p>
              <div className="flex gap-3">
                <button
                  onClick={refreshUserData}
                  disabled={viewLoading}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 rounded-2xl transition-all shadow-sm group"
                  title="Refresh Data"
                >
                  <FiClock className={`w-5 h-5 ${viewLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-8 py-3 bg-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-dark/90 transition-all shadow-lg shadow-dark/20"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
