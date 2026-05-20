import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, BookOpen, Hash, Mail, Lock, User as UserIcon, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetch, endpoints } from '../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    academicYear: '',
    program: '',
    stream: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${endpoints.auth.login.replace('login/', 'register/')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          academic_year: parseInt(formData.academicYear) || null,
          program: formData.program,
          stream: formData.stream
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      toast.success('Registration successful. You can now log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error('Registration failed. Check inputs.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-xl relative z-10">
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600/20 to-emerald-600/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <UserPlus className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Join Smart Venue</h1>
            <p className="text-zinc-500 text-sm mt-3 text-center max-w-xs">Create your student account to access personalized schedules and live attendance tracking.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                  <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Last Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                  <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Program</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">Select Program</option>
                    <option value="BSc IT" className="bg-zinc-900 text-white">BSc in Information Technology (BSc IT)</option>
                    <option value="BSc CS" className="bg-zinc-900 text-white">BSc in Computer Science (BSc CS)</option>
                    <option value="BSc NE" className="bg-zinc-900 text-white">BSc in Network Engineering (BSc NE)</option>
                    <option value="BSc SE" className="bg-zinc-900 text-white">BSc in Software Engineering (BSc SE)</option>
                    <option value="ODIT" className="bg-zinc-900 text-white">Ordinary Diploma in IT (ODIT)</option>
                    <option value="ODCS" className="bg-zinc-900 text-white">Ordinary Diploma in CS (ODCS)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Academic Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">Select Year</option>
                    {[1, 2, 3].map(year => (
                      <option key={year} value={year} className="bg-zinc-900 text-white">Year {year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Stream</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-zinc-900 text-zinc-500">Select Stream (A, B, C...)</option>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                    <option key={s} value={s} className="bg-zinc-900 text-white">Stream {s}</option>
                  ))}
                  <option value="None" className="bg-zinc-900 text-white">No Stream</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transform active:scale-[0.98] transition-all duration-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-800/50 text-center">
            <p className="text-zinc-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                Sign In
                <span className="text-lg">→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
