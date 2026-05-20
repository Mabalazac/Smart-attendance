import React, { useState } from 'react';
import { User, Shield, Key, Save, Loader2, BookOpen, Fingerprint, Mail, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import { apiFetch, endpoints } from '../services/api';

export default function Profile() {
  const { currentUser, setCurrentUser } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: currentUser?.first_name || '',
    last_name: currentUser?.last_name || '',
    program: currentUser?.program || '',
    academic_year: currentUser?.academic_year || '',
    stream: currentUser?.stream || '',
    password: '',
    confirmPassword: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);

      if (currentUser?.role === 'student') {
        data.append('program', formData.program);
        if (formData.academic_year) {
          data.append('academic_year', String(formData.academic_year));
        } else {
          data.append('academic_year', '');
        }
        data.append('stream', formData.stream);
      }

      if (formData.password) {
        data.append('password', formData.password);
      }

      if (selectedFile) {
        data.append('profile_picture', selectedFile);
      }

      const updatedUser = await apiFetch<any>(endpoints.auth.me, {
        method: 'PATCH',
        body: data,
      });

      setCurrentUser(updatedUser);
      toast.success('Profile updated successfully!');
      
      // Clear password fields and file state
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-12">
        <PageHeader 
          title="Profile Settings" 
          subtitle="Manage your personal information and security"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── Read-only Info Card ── */}
          <div className="md:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="relative mt-8 group cursor-pointer w-24 h-24 mx-auto rounded-full">
                <img 
                  src={previewUrl || currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg mx-auto transition-transform group-hover:scale-105"
                />
                <label className="absolute inset-0 w-24 h-24 rounded-full mx-auto ring-4 ring-white bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white w-6 h-6 animate-pulse" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900 font-heading">
                {currentUser.first_name} {currentUser.last_name}
              </h3>
              <span className="mt-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest rounded-full">
                {currentUser.role}
              </span>

              <div className="w-full mt-6 space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Mail size={16} className="text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser.email}</p>
                  </div>
                </div>
                
                {currentUser.role === 'student' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <Fingerprint size={16} className="text-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Student ID</p>
                      <p className="text-sm font-bold text-emerald-900 truncate">{currentUser.student_id}</p>
                    </div>
                  </div>
                )}

                {currentUser.role === 'lecturer' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <Shield size={16} className="text-purple-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Staff ID</p>
                      <p className="text-sm font-bold text-purple-900 truncate">{currentUser.staff_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Edit Form ── */}
          <div className="md:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
                {/* Basic Info */}
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="text-blue-500" size={24} />
                    <h3 className="text-lg font-bold text-gray-900 font-heading">Personal Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">First Name</label>
                      <input 
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Last Name</label>
                      <input 
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Info (Student only) */}
                {currentUser.role === 'student' && (
                  <div className="p-6 md:p-8 space-y-6 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-6">
                      <BookOpen className="text-blue-500" size={24} />
                      <h3 className="text-lg font-bold text-gray-900 font-heading">Academic Profile</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Program</label>
                        <select 
                          name="program"
                          value={formData.program}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select Program</option>
                          <option value="BSc IT">BSc IT</option>
                          <option value="BSc CS">BSc CS</option>
                          <option value="BSc NE">BSc NE</option>
                          <option value="BSc SE">BSc SE</option>
                          <option value="ODIT">ODIT</option>
                          <option value="ODCS">ODCS</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Year</label>
                        <select 
                          name="academic_year"
                          value={formData.academic_year}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select Year</option>
                          {[1, 2, 3, 4].map(y => (
                            <option key={y} value={y}>Year {y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-3">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Stream (Optional)</label>
                        <input 
                          type="text"
                          name="stream"
                          placeholder="e.g. A, B"
                          value={formData.stream}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Security */}
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Key className="text-amber-500" size={24} />
                    <h3 className="text-lg font-bold text-gray-900 font-heading">Change Password</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">New Password</label>
                      <input 
                        type="password"
                        name="password"
                        placeholder="Leave blank to keep current"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Confirm Password</label>
                      <input 
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 md:p-8 bg-gray-50 flex items-center justify-end gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
