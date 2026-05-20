import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, BookOpen } from 'lucide-react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { apiFetch, endpoints } from '../services/api';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function MyAttendance() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  const fetchRecords = async () => {
    try {
      const data = await apiFetch<any[]>(endpoints.attendance.records || 'http://localhost:8000/api/attendance/records/');
      setRecords(data);
    } catch (error) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filtered = records.filter(r => filter === 'all' || r.status === filter);

  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const total = records.length;
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  const statusIcon: any = {
    present: <CheckCircle size={16} className="text-emerald-500" />,
    late: <Clock size={16} className="text-amber-500" />,
    absent: <XCircle size={16} className="text-red-500" />,
  };

  const statusStyle: any = {
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    absent: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <Layout>
      <div className="max-full mx-auto">
        <PageHeader title="My Attendance" subtitle="Track your attendance across all enrolled courses" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Rate', value: `${rate}%`, icon: <TrendingUp size={18} />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Present', value: presentCount, icon: <CheckCircle size={18} />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Late', value: lateCount, icon: <Clock size={18} />, color: 'text-amber-600 bg-amber-50' },
            { label: 'Absent', value: absentCount, icon: <XCircle size={18} />, color: 'text-red-600 bg-red-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-lg font-heading font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'present', 'late', 'absent'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                filter === f
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-500/40'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-all duration-200"
              >
                <div className="shrink-0">{statusIcon[record.status]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{record.course_code}</span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-600 text-xs truncate">{record.course_name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{record.date}</span>
                    {record.timestamp && <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    <span>{record.venue_name || record.venue}</span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border shrink-0 capitalize ${statusStyle[record.status]}`}>
                  {record.status}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}