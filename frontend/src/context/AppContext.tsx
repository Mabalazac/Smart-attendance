import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { endpoints, apiFetch } from '../services/api';

export type UserRole = 'student' | 'lecturer' | 'admin';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  email: string;
  avatar: string;
  student_id?: string;
  staff_id?: string;
  academic_year?: number;
  program?: string;
  stream?: string;
}

export interface VenueCurrentClass {
  session_id: number;
  course_code: string;
  course_name: string;
  lecturer: string;
  target_class: string;
  start_time: string;
}

export interface VenueNextAvailable {
  course_code: string;
  start_time: string;
  end_time: string;
}

export interface Venue {
  id: number;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  latitude: number;
  longitude: number;
  type: string;
  status?: string;
  nextAvailable?: VenueNextAvailable | null;
  currentClass?: VenueCurrentClass | null;
  facilities?: string[];
}

export interface TimetableEntry {
  id: number;
  course_code: string;
  course_name: string;
  lecturer_name: string;
  venue_name: string;
  day: string;
  start_time: string;
  end_time: string;
  type: 'lecture' | 'lab' | 'tutorial';
  target_class?: string;
  isActive?: boolean;
}



interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  loadingAuth: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Check local storage for token on load
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoadingAuth(false);
    }
  }, []);

  const fetchCurrentUser = async (token: string) => {
    try {
      const userData = await apiFetch<User>(endpoints.auth.me);
      setCurrentUser(userData);
    } catch (err) {
      console.error('Session expired or error fetching user', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoadingAuth(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data: any = await apiFetch(endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setCurrentUser(data.user);
    } else {
      throw new Error('Invalid login response');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, login, logout, sidebarOpen, setSidebarOpen, loadingAuth }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}