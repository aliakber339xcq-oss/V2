import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { MessageSquare, X, Home as HomeIcon, Send, Image as ImageIcon, CheckCircle2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function SupportWidget({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'home' | 'messages'>('home');
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (path === 'chat') {
        setIsOpen(true);
        setTab('messages');
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (window.location.pathname === '/chat') {
      setIsOpen(true);
      setTab('messages');
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (window.location.pathname !== '/chat') {
        window.history.pushState(null, '', '/chat');
      }
      loadMessages();
      loadUpdates();
      loadReviews();
    } else {
      if (window.location.pathname === '/chat') {
        window.history.pushState(null, '', '/home');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (tab === 'messages') {
      scrollToBottom();
    }
  }, [messages, tab]);

  const loadMessages = async () => {
    const { data } = await supabase.from('support_chats').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const loadUpdates = async () => {
    const { data } = await supabase.from('platform_updates').select('*').order('created_at', { ascending: false }).limit(2);
    if (data) setUpdates(data);
  };

  const loadReviews = async () => {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (user.gmail !== 'admin@gmail.com') {
      query = query.or(`is_admin.eq.true,user_id.eq.${user.id}`);
    }
    const { data } = await query.limit(2);
    if (data) setReviews(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imageUrl) return;

    const messageText = text;
    setText('');

    // Optimistic UI
    const newMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      sender_type: 'user',
      text: messageText,
      image_url: imageUrl || null,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);

    await supabase.from('support_chats').insert({
      user_id: user.id,
      sender_type: 'user',
      text: messageText,
      image_url: imageUrl || null
    });

    // Auto-reply logic for simple keywords
    const lowerText = messageText.toLowerCase();
    let autoReply = '';
    if (lowerText.includes('withdraw') || lowerText.includes('payment')) {
      autoReply = 'Withdrawals are processed within 24 hours. If it has been longer, please wait patiently.';
    } else if (lowerText.includes('refer')) {
      autoReply = 'You can find your referral code in the Referral tab. You need 4 active referrals to withdraw.';
    }

    if (autoReply) {
      setTimeout(async () => {
        await supabase.from('support_chats').insert({
          user_id: user.id,
          sender_type: 'admin',
          text: autoReply,
          image_url: null
        });
        loadMessages();
      }, 1000);
    } else {
       // Regular ping for admins
       loadMessages();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: keys } = await supabase.from('imgbb_keys').select('api_key').limit(1);
      if (keys && keys[0]) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${keys[0].api_key}`, {
          method: 'POST',
          body: formData,
        });
        const resData = await res.json();
        if (resData.success) {
          await handleSend(undefined, resData.data.url);
        }
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 bg-slate-900 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline outline-4 outline-white"
      >
        <MessageSquare size={24} />
      </button>

      {/* Widget Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-0 z-50 sm:inset-auto sm:bottom-24 sm:right-4 sm:w-[380px] sm:h-[600px] bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header Area based on active tab background */}
            <div className={`relative px-6 pt-12 pb-6 transition-colors duration-500 ${tab === 'home' ? 'bg-gradient-to-b from-indigo-50 to-white' : 'bg-white border-b border-slate-100 py-4 pt-6'}`}>
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors z-10"
              >
                <X size={20} className="text-slate-600" />
              </button>

              {tab === 'home' && (
                <div className="relative z-10">
                  <div className="flex -space-x-2 mb-6">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">S</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-500 flex items-center justify-center text-white text-xs font-bold">B</div>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 leading-tight">
                    Hi {user.name.split(' ')[0]} 👋 <br/> How can we help?
                  </h2>
                </div>
              )}
              
              {tab === 'messages' && (
                 <div className="flex items-center gap-3 relative z-10">
                     <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                         <Bot size={20} />
                     </div>
                     <div>
                         <h3 className="font-bold text-slate-800">Support Team</h3>
                         <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Typically replies in a few minutes
                         </div>
                     </div>
                 </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50 relative">
              {tab === 'home' ? (
                <div className="p-4 space-y-4">
                  <a 
                    href="https://t.me/Bdpaysite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#0088cc] p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all text-left text-white mb-2"
                  >
                    <div>
                      <h3 className="font-bold text-[16px] mb-1">Join our Telegram</h3>
                      <p className="text-sm text-white/90">Get live updates & support</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center transition-colors group-hover:scale-105">
                      <Send size={20} className="fill-white translate-x-0.5" />
                    </div>
                  </a>

                  <button 
                    onClick={() => setTab('messages')}
                    className="w-full bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all text-left"
                  >
                    <div>
                      <h3 className="font-bold text-slate-800 text-[15px] mb-1">Send us a message</h3>
                      <p className="text-sm text-slate-500">We typically reply in a few minutes</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Send size={18} />
                    </div>
                  </button>

                  {updates.length > 0 && (
                    <div className="mt-8">
                       <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-2">Recent Updates</h4>
                       <div className="space-y-3">
                         {updates.map(update => (
                           <div key={update.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                             {update.images && update.images.length > 0 && (
                                <img src={update.images[0]} className="w-full h-32 object-cover rounded-xl mb-3" alt="update" />
                             )}
                             <p className="text-sm text-slate-700 font-medium line-clamp-3">{update.text}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  {reviews.length > 0 && (
                    <div className="mt-8 mb-4">
                       <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-2">Recent Reviews</h4>
                       <div className="space-y-3">
                         {reviews.map(review => (
                           <div key={review.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-xs text-slate-800">{review.reviewer_name}</span>
                             </div>
                             {review.image_url && (
                                <img src={review.image_url} className="w-full h-24 object-cover rounded-xl mb-2" alt="review" />
                             )}
                             {review.text && (
                                <p className="text-sm text-slate-600 line-clamp-2">{review.text}</p>
                             )}
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                       <div className="text-center text-slate-400 text-sm mt-10">
                           No messages yet. Send a message to start the conversation!
                       </div>
                    ) : (
                      messages.map((msg, i) => (
                        <div key={msg.id || i} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                          {msg.sender_type === 'admin' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex flex-col items-center justify-center shrink-0 mr-2 shadow-inner">
                               <Bot size={14} />
                            </div>
                          )}
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender_type === 'user' ? 'bg-[#0088cc] text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}>
                            {msg.image_url && (
                              <div className="mb-2 rounded-xl overflow-hidden bg-black/5">
                                 <img src={msg.image_url} alt="attachment" className="w-full max-h-48 object-cover" />
                              </div>
                            )}
                            {msg.text && (
                              <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            )}
                            <div className={`text-[10px] mt-1 font-bold ${msg.sender_type === 'user' ? 'text-white/60' : 'text-slate-400'} flex justify-end`}>
                               {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Chat Input */}
                  <div className="bg-white p-3 border-t border-slate-100 flex items-end gap-2">
                    <label className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors shrink-0">
                      <ImageIcon size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <textarea 
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={uploading ? "Uploading image..." : "Write a message..."}
                      className="flex-1 max-h-32 min-h-[44px] bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none py-3"
                      rows={1}
                      disabled={uploading}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!text.trim() || uploading}
                      className="p-3 bg-[#0088cc] text-white rounded-xl disabled:opacity-50 shrink-0 hover:bg-[#0077b3] transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Nav */}
            <div className="bg-white border-t border-slate-100 flex justify-around p-2">
               <button 
                 onClick={() => setTab('home')}
                 className={`flex flex-col items-center gap-1 flex-1 p-2 rounded-xl transition-colors ${tab === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
               >
                 <HomeIcon size={20} className={tab === 'home' ? 'fill-indigo-600/20' : ''} />
                 <span className="text-[10px] font-bold">Home</span>
               </button>
               <button 
                 onClick={() => setTab('messages')}
                 className={`flex flex-col items-center gap-1 flex-1 p-2 rounded-xl transition-colors ${tab === 'messages' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
               >
                 <MessageSquare size={20} className={tab === 'messages' ? 'fill-indigo-600/20' : ''} />
                 <span className="text-[10px] font-bold">Messages</span>
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
