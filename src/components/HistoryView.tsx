import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Submission, User } from '../types';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function HistoryView({ user }: { user: User }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('*, tasks(title, reward)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 max-w-md mx-auto pb-24">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Task History</h2>
      
      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading history...</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-slate-500">
          <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p>No task history available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{sub.tasks?.title || 'Unknown Task'}</h3>
                <p className="text-xs text-slate-500 mt-1">Reward: ৳{sub.tasks?.reward}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(sub.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                {sub.status === 'pending' && (
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-100">
                    <AlertCircle size={14} /> Pending
                  </span>
                )}
                {sub.status === 'approved' && (
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-100">
                    <CheckCircle2 size={14} /> Approved
                  </span>
                )}
                {sub.status === 'rejected' && (
                  <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-lg text-xs font-medium border border-red-100">
                    <XCircle size={14} /> Rejected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
