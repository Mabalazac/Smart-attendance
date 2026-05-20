import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TopBarProps {
  scrolled: boolean;
}

export default function TopBar({ scrolled }: TopBarProps) {
  const { currentUser, setSidebarOpen, logout } = useApp();

  return (
    <header
      className={`fixed top-0 right-0 left-0 lg:left-64 z-20 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(210,90%,55%)]/40"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Smart Venue System</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(210,90%,55%)]/40"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
          </button>
          <Link to="/profile" className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-xl transition-colors">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop'}
              alt={currentUser?.first_name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[hsl(210,90%,55%)]/30"
            />
            <span className="hidden md:block text-sm font-medium text-gray-700 group-hover:text-[hsl(210,90%,55%)] transition-colors">
              {currentUser?.first_name} {currentUser?.last_name}
            </span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                logout();
              }} 
              className="ml-2 text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition-colors focus:outline-none"
            >
              Logout
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}