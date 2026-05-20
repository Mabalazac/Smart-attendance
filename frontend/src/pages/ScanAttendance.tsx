import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Clock, XCircle, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import QRScannerUI from '../components/QRScannerUI';
import { apiFetch, endpoints } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

type PipelineStep = 'gps_verify' | 'qr_scan' | 'checking_in' | 'success';

export default function ScanAttendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // We MUST have a session_id in the URL to start the pipeline
  const sessionId = searchParams.get('session_id');

  const [activeSession, setActiveSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [step, setStep] = useState<PipelineStep>('gps_verify');
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [scanAttempt, setScanAttempt] = useState(0);

  // 1. Fetch the specific session to check if it's active and get its coordinates
  useEffect(() => {
    if (!sessionId) {
      setLoadingSession(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const data = await apiFetch<any>(`${endpoints.attendance.sessions}${sessionId}/`);
        setActiveSession(data);
        if (data.status === 'active') {
          // Auto-start GPS verification
          verifyLocation(data);
        }
      } catch (err) {
        console.error("Session fetch failed", err);
      } finally {
        setLoadingSession(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Haversine distance formula (client-side preview)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 2. Step 1: Verify GPS Location
  const verifyLocation = (session: any) => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ lat, lng });

        // Client-side distance preview if venue coords exist
        if (session.venue_latitude != null && session.venue_longitude != null) {
          const dist = calculateDistance(lat, lng, session.venue_latitude, session.venue_longitude);
          if (dist > 5) {
            setGpsError(`You are ~${Math.round(dist)}m away from the venue. Please move closer (≤5m).`);
            return;
          }
        }
        
        // GPS passed! Move to step 2 automatically.
        toast.success("Location verified. Opening scanner...");
        setTimeout(() => setStep('qr_scan'), 1000);
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === 1) msg = 'Location permission denied. Please allow location access in your browser.';
        if (error.code === 2) msg = 'Location unavailable. Check your GPS signal.';
        if (error.code === 3) msg = 'Location request timed out. Please try again.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 3. Step 2 & 3: QR Scanned -> Submit to Server
  const handleQRSuccess = async (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (!data.venue_id) throw new Error("Invalid QR code format");

      if (!gpsCoords) {
        toast.error("GPS coordinates missing. Restarting process.");
        setStep('gps_verify');
        return;
      }

      // Ensure that the scanned venue matches the session's venue
      if (activeSession && Number(data.venue_id) !== Number(activeSession.venue)) {
        throw new Error(`Invalid QR code! This QR code does not belong to ${activeSession.venue_name}.`);
      }

      setStep('checking_in');
      setChecking(true);

      const payload = {
        session_id: Number(sessionId),
        qr_venue_id: data.venue_id,
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lng,
      };

      const response: any = await apiFetch(endpoints.attendance.checkin, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.success) {
        toast.success(response.message || 'Attendance marked successfully!');
        setStep('success');
      }
    } catch (e: any) {
      setStep('qr_scan'); // Drop back to scanner on error
      setScanAttempt(prev => prev + 1); // Force scanner remount
      toast.error(e.message || "Failed to process QR code. Is it a valid Venue QR?");
    } finally {
      setChecking(false);
    }
  };

  if (!sessionId) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-12">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Session Selected</h2>
          <p className="text-gray-500 mb-6">Please navigate here from a live class on your timetable.</p>
          <button 
            onClick={() => navigate('/timetable')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Go to Timetable
          </button>
        </div>
      </Layout>
    );
  }

  if (loadingSession) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto pb-10">
        <PageHeader
          title="Sign Attendance"
          subtitle="Complete the steps to record your presence"
        />

        {/* ── Active Session Banner ── */}
        {activeSession && activeSession.status === 'active' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">
                Target Class
              </span>
            </div>
            <p className="font-bold text-gray-900">{activeSession.course_name}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {activeSession.course_code} · {activeSession.venue_name}
            </p>
          </motion.div>
        ) : (
          <motion.div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
            <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-bold text-sm">Session Ended</p>
              <p className="text-amber-700 text-xs mt-0.5">This session is no longer active.</p>
            </div>
          </motion.div>
        )}

        {/* ── Pipeline Steps UI ── */}
        {activeSession?.status === 'active' && (
          <div className="space-y-6">
            
            {/* Step 1: GPS */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${
              step === 'gps_verify' 
                ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]' 
                : 'bg-gray-50 border-gray-200 opacity-70'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === 'gps_verify' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {step === 'gps_verify' ? '1' : <CheckCircle size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">GPS Verification</h3>
                  <p className="text-sm text-gray-500">Checking proximity to venue</p>
                </div>
              </div>

              {step === 'gps_verify' && (
                <div className="mt-4 text-center">
                  {!gpsError ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Loader2 size={32} className="text-blue-500 animate-spin" />
                      <p className="text-sm font-medium text-gray-600">Acquiring satellite lock...</p>
                    </div>
                  ) : (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium">
                      {gpsError}
                      <button 
                        onClick={() => verifyLocation(activeSession)}
                        className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: QR Scan */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${
              step === 'qr_scan' || step === 'checking_in'
                ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]' 
                : step === 'success' 
                  ? 'bg-gray-50 border-emerald-200 opacity-70'
                  : 'bg-gray-50 border-gray-200 opacity-50'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === 'success' ? 'bg-emerald-500 text-white' 
                  : step === 'qr_scan' || step === 'checking_in' ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}>
                  {step === 'success' ? <CheckCircle size={18} /> : '2'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Scan Venue QR</h3>
                  <p className="text-sm text-gray-500">Verify physical presence</p>
                </div>
              </div>

              {step === 'qr_scan' && (
                <div className="mt-4">
                  <QRScannerUI key={scanAttempt} onSuccess={handleQRSuccess} autoStart={true} />
                </div>
              )}

              {step === 'checking_in' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
                  <p className="font-bold text-gray-800">Validating Check-in...</p>
                  <p className="text-sm text-gray-500 mt-1">Confirming GPS & QR match server-side</p>
                </div>
              )}
            </div>

            {/* Step 3: Success */}
            <AnimatePresence>
              {step === 'success' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center shadow-lg"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-emerald-900 text-xl mb-1">Attendance Marked!</h3>
                  <p className="text-emerald-700 text-sm mb-6">You have successfully signed in.</p>
                  <button 
                    onClick={() => navigate('/timetable')}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Return to Timetable
                    <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </div>
    </Layout>
  );
}