import React from 'react';
import { Link } from 'react-router-dom';
import { Home, GraduationCap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,97%)] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(210,90%,55%)] flex items-center justify-center mx-auto mb-6">
          <GraduationCap size={32} className="text-white" />
        </div>
        <h1 className="font-heading font-bold text-gray-900 text-4xl mb-2">404</h1>
        <p className="font-heading font-semibold text-gray-700 text-xl mb-3">Page Not Found</p>
        <p className="text-gray-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(210,90%,55%)] text-white rounded-full font-semibold hover:bg-[hsl(210,90%,48%)] hover:scale-105 transition-all duration-200 shadow-lg shadow-[hsl(210,90%,55%)]/20 focus:outline-none focus:ring-2 focus:ring-[hsl(210,90%,55%)]/50"
        >
          <Home size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}