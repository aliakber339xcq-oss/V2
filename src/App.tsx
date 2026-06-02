import { useState, useEffect } from 'react';
import { SignupForm } from './components/SignupForm';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'signup' | 'login'>('signup');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Rehydrate user from localStorage
    const storedUser = localStorage.getItem('bdpay_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // If no active session, check if device was ever registered to bypass signup
      const isRegistered = localStorage.getItem('bdpay_device_registered');
      if (isRegistered === 'true') {
        setView('login');
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('bdpay_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bdpay_user');
    setView('login');
  };

  if (isInitializing) return <div className="min-h-screen bg-slate-50"></div>;

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} setUser={setUser} />;
  }

  return view === 'signup' ? (
    <SignupForm 
      onSignup={handleLogin} 
      onSwitchToLogin={() => setView('login')} 
    />
  ) : (
    <LoginForm 
      onLogin={handleLogin} 
      onSwitchToSignup={() => {
        const isRegistered = localStorage.getItem('bdpay_device_registered');
        if (isRegistered === 'true') {
          alert('This device is already registered. You cannot create another account.');
        } else {
          setView('signup');
        }
      }} 
    />
  );
}
