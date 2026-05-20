import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import TimetableView from '../components/TimetableView';
import { useApp } from '../context/AppContext';
import { apiFetch, endpoints } from '../services/api';
import { toast } from 'react-toastify';

export default function Timetable() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = async () => {
    try {
      let url: string;

      if (currentUser?.role === 'student') {
        // Personalised schedule — filtered by program / year / stream on the backend
        url = endpoints.timetable.studentSchedule;
      } else if (currentUser?.role === 'lecturer') {
        // Lecturer sees their own weekly timetable (all days)
        url = endpoints.timetable.mySchedule();
      } else {
        // Admin sees the full timetable
        url = endpoints.timetable.list;
      }

      const data = await apiFetch<any[]>(url);
      setEntries(data);
    } catch (error) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchTimetable();

    // Poll every 30s so students see live sessions without manual reload
    const interval = setInterval(() => {
      if (currentUser) fetchTimetable();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Called when a student taps "Sign Attendance" on a live class card
  const handleCheckIn = (sessionId: number) => {
    navigate(`/scan?session_id=${sessionId}`);
  };

  const subtitle =
    currentUser?.role === 'lecturer'
      ? 'Your full weekly teaching schedule'
      : currentUser?.role === 'student'
      ? `${currentUser.program ?? ''} · Year ${currentUser.academic_year ?? ''} ${currentUser.stream ?? ''} — your personal schedule`
      : 'Full campus timetable';

  return (
    <Layout>
      <div className="max-w-full mx-auto">
        <PageHeader title="Timetable" subtitle={subtitle} />
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <TimetableView entries={entries} onCheckIn={handleCheckIn} />
        )}
      </div>
    </Layout>
  );
}