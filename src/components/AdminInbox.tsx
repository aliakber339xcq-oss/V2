import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, MessageSquare, Send, Image as ImageIcon, ChevronLeft, Bot, EyeOff, Archive, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminInbox({ onClose }: { onClose?: () => void }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New state for bottom tabs
  const [bottomTab, setBottomTab] = useState<'home' | 'messages'>('home');
  const [showArchived, setShowArchived] = useState(false);

  const [hiddenChats, setHiddenChats] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('admin_hidden_chats');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [archivedChats, setArchivedChats] = useState<string[]>(() => {
    const saved = localStorage.getItem('admin_archived_chats');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('admin_hidden_chats', JSON.stringify(hiddenChats));
  }, [hiddenChats]);

  useEffect(() => {
    localStorage.setItem('admin_archived_chats', JSON.stringify(archivedChats));
  }, [archivedChats]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeUserId) {
      loadMessages(activeUserId);
      setBottomTab('messages');
    }
  }, [activeUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, bottomTab]);

  const loadConversations = async () => {
    const { data: allChats } = await supabase.from('support_chats').select('user_id, created_at, text').order('created_at', { ascending: false }).limit(1000);
    if (allChats) {
       const { data: usersData } = await supabase.from('user_profiles').select('user_id, name, number, my_referral_code');
       const userMap = new Map((usersData || []).map(u => [u.user_id, u]));

       const map = new Map();
       for (const chat of allChats) {
         if (!map.has(chat.user_id)) {
           const profile = userMap.get(chat.user_id) || {} as any;
           map.set(chat.user_id, {
             user_id: chat.user_id,
             last_message: chat.text,
             last_time: chat.created_at,
             name: profile.name || 'Unknown User',
             number: profile.number || 'No Number'
           });
         }
       }
       setConversations(Array.from(map.values()));
    }
  };

  const loadMessages = async (userId: string) => {
    const { data } = await supabase.from('support_chats').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent, imageUrl?: string) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imageUrl || !activeUserId) return;

    const messageText = text;
    setText('');

    const newMessage = {
      id: Date.now().toString(),
      user_id: activeUserId,
      sender_type: 'admin',
      text: messageText,
      image_url: imageUrl || null,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);

    await supabase.from('support_chats').insert({
      user_id: activeUserId,
      sender_type: 'admin',
      text: messageText,
      image_url: imageUrl || null
    });
    
    loadConversations();
  };

  const handleHide = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setHiddenChats(prev => ({ ...prev, [userId]: new Date().toISOString() }));
  };

  const handleArchive = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই চ্যাটটি আর্কাইভ করতে চান? তারা আবার মেসেজ দিলেও এটি আর ইনবক্সে আসবে না।')) {
      setArchivedChats(prev => [...prev, userId]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUserId) return;

    setUploading(true);
    try {
      const { data: keys } = await supabase.from('imgbb_keys').select('api_key').eq('is_active', true).limit(1);
      if (keys && keys[0]) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${keys[0].api_key}`, {
          method: 'POST',
          body: formData,
        });
        const resData = await res.json();
        if (resData.success) {
          await handleSend(resData.data.url);
        } else {
          alert('Image upload API returned error: ' + (resData.error?.message || 'Unknown error'));
        }
      } else {
        alert('No active ImgBB API keys found. Please contact admin.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const visibleConversations = conversations.filter(conv => {
    if (showArchived) return true; // Show all when looking at archived/hidden
    if (archivedChats.includes(conv.user_id)) return false;
    if (hiddenChats[conv.user_id]) {
      const hideTime = new Date(hiddenChats[conv.user_id]).getTime();
      const messageTime = new Date(conv.last_time).getTime();
      if (messageTime <= hideTime) {
        return false;
      }
    }
    return true;
  });

  const handleUnhide = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const newHidden = { ...hiddenChats };
    delete newHidden[userId];
    setHiddenChats(newHidden);
  };

  const handleUnarchive = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setArchivedChats(prev => prev.filter(id => id !== userId));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      className="fixed inset-0 z-[60] bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100dvh]"
    >
      {/* Header Area based on active tab background */}
      <div className={`relative px-4 sm:px-6 pt-10 pb-4 transition-colors duration-500 ${bottomTab === 'home' ? 'bg-gradient-to-b from-slate-100 to-white' : 'bg-white border-b border-slate-100 py-4 pt-6'}`}>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors z-10"
          >
            <X size={20} className="text-slate-600" />
          </button>
        )}

        {bottomTab === 'home' && (
          <div className="relative z-10 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 leading-tight flex items-center gap-2">
              <MessageSquare size={24} className="text-[#0088cc]" />
              Support Inbox
            </h2>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`p-2 rounded-xl text-xs font-bold transition-colors ${showArchived ? 'bg-[#0088cc] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </button>
          </div>
        )}
        
        {bottomTab === 'messages' && (
           <div className="flex items-center gap-3 relative z-10">
               {activeUserId ? (
                 <>
                   <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-inner">
                      {conversations.find(c => c.user_id === activeUserId)?.name.substring(0, 2) || 'U'}
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                         {conversations.find(c => c.user_id === activeUserId)?.name || 'Select a User'}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                          {conversations.find(c => c.user_id === activeUserId)?.number || 'No Number'}
                      </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                       <Bot size={20} />
                   </div>
                   <div>
                       <h3 className="font-bold text-slate-800">Support Team</h3>
                       <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                           No user selected
                       </div>
                   </div>
                 </>
               )}
           </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
        {bottomTab === 'home' ? (
          <div className="p-4 space-y-3">
             {visibleConversations.length === 0 ? (
               <div className="text-center py-12 px-4 rounded-2xl bg-white text-slate-500 text-sm border border-dashed border-slate-200">
                 <MessageSquare size={24} className="mx-auto mb-2 text-slate-300" />
                 No incoming messages yet
               </div>
             ) : (
               <div className="space-y-3">
                 {visibleConversations.map((conv, index) => (
                   <button 
                     key={`${conv.user_id}-${index}`}
                     onClick={() => {
                        setActiveUserId(conv.user_id);
                        setBottomTab('messages');
                     }}
                     className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-white hover:bg-indigo-50/50 hover:border-indigo-100 transition-all flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md relative"
                   >
                     <div className="relative">
                       <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl shadow-inner flex items-center justify-center font-black tracking-widest text-sm uppercase transition-transform">
                          {conv.name.substring(0, 2)}
                       </div>
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <div className="flex justify-between items-start mb-1">
                         <h4 className="font-bold text-slate-800 text-sm truncate pr-20">{conv.name}</h4>
                       </div>
                       <div className="flex items-center gap-2 pr-12">
                         <span className="text-[10px] font-black bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 shrink-0">{conv.number}</span>
                         <p className="text-xs text-slate-500 truncate flex-1">{conv.last_message}</p>
                       </div>
                     </div>

                     {/* Actions */}
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mb-2">
                           {new Date(conv.last_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {hiddenChats[conv.user_id] ? (
                            <div 
                              onClick={(e) => handleUnhide(e, conv.user_id)}
                              className="p-1.5 bg-amber-100 text-amber-600 rounded-lg active:bg-amber-200 transition-colors"
                              title="Restore"
                            >
                              <Archive size={14} className="rotate-180" />
                            </div>
                          ) : (
                            <div 
                              onClick={(e) => handleHide(e, conv.user_id)}
                              className="p-1.5 bg-slate-100 text-slate-500 rounded-lg active:bg-amber-100 active:text-amber-600 transition-colors"
                              title="Hide until new message"
                            >
                              <EyeOff size={14} />
                            </div>
                          )}
                          
                          {archivedChats.includes(conv.user_id) ? (
                            <div 
                              onClick={(e) => handleUnarchive(e, conv.user_id)}
                              className="p-1.5 bg-red-100 text-red-600 rounded-lg active:bg-red-200 transition-colors"
                              title="Unarchive"
                            >
                              <Archive size={14} className="rotate-180" />
                            </div>
                          ) : (
                            <div 
                              onClick={(e) => handleArchive(e, conv.user_id)}
                              className="p-1.5 bg-slate-100 text-slate-500 rounded-lg active:bg-red-100 active:text-red-600 transition-colors"
                              title="Archive permanently"
                            >
                              <Archive size={14} />
                            </div>
                          )}
                        </div>
                     </div>
                   </button>
                 ))}
               </div>
             )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-slate-50">
             {activeUserId ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                      <div key={msg.id || i} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'} mb-2`}>
                        {msg.sender_type === 'user' && (
                           <div className="w-8 h-8 rounded-full bg-white text-slate-500 flex flex-col items-center justify-center shrink-0 mr-2 shadow-sm border border-slate-100 font-black text-[10px] uppercase">
                              {conversations.find(c => c.user_id === activeUserId)?.name.substring(0, 2) || 'U'}
                           </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender_type === 'admin' ? 'bg-[#0088cc] text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}>
                          {msg.image_url && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                               <img src={msg.image_url} alt="attachment" className="w-full max-h-48 object-cover" />
                            </div>
                          )}
                          {msg.text && (
                            <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          )}
                          <div className={`text-[9px] mt-1 font-bold ${msg.sender_type === 'admin' ? 'text-white/60' : 'text-slate-400'} flex justify-end`}>
                             {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0">
                     <div className="flex items-end gap-2">
                        <label className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors shrink-0 active:scale-95">
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
                           placeholder={uploading ? "Uploading image..." : "Write a message as Admin..."}
                           className="flex-1 max-h-32 min-h-[44px] bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none py-3"
                           rows={1}
                           disabled={uploading}
                        />
                        <button 
                           onClick={() => handleSend()}
                           disabled={!text.trim()}
                           className="p-3 bg-[#0088cc] text-white rounded-xl disabled:opacity-50 shrink-0 hover:bg-[#0077b3] transition-colors"
                        >
                           <Send size={20} />
                        </button>
                     </div>
                  </div>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                  <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <MessageSquare size={24} className="text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2">No Chat Selected</h3>
                  <p className="text-sm text-slate-500">Go to the Home tab and select a conversation to start chatting.</p>
                  <button 
                    onClick={() => setBottomTab('home')}
                    className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    View Inbox
                  </button>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Bottom Tabs */}
      <div className="flex border-t border-slate-100 bg-white pb-safe">
        <button 
          onClick={() => setBottomTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${bottomTab === 'home' ? 'text-[#0088cc]' : 'text-slate-400'}`}
        >
          <Home size={20} className={bottomTab === 'home' ? 'fill-[#0088cc]/20' : ''} />
          <span className="text-[10px] font-black uppercase tracking-wider">Inbox</span>
        </button>
        <button 
          onClick={() => setBottomTab('messages')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${bottomTab === 'messages' ? 'text-[#0088cc]' : 'text-slate-400'}`}
        >
          <MessageSquare size={20} className={bottomTab === 'messages' ? 'fill-[#0088cc]/20' : ''} />
          <span className="text-[10px] font-black uppercase tracking-wider">Chat</span>
        </button>
      </div>
    </motion.div>
  );
}
