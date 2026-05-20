import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, Clock, ArrowRight } from 'lucide-react';
import type { Venue } from '../context/AppContext';
import { motion } from 'framer-motion';

interface VenueCardProps {
  venue: Venue;
  index?: number;
}

const statusConfig = {
  free: {
    label: 'Free',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  reserved: {
    label: 'Reserved',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  occupied: {
    label: 'Occupied',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    border: 'border-red-200',
  },
};

export default function VenueCard({ venue, index = 0 }: VenueCardProps) {
  const status = statusConfig[venue.status as keyof typeof statusConfig] || statusConfig.free;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-bold text-gray-900 text-lg leading-tight">{venue.name}</h3>
          <p className="text-gray-500 text-sm mt-0.5">{venue.type}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border} shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <MapPin size={14} className="text-gray-400 shrink-0" />
          <span>{venue.building}, Floor {venue.floor}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Users size={14} className="text-gray-400 shrink-0" />
          <span>Capacity: {venue.capacity} seats</span>
        </div>
        {venue.nextAvailable && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Clock size={14} className="text-gray-400 shrink-0" />
            <span>Next: {venue.nextAvailable.course_code} at {venue.nextAvailable.start_time}</span>
          </div>
        )}
        {venue.currentClass && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-1 font-semibold">
            🔴 {venue.currentClass.course_code} — {venue.currentClass.course_name} ({venue.currentClass.lecturer})
          </div>
        )}
      </div>

      <Link
        to={`/venues/${venue.id}`}
        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-[hsl(210,90%,55%)]/30 text-[hsl(210,90%,55%)] text-sm font-semibold hover:bg-[hsl(210,90%,55%)] hover:text-white hover:border-[hsl(210,90%,55%)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(210,90%,55%)]/40"
      >
        View Details
        <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}