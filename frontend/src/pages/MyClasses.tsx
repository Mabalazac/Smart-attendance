import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Square, Users, Clock, ChevronDown, ChevronUp,
  CalendarDays, BookOpen, MapPin, Filter, RefreshCw,
} from 'lucide-react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { apiFetch, endpoints } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
const defaultDay = DAYS.includes(todayName) ? todayName : 'Monday';

type SessionStatus = 'upcoming' | 'ready' | 'active' | 'ended' | 'missed';

interface ScheduleEntry {
  id: number;                    // TimetableEntry id
  course_code: string;
  course_name: string;
  venue_name: string;
  target_class: string;
  lecturer_name: string;
  start_time: string;
  end_time: string;
  type: string;
  day: string;
  // Annotated by backend for today
  session_id: number | null;
  session_status: SessionStatus;
  // derived — set after start
  course?: number;
  venue?: number;
}

interface Attendee {
  id: number;
  student_name: string;
  student_id_num: string;
  status: string;
  timestamp: string;
}

const statusStyle: Record<SessionStatus, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  ended:    'bg-gray-100 text-gray-500 border-gray-200',
  upcoming: 'bg-amber-50 text-amber-700 border-amber-200',
  ready:    'bg-blue-50 text-blue-700 border-blue-200 animate-pulse font-bold',
  missed:   'bg-red-50 text-red-700 border-red-200',
};

export default function MyClasses() {
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ── Fetch timetable entries for the selected day ──
  const fetchSchedule = useCallback(async (day: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<ScheduleEntry[]>(endpoints.timetable.mySchedule(day));
      setEntries(data);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule(selectedDay);
  }, [selectedDay, fetchSchedule]);

  // ── Start a class session ──
  const startSession = async (entry: ScheduleEntry) => {
    setActionLoading(entry.id);
    try {
      await apiFetch(endpoints.sessions.start, {
        method: 'POST',
        body: JSON.stringify({
          timetable_entry: entry.id,
          venue: entry.venue || null,
          lecturer: undefined,  // set server-side from token
        }),
      });
      toast.success(`Session started for ${entry.course_code}! Students can now sign attendance.`);
      fetchSchedule(selectedDay);
    } catch (e: any) {
      toast.error(e.message || 'Failed to start session');
    } finally {
      setActionLoading(null);
    }
  };

  // ── End a class session ──
  const endSession = async (sessionId: number, courseCode: string) => {
    setActionLoading(sessionId);
    try {
      await apiFetch(endpoints.sessions.end(String(sessionId)), {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ended' }),
      });
      toast.info(`Session for ${courseCode} ended.`);
      fetchSchedule(selectedDay);
      setExpandedId(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to end session');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Load attendees for an active/ended session ──
  const fetchAttendees = async (sessionId: number) => {
    try {
      const data = await apiFetch<Attendee[]>(endpoints.attendance.session(String(sessionId)));
      setAttendees(data);
    } catch {
      setAttendees([]);
    }
  };

  const toggleExpand = (entry: ScheduleEntry) => {
    if (expandedId === entry.id) {
      setExpandedId(null);
    } else {
      setExpandedId(entry.id);
      if (entry.session_id) fetchAttendees(entry.session_id);
    }
  };

  const typeColor: Record<string, string> = {
    lecture: 'bg-blue-100 text-blue-600',
    lab:     'bg-purple-100 text-purple-600',
    tutorial:'bg-teal-100 text-teal-600',
  };

  return (
    <Layout>
      <div className="max-w-full mx-auto">
        <PageHeader
          title="My Classes"
          subtitle="Manage your teaching sessions and track attendance"
        />

        {/* ── Day selector ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {DAYS.map(day => (
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

          <button
            onClick={() => fetchSchedule(selectedDay)}
            className="shrink-0 ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-100 bg-white hover:border-blue-200 hover:text-blue-600 transition-all"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <CalendarDays size={32} />
            </div>
            <h3 className="text-gray-900 font-bold text-lg">No classes on {selectedDay}</h3>
            <p className="text-gray-500 text-sm mt-2">
              You have no timetable entries assigned for this day.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, i) => {
              const status: SessionStatus = entry.session_status || 'upcoming';
              const isExpanded = expandedId === entry.id;
              const busy = actionLoading === entry.id || actionLoading === (entry.session_id ?? -1);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    status === 'active'
                      ? 'border-emerald-300 ring-2 ring-emerald-300/20 shadow-emerald-50 shadow-lg'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="p-5">
                    {/* ── Header row ── */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-base ${typeColor[entry.type] || typeColor.lecture}`}>
                          {entry.type === 'lab' ? '🔬' : entry.type === 'tutorial' ? '✏️' : '📖'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h2 className="font-heading font-bold text-gray-900 text-lg">
                              {entry.course_code}
                            </h2>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border capitalize ${statusStyle[status]}`}>
                              {status === 'active' ? '● Live' : status === 'ready' ? 'Ready to Start' : status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">{entry.course_name}</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Meta grid ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 mb-5 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock size={13} className="text-gray-400" />
                        <span className="font-semibold">{entry.start_time} – {entry.end_time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MapPin size={13} className="text-gray-400" />
                        <span className="font-semibold truncate">{entry.venue_name || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-500">
                        <Filter size={13} />
                        <span className="font-bold uppercase tracking-tight">{entry.target_class || 'General'}</span>
                      </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="flex gap-2 flex-wrap">
                      {status === 'upcoming' && (
                        <button
                          disabled
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-sm font-bold cursor-not-allowed transition-all duration-200 focus:outline-none"
                        >
                          <Clock size={14} />
                          Not Time Yet
                        </button>
                      )}

                      {status === 'ready' && (
                        <button
                          id={`start-btn-${entry.id}`}
                          onClick={() => startSession(entry)}
                          disabled={busy}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg shadow-blue-500/25"
                        >
                          {busy ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play size={14} fill="currentColor" />
                          )}
                          Start Class
                        </button>
                      )}

                      {status === 'active' && (
                        <>
                          <button
                            id={`end-btn-${entry.session_id}`}
                            onClick={() => endSession(entry.session_id!, entry.course_code)}
                            disabled={busy}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-300"
                          >
                            {busy ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Square size={14} fill="currentColor" />
                            )}
                            End Class
                          </button>

                          <button
                            onClick={() => toggleExpand(entry)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all duration-200 ml-auto focus:outline-none"
                          >
                            <Users size={14} />
                            Live Attendance
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </>
                      )}

                      {status === 'ended' && (
                        <button
                          onClick={() => toggleExpand(entry)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all duration-200 focus:outline-none"
                        >
                          <BookOpen size={14} />
                          View Report
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Attendee panel ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                              <Users size={14} className="text-gray-400" />
                              Student Attendance List
                            </h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                              {attendees.length} signed in
                            </span>
                          </div>

                          {attendees.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <Users size={24} className="text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-400 text-sm">No students have signed in yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {attendees.map((record, idx) => (
                                <motion.div
                                  key={record.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                                      {record.student_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">
                                        {record.student_name}
                                      </p>
                                      <p className="text-xs text-gray-400">{record.student_id_num}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize ${
                                      record.status === 'present'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : record.status === 'late'
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}>
                                      {record.status}
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {new Date(record.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}