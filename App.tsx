
import React, { useState, useEffect } from 'react';
import StudentView from './components/StudentView';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { UserRole, AuthState, StudentProfile } from './types';
import { sosService } from './services/sosService';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('college_sos_auth');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, role: null, email: null };
  });

  useEffect(() => {
    // Seed the database with requested default users if it's empty/first run
    sosService.seedDefaultUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('college_sos_auth', JSON.stringify(auth));
  }, [auth]);

  const handleLogin = (role: UserRole, email: string, profile?: StudentProfile) => {
    setAuth({
      isLoggedIn: true,
      role,
      email,
      profile
    });
  };

  const handleLogout = () => {
    setAuth({
      isLoggedIn: false,
      role: null,
      email: null,
      profile: undefined
    });
  };

  if (!auth.isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      {auth.role === 'student' ? (
        <StudentView onLogout={handleLogout} profile={auth.profile} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
