import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Building2, Navigation, Clock, Wifi, Monitor, Wind, Mic } from 'lucide-react';
import Layout from '../components/Layout';
import { apiFetch, endpoints } from '../services/api';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import type { Venue } from '../context/AppContext';

const facilityIcons: Record<string, React.ReactNode> = {
  'Projector': <Monitor size={14} />,
  'AC': <Wind size={14} />,
  'Whiteboard': <Monitor size={14} />,
  'Microphone': <Mic size={14} />,
  'Computers': <Monitor size={14} />,
  'High-Speed Internet': <Wifi size={14} />,
  'Recording System': <Monitor size={14} />,
  'Smart TV': <Monitor size={14} />,
  'Video Conferencing': <Monitor size={14} />,
};

const statusConfig: any = {
  free: { label: 'Free', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  reserved: { label: 'Reserved', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  occupied: { label: 'Occupied', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
};

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const fetchVenue = async () => {
    try {
      const data = await apiFetch<Venue>(`${endpoints.venues.list}${id}/`);
      setVenue(data);
    } catch (error) {
      toast.error('Failed to load venue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenue();
  }, [id]);

  useEffect(() => {
    let watchId: number;
    if (isNavigating && 'geolocation' in navigator) {
      toast.info('Detecting your live location...', { autoClose: 2000 });
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error);
          toast.warn('Could not get your precise location. Please enable GPS.');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigating]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-full mx-auto flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!venue) {
    return (
      <Layout>
        <div className="max-w-full mx-auto text-center py-20">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-gray-900 text-2xl mb-2">Venue Not Found</h1>
          <p className="text-gray-500 mb-6">The venue you're looking for doesn't exist.</p>
          <Link to="/venues" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-all duration-200">
            <ArrowLeft size={16} />
            Back to Venues
          </Link>
        </div>
      </Layout>
    );
  }

  const status = statusConfig[(venue as any).status] || statusConfig.free;

  return (
    <Layout>
      <div className="max-full mx-auto">
        <Link
          to="/venues"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded"
        >
          <ArrowLeft size={16} />
          Back to Venues
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="font-heading font-bold text-gray-900 text-2xl md:text-3xl">{venue.name}</h1>
                <p className="text-gray-500 mt-1">{venue.type}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${status.bg} ${status.text} ${status.border} shrink-0`}>
                <span className={`w-2 h-2 rounded-full ${status.dot}`} aria-hidden="true" />
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={18} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-800">{venue.building}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 size={18} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Floor</p>
                  <p className="text-sm font-medium text-gray-800">Floor {venue.floor}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users size={18} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-sm font-medium text-gray-800">{venue.capacity} seats</p>
                </div>
              </div>
              {venue.nextAvailable && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock size={18} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Next Class</p>
                    <p className="text-sm font-medium text-gray-800">{venue.nextAvailable.course_code} · {venue.nextAvailable.start_time} – {venue.nextAvailable.end_time}</p>
                  </div>
                </div>
              )}
            </div>

            {venue.currentClass && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1">Currently In Use</p>
                <p className="text-sm text-red-800 font-bold">{venue.currentClass.course_code} — {venue.currentClass.course_name}</p>
                <p className="text-xs text-red-600 mt-0.5">Lecturer: {venue.currentClass.lecturer} · Started at {venue.currentClass.start_time}</p>
              </div>
            )}
          </div>

          {venue.facilities && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4">Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {venue.facilities.map((facility: string) => (
                  <span
                    key={facility}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm font-medium"
                  >
                    {facilityIcons[facility] || <Monitor size={14} />}
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-gray-900">
                {isNavigating ? 'Live Navigation' : 'Location Map'}
              </h2>
              {isNavigating && (
                <span className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  {userLocation ? 'GPS Tracking Active' : 'Acquiring Signal...'}
                </span>
              )}
            </div>
            <div className={`w-full transition-all duration-500 ${isNavigating ? 'h-96 md:h-[500px]' : 'h-56 md:h-72'} rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden`}>
              {venue.latitude != null && venue.longitude != null ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={isNavigating && userLocation
                    ? `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${venue.latitude},${venue.longitude}&output=embed`
                    : `https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&output=embed`
                  }
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <MapPin size={32} />
                  <p className="text-sm font-medium">Location coordinates unavailable</p>
                </div>
              )}
              {isNavigating && !userLocation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Locating you...
                </div>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              if (isNavigating) {
                setIsNavigating(false);
                return;
              }
              if (venue.latitude == null || venue.longitude == null) {
                e.preventDefault();
                toast.error('Coordinates are not available for this venue.');
                return;
              }
              setIsNavigating(true);
            }}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold hover:scale-[1.01] transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 ${
              isNavigating 
                ? 'bg-red-50 text-red-600 shadow-red-500/10 hover:bg-red-100 focus:ring-red-500/50 border border-red-200'
                : 'bg-blue-500 text-white shadow-blue-500/20 hover:bg-blue-600 focus:ring-blue-500/50'
            }`}
          >
            <Navigation size={18} />
            {isNavigating ? 'End Navigation' : 'Start Navigation'}
          </button>
        </motion.div>
      </div>
    </Layout>
  );
}