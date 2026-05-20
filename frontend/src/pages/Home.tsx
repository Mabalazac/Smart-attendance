import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, QrCode, CalendarDays, ClipboardList, TrendingUp, 
  Users, CheckCircle, Clock, MapPin, ChevronRight, Bell, Sparkles,
  UploadCloud, BarChart3, Shield, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { useApp } from '../context/AppContext';
import { apiFetch, endpoints } from '../services/api';
import { toast } from 'react-toastify';

function StudentDashboard({ stats }: { stats: any }) {
  const { currentUser } = useApp();
  const { 
    attendance_rate = 0, 
    free_venues = 0, 
    classes_today = 0, 
    sessions_attended = 0, 
    total_sessions = 0, 
    recent_attendance = [] 
  } = stats || {};

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-xl"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-blue-100">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100/80">Student Portal</span>
            {currentUser?.student_id && (
              <span className="px-2.5 py-0.5 bg-blue-400/20 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black tracking-widest text-blue-100 uppercase">
                ID: {currentUser.student_id}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-bold mb-3 font-heading">Manage your campus life with ease.</h2>
          <p className="text-blue-100/80 text-lg mb-6 leading-relaxed">
            Scan QR codes in your classrooms to mark attendance and find available study spaces in real-time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/timetable" 
              className="px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <QrCode size={18} />
              View Live Classes
            </Link>
            <Link 
              to="/venues" 
              className="px-6 py-3 bg-blue-500/30 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold hover:bg-blue-500/40 transition-all duration-200"
            >
              Explore Venues
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Attendance" value={`${attendance_rate}%`} icon={<TrendingUp size={20} />} color="text-emerald-600" bgColor="bg-emerald-50" change="Current semester" index={0} />
        <StatCard label="Free Venues" value={free_venues} icon={<Building2 size={20} />} color="text-blue-600" bgColor="bg-blue-50" change="Available now" index={1} />
        <StatCard label="Today's Classes" value={classes_today} icon={<CalendarDays size={20} />} color="text-purple-600" bgColor="bg-purple-50" change="Total scheduled" index={2} />
        <StatCard label="Attended" value={sessions_attended} icon={<CheckCircle size={20} />} color="text-teal-600" bgColor="bg-teal-50" change={`of ${total_sessions} sessions`} index={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-heading font-bold text-gray-900 text-lg mb-4">Quick Shortcuts</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Timetable', icon: <CalendarDays size={20} />, path: '/timetable', color: 'bg-indigo-50 text-indigo-600' },
              { label: 'History', icon: <ClipboardList size={20} />, path: '/attendance', color: 'bg-amber-50 text-amber-600' },
              { label: 'Map', icon: <MapPin size={20} />, path: '/venues', color: 'bg-rose-50 text-rose-600' },
              { label: 'Classes', icon: <Building2 size={20} />, path: '/classes', color: 'bg-emerald-50 text-emerald-600' },
            ].map(item => (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-50 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shadow-sm`}>
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-gray-900 text-lg">Recent Check-ins</h3>
            <Link to="/attendance" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              View History <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {recent_attendance.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <ClipboardList size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No attendance records found yet.</p>
              </div>
            ) : (
              recent_attendance.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{record.session__timetable_entry__course__code}</p>
                      <p className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold capitalize ${
                    record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LecturerDashboard({ stats }: { stats: any }) {
  const { 
    active_session, 
    today_classes = 0, 
    students_present = 0, 
    total_enrolled = 50, 
    today_schedule = [] 
  } = stats || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Live Sessions" value={active_session ? 1 : 0} icon={<Clock size={20} />} color="text-blue-600" bgColor="bg-blue-50" change="Active now" index={0} />
        <StatCard label="Today's Classes" value={today_classes} icon={<CalendarDays size={20} />} color="text-purple-600" bgColor="bg-purple-50" change="Scheduled" index={1} />
        <StatCard label="Students Present" value={students_present} icon={<Users size={20} />} color="text-emerald-600" bgColor="bg-emerald-50" change={active_session ? `of ${total_enrolled}` : 'No active session'} index={2} />
        <StatCard label="Participation" value={active_session ? `${Math.round((students_present / total_enrolled) * 100)}%` : '—'} icon={<TrendingUp size={20} />} color="text-teal-600" bgColor="bg-teal-50" change="Current rate" index={3} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-heading font-bold text-gray-900 text-lg mb-6">Today's Teaching Schedule</h3>
        <div className="space-y-3">
          {today_schedule.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No classes scheduled for today.</p>
            </div>
          ) : (
            today_schedule.map((session: any) => (
              <div key={session.timetable_entry_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    session.status === 'active' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {session.status === 'active' ? <Clock size={24} className="animate-pulse" /> : <CalendarDays size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{session.timetable_entry__course__code}</h4>
                    <p className="text-sm text-gray-500">{session.venue__name} • {session.start_time} - {session.end_time || 'Ongoing'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold capitalize ${
                    session.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    session.status === 'ended' ? 'bg-gray-100 text-gray-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {session.status}
                  </span>
                  <Link to="/classes" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    <ChevronRight size={20} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ stats }: { stats: any }) {
  const { 
    total_students = 0, 
    total_lecturers = 0, 
    total_courses = 0, 
    active_sessions_today = 0,
    student_counts_by_program = [],
    total_venues = 0,
    free_now = 0,
    occupied = 0
  } = stats || {};

  return (
    <div className="space-y-8">
      {/* Strategic Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }} className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/5 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Total Students</p>
          <p className="text-4xl font-black text-gray-900">{total_students}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-3xl border border-emerald-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <Shield className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/5 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Faculty Members</p>
          <p className="text-4xl font-black text-gray-900">{total_lecturers}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-3xl border border-blue-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <BookOpen className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/5 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Academic Courses</p>
          <p className="text-4xl font-black text-gray-900">{total_courses}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-rose-50 to-white p-6 rounded-3xl border border-rose-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-rose-500/5 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Live Classes
          </p>
          <p className="text-4xl font-black text-gray-900">{active_sessions_today}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Overview */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="font-heading font-black text-gray-900 text-xl mb-6">Program Enrollment Distribution</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {student_counts_by_program.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-400 font-medium">No enrollment data available.</div>
            ) : (
              student_counts_by_program.map((program: any, i: number) => (
                <div key={i} className="flex flex-col p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                      {(program.program || 'Gen').substring(0, 3).toUpperCase()}
                    </div>
                    <span className="text-2xl font-black text-gray-900">{program.count}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{program.program || 'General Program'}</p>
                  <p className="text-xs text-gray-500 mt-1">Active Students</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-6">
             <div className="flex-1 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
               <p className="text-sm font-bold text-gray-900 mb-1">Infrastructure Load</p>
               <p className="text-xs text-gray-500 mb-3">{occupied} out of {total_venues} venues in use</p>
               <div className="w-full bg-emerald-100 rounded-full h-2">
                 <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${total_venues > 0 ? (occupied / total_venues) * 100 : 0}%` }}></div>
               </div>
             </div>
             <div className="flex-1 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50">
               <p className="text-sm font-bold text-gray-900 mb-1">System Health</p>
               <p className="text-xs text-gray-500 mb-3">All API services operational</p>
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Online</span>
               </div>
             </div>
          </div>
        </motion.div>

        {/* System Management Links */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="font-heading font-black text-gray-900 text-xl mb-6">Strategic Controls</h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Personnel & Users', desc: 'Role management', path: '/admin', icon: <Users size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Academic Master', desc: 'Timetable sync', path: '/admin', icon: <UploadCloud size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Campus Venues', desc: 'Capacity planning', path: '/admin', icon: <Building2 size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Analytics Hub', desc: 'Export datasets', path: '/admin', icon: <BarChart3 size={20} />, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((action, i) => (
              <Link
                key={action.label}
                to={action.path}
                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group bg-white"
              >
                <div className={`w-12 h-12 rounded-xl ${action.bg} ${action.color} flex items-center justify-center shrink-0 border border-white`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{action.label}</p>
                  <p className="text-xs font-medium text-gray-500">{action.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Home() {
  const { currentUser } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await apiFetch<any>(endpoints.admin.stats);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      toast.error('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Poll every 30s to keep dashboard stats fresh
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!currentUser) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading font-extrabold text-gray-900 text-3xl md:text-4xl"
          >
            {greeting()}, {currentUser.first_name} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-sm md:text-lg mt-2 flex items-center gap-2"
          >
            <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-xs font-bold capitalize">
              {currentUser.role}
            </span>
            <span className="text-gray-400">•</span>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </motion.p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Syncing your dashboard...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentUser.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentUser.role === 'student' && <StudentDashboard stats={stats} />}
              {currentUser.role === 'lecturer' && <LecturerDashboard stats={stats} />}
              {currentUser.role === 'admin' && <AdminDashboard stats={stats} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
}