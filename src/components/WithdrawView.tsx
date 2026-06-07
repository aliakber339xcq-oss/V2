import React, { useState } from 'react';
import { User } from '../types';
import { Coins, AlertCircle, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export function WithdrawView({ user, totalReferrals, onWithdraw }: { user: User, totalReferrals: number, onWithdraw: () => void }) {
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'usdt'>('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const minWithdrawAmount = user.isPro ? 20 : 300;
  const canWithdraw = user.isPro ? (user.balance >= minWithdrawAmount) : (user.balance >= minWithdrawAmount && totalReferrals >= 4);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw) return;
    
    const numAmount = Number(amount);
    if (!accountNumber || !amount || isNaN(numAmount)) {
      setError('সঠিক তথ্য দিন।');
      return;
    }
    
    if (numAmount < minWithdrawAmount) {
      setError(`সর্বনিম্ন ${minWithdrawAmount} টাকা উত্তোলন করা যাবে।`);
      return;
    }
    
    if (numAmount > user.balance) {
      setError('অপর্যাপ্ত ব্যালেন্স।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1) Deduct balance
      const dummyId = '00000000-0000-0000-0000-000000000000';
      const { error: deductError } = await supabase.rpc('approve_task_submission', { 
         p_submission_id: dummyId, 
         p_user_id: user.id, 
         p_reward: -numAmount 
      });
      
      if (deductError) throw new Error('ব্যালেন্স কাটতে সমস্যা হয়েছে।');

      // 2) Insert withdrawal request
      const { error: withdrawError } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        amount: numAmount,
        status: `pending_${method}_${accountNumber}`
      });

      if (withdrawError) {
        // Rollback balance if insert failed
        await supabase.rpc('approve_task_submission', { 
           p_submission_id: dummyId, 
           p_user_id: user.id, 
           p_reward: numAmount 
        });
        throw withdrawError;
      }

      await supabase.auth.refreshSession();
      setSuccess(true);
      toast.success('Withdrawal request submitted successfully!', { icon: '💸' });
      setTimeout(() => {
        onWithdraw();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'উত্তোলন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 max-w-md mx-auto pb-24">
      <h2 className="text-xl font-bold text-slate-800 mb-4">ব্যালেন্স উত্তোলন (Withdraw)</h2>
      
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-lg p-6 mb-4 flex items-center justify-between border border-indigo-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-indigo-100 font-bold uppercase text-[10px] tracking-widest block mb-1">বর্তমান ব্যালেন্স</span>
          <span className="text-3xl font-black text-white tracking-tight">৳ {user.balance.toFixed(2)}</span>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center relative z-10 backdrop-blur-sm border border-white/20">
          <Wallet className="text-white" size={24} />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100 relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 relative z-10">
          <Coins className="text-amber-500" size={24} />
        </div>
        
        <h3 className="font-bold text-slate-800 mb-2 relative z-10">উত্তোলনের নিয়মাবলী</h3>
        <ul className="text-sm text-slate-600 space-y-2 mb-2 font-medium relative z-10">
           <li className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${user.balance >= minWithdrawAmount ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
             সর্বনিম্ন <strong className="text-slate-800">{minWithdrawAmount} টাকা</strong> হতে হবে। {user.isPro && <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded ml-1 uppercase font-bold">Pro</span>}
           </li>
           {!user.isPro && (
             <li className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${totalReferrals >= 4 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
               অন্তত <strong className="text-slate-800">৪ জন অ্যাক্টিভ রেফারেল</strong> থাকতে হবে (আপনার আছে {totalReferrals} জন)।
             </li>
           )}
           {user.isPro && (
             <li className="flex items-center gap-2 text-amber-600 font-bold">
               <CheckCircle2 size={14} className="text-amber-500" />
               BD Pro ইউজারদের জন্য কোনো রেফারেল প্রয়োজন নেই!
             </li>
           )}
        </ul>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-emerald-800 text-lg">আবেদন সফল!</h3>
          <p className="text-sm text-emerald-600">আপনার উত্তোলনের অনুরোধটি অ্যাডমিনের কাছে পাঠানো হয়েছে।</p>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100">
          
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">উত্তোলনের মাধ্যম</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'bkash', label: 'bKash', color: 'border-pink-200 bg-pink-50 text-pink-700', hover: 'hover:border-pink-300 hover:bg-pink-100', active: 'bg-pink-600 text-white shadow-pink-200 border-pink-600' },
                  { id: 'nagad', label: 'Nagad', color: 'border-orange-200 bg-orange-50 text-orange-700', hover: 'hover:border-orange-300 hover:bg-orange-100', active: 'bg-orange-500 text-white shadow-orange-200 border-orange-500' },
                  { id: 'rocket', label: 'Rocket', color: 'border-purple-200 bg-purple-50 text-purple-700', hover: 'hover:border-purple-300 hover:bg-purple-100', active: 'bg-purple-600 text-white shadow-purple-200 border-purple-600' },
                  { id: 'usdt', label: 'USDT (BEP-20)', sub: '30% Bonus!', color: 'border-teal-200 bg-teal-50 text-teal-700', hover: 'hover:border-teal-300 hover:bg-teal-100', active: 'bg-teal-600 text-white shadow-teal-200 border-teal-600' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`p-3 rounded-2xl text-xs font-black transition-all border-2 shadow-sm flex flex-col items-center justify-center gap-1 ${
                      method === m.id 
                        ? m.active
                        : `${m.color} ${m.hover}`
                    }`}
                  >
                    {m.label}
                    {m.sub && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white">{m.sub}</span>}
                    {m.sub && method !== m.id && <span className="text-[9px] bg-teal-500 text-white px-1.5 py-0.5 rounded">{m.sub}</span>}
                  </button>
                ))}
              </div>
              {method === 'usdt' && (
                <div className="mt-2 text-xs font-bold text-teal-600 bg-teal-50 p-2 rounded-lg border border-teal-100 flex items-center justify-center gap-1">
                  * Trust Wallet use korte hobe
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">একাউন্ট নম্বর ({method})</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">পরিমাণ (৳)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                <input
                  type="number"
                  required
                  min={minWithdrawAmount}
                  max={user.balance}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={minWithdrawAmount.toString()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-black text-indigo-700"
                />
              </div>
            </div>

            <div className="pt-2">
              {canWithdraw ? (
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-colors shadow-lg disabled:opacity-50"
                >
                  {loading ? 'প্রসেসিং...' : 'উত্তোলনের আবেদন করুন'}
                </button>
              ) : (
                <button 
                  type="button" 
                  disabled 
                  className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-xl font-bold cursor-not-allowed"
                >
                  নিয়মগুলো পূরণ হয়নি
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </motion.div>
  );
}
