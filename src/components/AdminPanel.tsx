import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Submission, TaskItem } from '../types';
import { TASK_LIST } from '../data';
import { ArrowLeft, Check, X, KeySquare, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'submissions' | 'tasks' | 'keys'>('submissions');
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const [keys, setKeys] = useState<{id: string, api_key: string}[]>([]);
  const [newKey, setNewKey] = useState('');

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    link: '',
    tutorial_url: '',
    reward: '5',
    task_type: 'fb-reels'
  });

  useEffect(() => {
    if (tab === 'submissions') loadSubmissions();
    if (tab === 'keys') loadKeys();
    if (tab === 'tasks') loadTasks();
  }, [tab]);

  // --------------- Submissions Logic ---------------
  const loadSubmissions = async () => {
    setLoading(true);
    // Joining tasks manually since we might not have a foreign key set up cleanly for users
    const { data: subsData } = await supabase
      .from('submissions')
      .select('*, tasks(*)')
      .eq('status', 'pending');
    
    if (subsData) setSubmissions(subsData);
    setLoading(false);
  };

  const handleSubmissionAction = async (id: string, action: 'approved' | 'rejected', userId: string, reward: number) => {
    if (action === 'approved') {
      try {
        const { error } = await supabase.rpc('approve_task_submission', {
          p_submission_id: id,
          p_user_id: userId,
          p_reward: reward
        });
        
        if (error) {
          console.error("RPC Error:", error);
          await supabase.from('submissions').update({ status: action }).eq('id', id);
          alert("SQL function not found in Supabase. Please run the latest SQL from /supabase_setup.sql in your Supabase SQL editor.");
        }
      } catch (err) {
        await supabase.from('submissions').update({ status: action }).eq('id', id);
      }
    } else {
      await supabase.from('submissions').update({ status: action }).eq('id', id);
    }
    
    setSubmissions(submissions.filter(s => s.id !== id));
  };


  // --------------- API Keys Logic ---------------
  const loadKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from('imgbb_keys').select('*').eq('is_active', true);
    if (data) setKeys(data);
    setLoading(false);
  };

  const addKey = async () => {
    if (!newKey) return;
    const { data, error } = await supabase.from('imgbb_keys').insert({ api_key: newKey }).select();
    if (data && data[0]) {
      setKeys([...keys, data[0]]);
      setNewKey('');
    }
  };

  const deleteKey = async (id: string) => {
    await supabase.from('imgbb_keys').update({ is_active: false }).eq('id', id);
    setKeys(keys.filter(k => k.id !== id));
  };


  // --------------- Tasks Logic ---------------
  const loadTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('tasks').insert({
      title: newTaskForm.title,
      description: newTaskForm.description,
      link: newTaskForm.link,
      tutorial_url: newTaskForm.tutorial_url,
      reward: Number(newTaskForm.reward),
      task_type: newTaskForm.task_type
    }).select();
    
    if (data && data[0]) {
      setTasks([data[0], ...tasks]);
      setNewTaskForm({...newTaskForm, title: '', description: '', link: '', tutorial_url: ''});
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    await supabase.from('tasks').update({ is_active: !currentStatus }).eq('id', id);
    setTasks(tasks.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
  };


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
      <div className="bg-slate-800 px-4 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => setTab('submissions')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all ${tab === 'submissions' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setTab('tasks')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all ${tab === 'tasks' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            Tasks
          </button>
          <button 
            onClick={() => setTab('keys')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all ${tab === 'keys' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            ImgBB Keys
          </button>
        </div>


        {/* Submissions Tab */}
        {tab === 'submissions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Pending Proofs</h2>
            {loading ? <p className="text-slate-500">Loading...</p> : submissions.length === 0 ? <p className="text-slate-500">No pending submissions.</p> : submissions.map(sub => (
              <div key={sub.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{sub.tasks?.title || 'Unknown Task'}</h3>
                    <p className="text-xs text-slate-500">Reward: ৳{sub.tasks?.reward}</p>
                    <p className="text-xs text-slate-500 mt-1">User ID: {sub.user_id?.slice(0, 8)}...</p>
                  </div>
                </div>
                
                <a href={sub.screenshot_url} target="_blank" rel="noopener noreferrer" className="block text-indigo-600 font-medium text-sm hover:underline">
                  View Screenshot Proof
                </a>
                
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => handleSubmissionAction(sub.id, 'approved', sub.user_id, sub.tasks?.reward || 0)} className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-lg font-medium flex justify-center items-center gap-1 hover:bg-emerald-100">
                    <Check size={18} /> Approve
                  </button>
                  <button onClick={() => handleSubmissionAction(sub.id, 'rejected', sub.user_id, sub.tasks?.reward || 0)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-medium flex justify-center items-center gap-1 hover:bg-red-100">
                    <X size={18} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Add New Task</h2>
              <form onSubmit={addTask} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <select 
                    value={newTaskForm.task_type} 
                    onChange={e => setNewTaskForm({...newTaskForm, task_type: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {TASK_LIST.filter(t => !['gmail', 'recharge', 'typing', 'telegram'].includes(t.id)).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Task Title</label>
                  <input required type="text" value={newTaskForm.title} onChange={e => setNewTaskForm({...newTaskForm, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Watch Video & Subscribe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description (Optional)</label>
                  <textarea value={newTaskForm.description} onChange={e => setNewTaskForm({...newTaskForm, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Task details..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Link URL</label>
                  <input required type="url" value={newTaskForm.link} onChange={e => setNewTaskForm({...newTaskForm, link: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tutorial Image/Video URL (Optional)</label>
                  <input type="url" value={newTaskForm.tutorial_url} onChange={e => setNewTaskForm({...newTaskForm, tutorial_url: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="URL of tutorial video or image..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Reward (BDT)</label>
                  <input required type="number" step="0.1" value={newTaskForm.reward} onChange={e => setNewTaskForm({...newTaskForm, reward: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-slate-700">
                  <Plus size={18} /> Add Task
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800">Existing Tasks</h3>
              {tasks.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{t.title}</h4>
                    <p className="text-xs text-slate-500">[{t.task_type}] - ৳{t.reward}</p>
                  </div>
                  <button 
                    onClick={() => toggleTask(t.id, t.is_active)}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {t.is_active ? 'Active' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {tab === 'keys' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <KeySquare size={20} className="text-indigo-500" />
                Add ImgBB API Key
              </h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                  placeholder="Paste api key here..." 
                />
                <button onClick={addKey} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Add</button>
              </div>
              <p className="text-xs text-slate-500 mt-3">The app will use these keys to upload screenshots. If one fails, it tries the next.</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 mb-2">Active Keys</h3>
              {loading ? <p className="text-slate-500">Loading...</p> : keys.length === 0 ? <p className="text-slate-500">No keys added yet.</p> : keys.map(k => (
                <div key={k.id} className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-mono text-xs text-slate-600 truncate mr-4">{k.api_key}</span>
                  <button onClick={() => deleteKey(k.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
