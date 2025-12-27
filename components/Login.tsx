
import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, Loader2, User } from 'lucide-react';
import { UserRole, StudentProfile } from '../types';
import { sosService } from '../services/sosService';

interface LoginProps {
  onLogin: (role: UserRole, email: string, profile?: StudentProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await sosService.login(identifier, password);
      if (result) {
        onLogin(result.role, identifier, result.profile);
      } else {
        setError('Invalid credentials. Please check your ID/Email and password.');
      }
    } catch (err) {
      setError('Connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4"
   
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-8 text-center">
<div className="w-24 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg px-3">
  <img
    src="https://bmp-lms.klh.edu.in/pluginfile.php/1/theme_moove/logo/1766548649/klh.png"
    alt="KLH University Logo"
    className="h-11 w-full object-contain"
  />
</div>

            <h1 className="text-2xl font-bold text-white tracking-tight">College SOS</h1>
            <p className="text-slate-400 text-sm mt-1">KLH University Emergency Response</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in zoom-in duration-200">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email or Roll Number</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="e.g. 2420030098"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Login to Portal'
                )}
              </button>
            </form>

           <div className="mt-6 pt-6 border-t border-slate-100 text-center">
  <p className="text-xs text-slate-500 mb-2">
    Authorized Personnel & Students Only
  </p>

  <p className="text-sm font-semibold text-red-500">
    Demo Credentials
  </p>

  <p className="mt-1 text-sm text-slate-700">
    <span className="font-medium">User ID:</span> 45@klh.edu.in <br />
    <span className="font-medium">Password:</span> demopass123
  </p>
</div>

          </div>
        </div>
        <p className="text-center text-slate-400 text-xs mt-8">
          © 2024 KLH University • Grievance & Safety Cell
        </p>
      </div>
    </div>
  );
};

export default Login;
