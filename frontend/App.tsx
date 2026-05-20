import React, { Suspense } from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AppProvider } from './src/context/AppContext';
import Home from './src/pages/Home';
import Timetable from './src/pages/Timetable';
import Venues from './src/pages/Venues';
import VenueDetail from './src/pages/VenueDetail';
import ScanAttendance from './src/pages/ScanAttendance';
import MyAttendance from './src/pages/MyAttendance';
import MyClasses from './src/pages/MyClasses';
import AdminPanel from './src/pages/AdminPanel';
import NotFound from './src/pages/NotFound';
import Register from './src/pages/Register';
import Login from './src/pages/Login';
import Profile from './src/pages/Profile';
import { useApp } from './src/context/AppContext';
import { Navigate } from 'react-router-dom';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loadingAuth } = useApp();
  
  if (loadingAuth) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Theme appearance="light" radius="large" scaling="100%">
      <AppProvider>
        <Router>
          <Suspense fallback={<div className="min-h-screen bg-[hsl(220,20%,97%)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[hsl(210,90%,55%)] border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
              <Route path="/timetable" element={<AuthGuard><Timetable /></AuthGuard>} />
              <Route path="/venues" element={<AuthGuard><Venues /></AuthGuard>} />
              <Route path="/venues/:id" element={<AuthGuard><VenueDetail /></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
              <Route path="/scan" element={<AuthGuard><ScanAttendance /></AuthGuard>} />
              <Route path="/attendance" element={<AuthGuard><MyAttendance /></AuthGuard>} />
              <Route path="/classes" element={<AuthGuard><MyClasses /></AuthGuard>} />
              <Route path="/admin" element={<AuthGuard><AdminPanel /></AuthGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </Router>
      </AppProvider>
    </Theme>
  );
};

export default App;