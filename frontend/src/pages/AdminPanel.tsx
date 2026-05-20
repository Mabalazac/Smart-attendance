import React, { useState, useEffect } from 'react';
import { Users, Building2, Upload, BarChart3, Plus, Search, Trash2, Edit, QrCode, Download, BookOpen, Shield, ChevronRight, X, Navigation } from 'lucide-react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { apiFetch, endpoints } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import type { User, Venue } from '../context/AppContext';

type AdminTab = 'users' | 'venues' | 'courses' | 'timetable' | 'reports';

interface Course {
  id: number;
  code: string;
  name: string;
  program: string;
  academic_year: number;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'lecturer' | 'admin'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVenueQR, setSelectedVenueQR] = useState<Venue | null>(null);
  const [detectingLoc, setDetectingLoc] = useState(false);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<any>({});

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
    { id: 'venues', label: 'Venues', icon: <Building2 size={16} /> },
    { id: 'courses', label: 'Programs', icon: <BookOpen size={16} /> },
    { id: 'timetable', label: 'Timetable', icon: <Upload size={16} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const [usersData, statsData] = await Promise.all([
          apiFetch<User[]>(endpoints.admin.users),
          apiFetch<any>(endpoints.admin.stats)
        ]);
        setUsers(usersData);
        setStats(statsData);
      } else if (activeTab === 'venues') {
        const data = await apiFetch<Venue[]>(endpoints.venues.list);
        setVenues(data);
      } else if (activeTab === 'courses') {
        const data = await apiFetch<Course[]>(endpoints.timetable.courses);
        setCourses(data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiFetch(endpoints.admin.userDetail(editingUser.id), {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('User updated successfully');
      } else {
        await apiFetch(endpoints.admin.users, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('User added successfully');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setFormData({});
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await apiFetch(`${endpoints.timetable.courses}${editingCourse.id}/`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Course updated successfully');
      } else {
        await apiFetch(endpoints.timetable.courses, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Course added successfully');
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      setFormData({});
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save course');
    }
  };

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVenue) {
        await apiFetch(endpoints.venues.detail(editingVenue.id), {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Venue updated successfully');
      } else {
        await apiFetch(endpoints.venues.list, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Venue added successfully');
      }
      setShowVenueModal(false);
      setEditingVenue(null);
      setFormData({});
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save venue');
    }
  };

  const getVenueLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev: any) => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6))
        }));
        toast.success('Coordinates captured successfully!');
        setDetectingLoc(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to detect location. Please grant location permissions.');
        setDetectingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(endpoints.timetable.upload, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast.success('Timetable uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload timetable');
    } finally {
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const downloadQR = (venueName: string) => {
    const svg = document.getElementById('venue-qr-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${venueName.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleDownloadReport = async (reportType: string, reportTitle: string) => {
    const toastId = toast.loading(`Generating ${reportTitle}...`);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${endpoints.attendance.reports}?type=${reportType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.update(toastId, { render: 'Report downloaded successfully!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (error: any) {
      toast.update(toastId, { render: error.message || 'Error generating report', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(u => {
    const matchesSearch = (`${u.first_name || ''} ${u.last_name || ''}`).toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }) : [];

  const filteredVenues = Array.isArray(venues) ? venues.filter(v =>
    (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.building || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  const filteredCourses = Array.isArray(courses) ? courses.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.program || '').toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <PageHeader
          title="Admin Control Center"
          subtitle="Manage campus infrastructure, personnel, and academic schedules."
        />

        {/* ── Animated Tab Navigation ── */}
        <div className="relative bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/50 flex overflow-x-auto scrollbar-hide shadow-sm">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`relative flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold transition-colors duration-300 z-10 ${
                  isActive ? 'text-blue-700' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminTabHighlight"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Main Content Area ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Search & Add Bar */}
            {(activeTab === 'users' || activeTab === 'venues' || activeTab === 'courses') && (
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <div className="relative w-full sm:max-w-md">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}…`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    setFormData(activeTab === 'users' ? { role: 'student' } : {});
                    setEditingUser(null);
                    setEditingVenue(null);
                    setEditingCourse(null);
                    if (activeTab === 'users') setShowUserModal(true);
                    else if (activeTab === 'venues') setShowVenueModal(true);
                    else setShowCourseModal(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-blue-500/30"
                >
                  <Plus size={18} />
                  Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                </button>
              </div>
            )}

            {/* ── Users Tab ── */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {stats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden"
                    >
                      <Shield className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/10" />
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Total Lecturers</p>
                      <p className="text-4xl font-black text-gray-900">{stats.total_lecturers}</p>
                    </motion.div>
                    {stats.student_counts_by_program?.map((p: any, i: number) => (
                      <motion.div 
                        key={p.program}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                        className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden"
                      >
                        <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/10" />
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">{p.program || 'General'}</p>
                        <p className="text-4xl font-black text-gray-900">{p.count}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mb-4 bg-gray-100/80 p-1 rounded-xl border border-gray-200/40 w-fit">
                  {([
                    { id: 'all', label: 'All Users' },
                    { id: 'lecturer', label: 'Lecturers' },
                    { id: 'student', label: 'Students' },
                    { id: 'admin', label: 'Admins' },
                  ] as const).map(role => (
                    <button
                      key={role.id}
                      onClick={() => setRoleFilter(role.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        roleFilter === role.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4 hidden md:table-cell">Email</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-sm border border-white">
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                                  <p className="text-xs text-gray-500 md:hidden">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-medium hidden md:table-cell">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                user.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' :
                                user.role === 'lecturer' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' :
                                'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => { setFormData(user); setEditingUser(user); setShowUserModal(true); }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <Edit size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Venues Tab ── */}
            {activeTab === 'venues' && (
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4">Venue Details</th>
                        <th className="px-6 py-4 hidden sm:table-cell">Building</th>
                        <th className="px-6 py-4">Capacity</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredVenues.map(venue => (
                        <tr key={venue.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-base">{venue.name}</p>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">{venue.type}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium hidden sm:table-cell">{venue.building}</td>
                          <td className="px-6 py-4 text-gray-900 font-bold">{venue.capacity}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                              venue.status === 'free' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                              venue.status === 'reserved' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                              'bg-rose-50 text-rose-600 border-rose-100/50'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                venue.status === 'free' ? 'bg-emerald-500' : venue.status === 'reserved' ? 'bg-amber-500' : 'bg-rose-500'
                              }`} />
                              {venue.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setSelectedVenueQR(venue)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                                <QrCode size={16} />
                              </button>
                              <button onClick={() => { setFormData(venue); setEditingVenue(venue); setShowVenueModal(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => toast.error('Delete action disabled')} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Courses Tab ── */}
            {activeTab === 'courses' && (
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4">Program Designation</th>
                        <th className="px-6 py-4">Total Courses</th>
                        <th className="px-6 py-4 hidden sm:table-cell">Active Years</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Array.from(new Set((filteredCourses || []).map(c => c.program))).map(programName => {
                        const programCourses = (courses || []).filter(c => c.program === programName);
                        const years = Array.from(new Set(programCourses.map(c => c.academic_year))).sort().join(', ');
                        const displayProgram = programName || 'General';
                        return (
                          <tr key={displayProgram} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100/50 shadow-sm">
                                  {displayProgram.substring(0, 3).toUpperCase()}
                                </div>
                                <span className="font-bold text-gray-900 text-base">{displayProgram}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-semibold text-lg">
                              {programCourses.length}
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-medium hidden sm:table-cell">
                              Years: {years}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setSearch(programName)} 
                                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                View Courses <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Timetable Upload Tab ── */}
            {activeTab === 'timetable' && (
              <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 p-8 md:p-12 text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100/50">
                    <Upload size={32} className="text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3 font-heading">Master Timetable Upload</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                    Keep the campus synchronized. Upload the latest CSV or Excel timetable file to update venues and class schedules automatically.
                  </p>
                  
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                    <div className="relative border-2 border-dashed border-blue-200 bg-white hover:bg-blue-50/50 rounded-2xl p-10 transition-all duration-300">
                      <p className="text-gray-600 font-bold mb-2">Drag and drop your file here</p>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-6">Supports .csv, .xlsx</p>
                      
                      <input 
                        type="file" 
                        accept=".csv,.xlsx" 
                        className="hidden" 
                        id="timetable-upload" 
                        onChange={handleFileUpload} 
                      />
                      <label
                        htmlFor="timetable-upload"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        {loading ? 'Processing...' : 'Browse Files'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Reports Tab ── */}
            {activeTab === 'reports' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Venue Usage', desc: 'Utilization rates & historical venue data.', icon: <Building2 size={24} />, type: 'venue_usage', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
                  { title: 'Attendance Summary', desc: 'Global course & lecturer attendance stats.', icon: <Users size={24} />, type: 'attendance_summary', color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50' },
                  { title: 'Peak Hours', desc: 'Analyze busiest campus times and overlaps.', icon: <BarChart3 size={24} />, type: 'peak_hours', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
                  { title: 'Student Records', desc: 'Detailed individual student metrics.', icon: <BookOpen size={24} />, type: 'student_attendance', color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
                ].map((report, i) => (
                  <motion.div 
                    key={report.title}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${report.bg} flex items-center justify-center mb-6`}>
                      <div className={`bg-gradient-to-br ${report.color} bg-clip-text text-transparent`}>
                        {report.icon}
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 font-heading">{report.title}</h3>
                    <p className="text-gray-500 text-sm mb-8 flex-1 leading-relaxed">{report.desc}</p>
                    <button
                      onClick={() => handleDownloadReport(report.type, report.title)}
                      className="w-full py-3 px-4 border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      Generate CSV
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Modals ── */}
        <AnimatePresence>
          {selectedVenueQR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedVenueQR(null)} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              >
                <h3 className="text-2xl font-black text-gray-900 mb-1 font-heading">Venue Code</h3>
                <p className="text-gray-500 font-medium mb-8">{selectedVenueQR.name} <span className="mx-2">•</span> {selectedVenueQR.building}</p>
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 inline-block mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <QRCodeSVG 
                    id="venue-qr-svg"
                    value={JSON.stringify({ venue_id: selectedVenueQR.id })} 
                    size={220}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => setSelectedVenueQR(null)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                    Close
                  </button>
                  <button onClick={() => downloadQR(selectedVenueQR.name)} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">
                    <Download size={18} /> Save
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <button onClick={() => setShowUserModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-900 transition-colors"><X size={20} /></button>
                <h3 className="text-2xl font-black text-gray-900 mb-6 font-heading">{editingUser ? 'Edit User' : 'New User'}</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <input type="email" placeholder="Email Address" value={formData.email || ''} required className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, email: e.target.value})} />
                  <input type="password" placeholder={editingUser ? "New Password (optional)" : "Password"} required={!editingUser} className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, password: e.target.value})} />
                  <div className="flex gap-3">
                    <input type="text" placeholder="First Name" value={formData.first_name || ''} className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    <input type="text" placeholder="Last Name" value={formData.last_name || ''} className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                  <select value={formData.role || 'student'} className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none" onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>

                  {formData.role === 'student' && (
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                      <select value={formData.program || ''} className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, program: e.target.value})}>
                        <option value="">Select Program</option>
                        <option value="BSc IT">BSc IT</option>
                        <option value="BSc CS">BSc CS</option>
                        <option value="BSc NE">BSc NE</option>
                        <option value="BSc SE">BSc SE</option>
                        <option value="ODIT">ODIT</option>
                        <option value="ODCS">ODCS</option>
                      </select>
                      <div className="flex gap-3">
                        <select value={formData.academic_year || ''} className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, academic_year: e.target.value ? parseInt(e.target.value) : ''})}>
                          <option value="">Select Year</option>
                          {[1, 2, 3, 4].map(y => (
                            <option key={y} value={y}>Year {y}</option>
                          ))}
                        </select>
                        <input type="text" placeholder="Stream (e.g. A)" value={formData.stream || ''} className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, stream: e.target.value})} />
                      </div>
                    </div>
                  )}

                  {formData.role === 'lecturer' && (
                    <input type="text" placeholder="Staff ID (e.g. LEC-1002)" value={formData.staff_id || ''} className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, staff_id: e.target.value})} />
                  )}
                  <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all mt-4">{editingUser ? 'Save Changes' : 'Create User'}</button>
                </form>
              </motion.div>
            </div>
          )}

          {showVenueModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <button onClick={() => setShowVenueModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-900 transition-colors"><X size={20} /></button>
                <h3 className="text-2xl font-black text-gray-900 mb-6 font-heading">{editingVenue ? 'Edit Venue' : 'New Venue'}</h3>
                <form onSubmit={handleAddVenue} className="space-y-4">
                  <input type="text" placeholder="Venue Name (e.g. Block A Room 1)" value={formData.name || ''} required className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input type="text" placeholder="Building" value={formData.building || ''} required className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, building: e.target.value})} />
                  <div className="flex gap-3">
                    <input type="number" placeholder="Capacity" value={formData.capacity || ''} required className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                    <input type="text" placeholder="Type (e.g. Lab)" value={formData.type || ''} required className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, type: e.target.value})} />
                  </div>
                  <div className="flex gap-3">
                    <input type="number" placeholder="Floor (default: 1)" value={formData.floor !== undefined ? formData.floor : ''} className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, floor: e.target.value ? parseInt(e.target.value) : 1})} />
                  </div>
                  
                  <button
                    type="button"
                    onClick={getVenueLocation}
                    disabled={detectingLoc}
                    className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    {detectingLoc ? (
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Navigation size={12} fill="currentColor" />
                    )}
                    Use My Current Location GPS
                  </button>

                  <div className="flex gap-3">
                    <input type="number" step="any" placeholder="Latitude (e.g. -6.123)" value={formData.latitude || ''} className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, latitude: e.target.value ? parseFloat(e.target.value) : null})} />
                    <input type="number" step="any" placeholder="Longitude (e.g. 39.123)" value={formData.longitude || ''} className="w-1/2 px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, longitude: e.target.value ? parseFloat(e.target.value) : null})} />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all mt-4">{editingVenue ? 'Save Changes' : 'Create Venue'}</button>
                </form>
              </motion.div>
            </div>
          )}

          {showCourseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <button onClick={() => setShowCourseModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-900 transition-colors"><X size={20} /></button>
                <h3 className="text-2xl font-black text-gray-900 mb-6 font-heading">{editingCourse ? 'Edit Course' : 'New Course'}</h3>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <input type="text" placeholder="Course Code (e.g. CS101)" value={formData.code || ''} required className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, code: e.target.value})} />
                  <input type="text" placeholder="Course Name" value={formData.name || ''} required className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input type="text" placeholder="Program (e.g. BSc CS)" value={formData.program || ''} required className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" onChange={e => setFormData({...formData, program: e.target.value})} />
                  <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all mt-4">{editingCourse ? 'Save Changes' : 'Create Course'}</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}