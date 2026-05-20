import React, { useState } from 'react';
import { Clock, MapPin, User, BookOpen, Filter, Zap, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TimetableEntry {
  id: number;
  course_code: string;
  course_name: string;
  lecturer_name: string;
  venue_name: string;
  day: string;
  start_time: string;
  end_time: string;
  type: string;
  target_class?: string;
  isActive?: boolean;
  // Student: set when a ClassSession is currently active for this entry today
  active_session_id?: number | null;
  // Student: true if the user has already signed attendance for this active session
  is_signed_in?: boolean;
  // Lecturer: session info for today
  session_id?: number | null;
  session_status?: string;
}

interface TimetableViewProps {
  entries: TimetableEntry[];
  /** Called when a student presses "Sign Attendance" on a live class */
  onCheckIn?: (sessionId: number) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  lecture:      { label: 'Lecture',   color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: '📖' },
  lab:          { label: 'Lab',       color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🔬' },
  tutorial:     { label: 'Tutorial',  color: 'bg-teal-100 text-teal-700 border-teal-200',      icon: '✏️' },
  Practical_Lab:{ label: 'Practical', color: 'bg-indigo-100 text-indigo-700 border-indigo-200',icon: '⚗️' },
};

// Automatically highlight the current day of the week
const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

export default function TimetableView({ entries, onCheckIn }: TimetableViewProps) {
  const { currentUser } = useApp();

  const defaultDay = days.includes(todayName) ? todayName : 'Monday';
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('mine');

  // For students: does this entry belong to their stream?
  const isMyClass = (entry: TimetableEntry) => {
    if (!currentUser || currentUser.role !== 'student') return true;
    if (!entry.target_class) return true;
    const userClassStr = `${currentUser.program?.replace(/\s/g, '')}_${currentUser.academic_year}${currentUser.stream}`;
    const entryTarget = entry.target_class.toLowerCase();
    const userProgram = currentUser.program?.toLowerCase().replace('bsc ', '').split(' ')[0] || '';
    return (
      entryTarget.includes(userProgram) &&
      entryTarget.includes(`${currentUser.academic_year}${(currentUser.stream || '').toLowerCase()}`)
    );
  };

  const dayFiltered = entries.filter(e => e.day === selectedDay);
  const finalFiltered =
    filterMode === 'mine' && currentUser?.role === 'student'
      ? dayFiltered.filter(isMyClass)
      : dayFiltered;

  return (
    <div className="space-y-6">
      {/* ── Day Selector + Stream Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 focus:outline-none ${
                selectedDay === day
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : day === todayName
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {day}
              {day === todayName && (
                <span className="ml-1.5 text-[9px] font-black uppercase tracking-widest opacity-70">
                  Today
                </span>
              )}
            </button>
          ))}
        </div>

        {currentUser?.role === 'student' && (
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterMode('mine')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'mine'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Stream
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Streams
            </button>
          </div>
        )}
      </div>

      {/* ── Entry Cards ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedDay}-${filterMode}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {finalFiltered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <BookOpen size={32} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">No classes found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">
                {filterMode === 'mine'
                  ? `No classes in your stream for ${selectedDay}.`
                  : `No classes scheduled for ${selectedDay}.`}
              </p>
              {filterMode === 'mine' && dayFiltered.length > 0 && (
                <button
                  onClick={() => setFilterMode('all')}
                  className="mt-6 text-blue-600 font-bold text-sm hover:underline"
                >
                  View full campus timetable →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {finalFiltered.map((entry, i) => {
                const typeKey = entry.type in typeConfig ? entry.type : 'lecture';
                const type = typeConfig[typeKey];

                // A class is "live" for students when active_session_id is set
                const isLive =
                  currentUser?.role === 'student'
                    ? !!entry.active_session_id
                    : entry.session_status === 'active';

                const sessionStatus = entry.session_status || 'upcoming';
                const isMyEntry = isMyClass(entry);

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`group relative bg-white rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                      isLive
                        ? 'border-emerald-400 ring-4 ring-emerald-400/10 shadow-emerald-100 shadow-lg'
                        : isMyEntry && filterMode === 'all' && currentUser?.role === 'student'
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-gray-100'
                    }`}
                  >
                    {/* Live pulse badge */}
                    {isLive && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          Live
                        </span>
                      </div>
                    )}

                    {/* Lecturer: show upcoming/ended badge */}
                    {currentUser?.role === 'lecturer' && !isLive && (
                      <div className="absolute top-4 right-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                          sessionStatus === 'ended'
                            ? 'bg-gray-100 text-gray-400 border-gray-200'
                            : sessionStatus === 'missed'
                            ? 'bg-red-50 text-red-500 border-red-100'
                            : sessionStatus === 'ready'
                            ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse font-bold'
                            : 'bg-amber-50 text-amber-500 border-amber-200'
                        }`}>
                          {sessionStatus === 'ready' ? 'Ready' : sessionStatus}
                        </span>
                      </div>
                    )}
                    
                    {/* Student: show if missed or ready */}
                    {currentUser?.role === 'student' && (
                      <div className="absolute top-4 right-4">
                        {sessionStatus === 'missed' && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                            Not Taught
                          </span>
                        )}
                        {sessionStatus === 'ready' && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 animate-pulse font-bold">
                            Ready to Start
                          </span>
                        )}
                      </div>
                    )}


                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg shadow-sm ${type.color.split(' ')[0]}`}>
                        {type.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-heading font-black text-gray-900 text-lg tracking-tight uppercase">
                            {entry.course_code}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-black uppercase tracking-wider ${type.color}`}>
                            {type.label}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium truncate mb-4">
                          {entry.course_name}
                        </p>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock size={13} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-bold">
                              {entry.start_time} – {entry.end_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-bold truncate">
                              {entry.venue_name || 'TBA'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <User size={13} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-bold truncate">
                              {entry.lecturer_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-blue-500">
                            <Filter size={13} className="shrink-0" />
                            <span className="text-xs font-black tracking-tight uppercase">
                              {entry.target_class || 'General'}
                            </span>
                          </div>
                        </div>

                        {/* ── Student: Sign Attendance button ── */}
                        {currentUser?.role === 'student' && isLive && entry.active_session_id && (
                          entry.is_signed_in ? (
                            <button
                              disabled
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wide border border-emerald-200 cursor-not-allowed opacity-90"
                            >
                              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                <span className="text-[10px]">✓</span>
                              </div>
                              Signed In
                            </button>
                          ) : (
                            onCheckIn && (
                              <button
                                onClick={() => onCheckIn(entry.active_session_id!)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              >
                                <LogIn size={14} />
                                Sign Attendance
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}