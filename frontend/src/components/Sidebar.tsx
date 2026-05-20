import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  QrCode,
  ClipboardList,
  BookOpen,
  ShieldCheck,
  X,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['student', 'lecturer', 'admin'] },
  { label: 'Timetable', path: '/timetable', icon: <CalendarDays size={20} />, roles: ['student', 'lecturer', 'admin'] },
  { label: 'Free Venues', path: '/venues', icon: <Building2 size={20} />, roles: ['student', 'lecturer', 'admin'] },
  { label: 'Scan Attendance', path: '/scan', icon: <QrCode size={20} />, roles: ['student'] },
  { label: 'My Attendance', path: '/attendance', icon: <ClipboardList size={20} />, roles: ['student'] },
  { label: 'My Classes', path: '/classes', icon: <BookOpen size={20} />, roles: ['lecturer'] },
  { label: 'Admin Panel', path: '/admin', icon: <ShieldCheck size={20} />, roles: ['admin'] },
];

export default function Sidebar() {
  const { currentUser, sidebarOpen, setSidebarOpen } = useApp();

  const filtered = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    /* FIX: Removed the complex motion wrap that was fighting with the inner div.
       The 'lg:translate-x-0' makes it permanent on desktop.
    */
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-[hsl(220,30%,12%)] z-40 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0`}
      aria-label="Sidebar navigation"
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(210,90%,55%)] flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="font-heading text-white font-bold text-base leading-tight">
            SmartVenue
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-white/60 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* User Profile Section */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop'}
            alt={currentUser.first_name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[hsl(210,90%,55%)]/40"
          />
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{currentUser.first_name} {currentUser.last_name}</p>
            <p className="text-white/50 text-xs capitalize">{currentUser.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {filtered.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[hsl(210,90%,55%)] text-white shadow-lg shadow-[hsl(210,90%,55%)]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">Smart Venue v1.0</p>
      </div>
    </aside>
  );
}