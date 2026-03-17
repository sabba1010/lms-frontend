import React, { useState, useEffect } from 'react';
import { FiCamera, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const EditAccount = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
        // Update local auth state if backend returns updated user
        if (data.user) {
          const newUser = { ...user, ...data.user };
          setUser(newUser);
          localStorage.setItem('auth_user', JSON.stringify(newUser));
        }
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-dark tracking-tight">Edit Account</h2>
        {status.message && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold animate-fade-in ${
            status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            {status.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {status.message}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-8 space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[32px] bg-slate-100 border-2 border-primary/20 shrink-0 overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name || 'User'}`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-[28px] object-cover"
                />
              </div>
              <button type="button" className="absolute bottom-1 right-1 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-lg text-primary hover:bg-primary hover:text-white transition-all">
                <FiCamera className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-dark mb-1 truncate">{formData.name || 'User'}</h3>
              <p className="text-slate-500 font-medium mb-4">Update your photo and personal details.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                 <button type="button" className="btn-primary py-2 px-6 text-sm w-full sm:w-auto">Upload Photo</button>
                 <button type="button" className="bg-slate-50 text-slate-600 py-2 px-6 rounded-full text-sm font-bold border border-slate-200 hover:bg-slate-100 transition-all w-full sm:w-auto">Remove</button>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-slate-100">
            <h4 className="text-lg font-bold text-dark">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Full Name</label>
                 <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                  required
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Email Address</label>
                 <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                  required
                 />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Bio</label>
              <textarea 
                name="bio"
                rows="4" 
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none" 
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-slate-100">
            <h4 className="text-lg font-bold text-dark">Security</h4>
            <p className="text-sm text-slate-500 -mt-2">Leave password fields blank if you don't want to change it.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">New Password</label>
                 <input 
                  type="password" 
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                 />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end pt-8 gap-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => { setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' })); setStatus({ type: '', message: '' }); }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full sm:w-auto btn-primary flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : 'Save All Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditAccount;
