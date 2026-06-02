import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface SignupFormProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSignup, onSwitchToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    gmail: '',
    pass: '',
    referralCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeviceBlocked, setIsDeviceBlocked] = useState(false);

  useEffect(() => {
    // Check if device is already registered
    const isRegistered = localStorage.getItem('bdpay_device_registered');
    if (isRegistered === 'true') {
      setIsDeviceBlocked(true);
      setError('This device is already registered to an account. Multiple signups are not allowed.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeviceBlocked) return;

    if (!formData.name || !formData.number || !formData.gmail || !formData.pass) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.gmail,
        password: formData.pass,
        options: {
          data: {
            name: formData.name,
            number: formData.number,
            referralCode: formData.referralCode,
            balance: 0,
            streak: 0,
            joinedAt: new Date().toISOString(),
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      const newUser: User = {
        id: data.user!.id,
        name: formData.name,
        number: formData.number,
        gmail: formData.gmail,
        pass: formData.pass,
        referralCode: formData.referralCode,
        balance: 0,
        streak: 0,
        joinedAt: new Date().toISOString(),
      };

      // Prevent future signups from this device
      localStorage.setItem('bdpay_device_registered', 'true');
      localStorage.setItem('bdpay_registered_user_data', JSON.stringify(newUser));
      
      onSignup(newUser);
    } catch (err: any) {
      setError(err.message || 'Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isDeviceBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Device Restricted</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={onSwitchToLogin}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary mb-2">BDPAY</h1>
          <p className="text-slate-500 text-sm">Create your earning account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g. Rakibul Islam"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
            <input 
              type="tel" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="01XXXXXXXXX"
              value={formData.number}
              onChange={e => setFormData({...formData, number: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Gmail)</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="your@gmail.com"
              value={formData.gmail}
              onChange={e => setFormData({...formData, gmail: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="••••••••"
              value={formData.pass}
              onChange={e => setFormData({...formData, pass: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Referral Code (Optional)</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Enter code"
              value={formData.referralCode}
              onChange={e => setFormData({...formData, referralCode: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors mt-6"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-primary font-medium hover:underline">
            Login
          </button>
        </p>
      </motion.div>
    </div>
  );
}
