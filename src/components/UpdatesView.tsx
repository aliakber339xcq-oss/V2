import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { Bell, Image as ImageIcon, Send, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function UpdatesView({ user }: { user: User }) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [text, setText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const isAdmin = user.gmail === 'admin@gmail.com';

  const loadUpdates = async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_updates').select('*').order('created_at', { ascending: false });
    if (data) setUpdates(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (imageFiles.length + files.length > 10) {
        setError('You can only upload up to 10 images per post.');
        return;
      }
      setImageFiles(prev => [...prev, ...files]);
      setError('');
    }
  };

  const removeFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this update?")) return;
    const { error } = await supabase.from('platform_updates').delete().eq('id', id);
    if (!error) {
      loadUpdates();
    } else {
      alert("Failed to delete update.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && imageFiles.length === 0) return;
    
    setUploading(true);
    setError('');
    let imageUrls: string[] = [];
    
    // If they provided images, upload them
    if (imageFiles.length > 0) {
      try {
        const { data: keys } = await supabase.from('imgbb_keys').select('api_key').limit(1);
        if (keys && keys[0]) {
          const uploader = async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${keys[0].api_key}`, {
              method: 'POST',
              body: formData,
            });
            const resData = await res.json();
            if (resData.success) {
              return resData.data.url;
            }
            throw new Error('Upload failed for an image');
          };
          
          imageUrls = await Promise.all(imageFiles.map(uploader));
        } else {
            throw new Error('Image upload key not found');
        }
      } catch (err: any) {
        console.error('Image upload failed', err);
        setError('Failed to upload images. Please try again.');
        setUploading(false);
        return;
      }
    }
    
    const { error: insertError } = await supabase.from('platform_updates').insert({
      text,
      images: imageUrls,
    });
    
    setUploading(false);
    if (!insertError) {
      setText('');
      setImageFiles([]);
      loadUpdates();
    } else {
      setError("Failed to post update.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 max-w-md mx-auto pb-8">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
            <Bell size={24} />
        </div>
        <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Updates & News</h2>
            <p className="text-xs font-semibold text-slate-500">Stay informed about BDPAY</p>
        </div>
      </div>
      
      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm p-5 border border-slate-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

          <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2 relative z-10">
            Post New Update
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2 relative z-10">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          
          <div className="mb-4 relative z-10">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's new?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px] resize-none"
            />
          </div>

          <AnimatePresence>
            {imageFiles.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 flex flex-wrap gap-2 relative z-10">
                {imageFiles.map((file, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(i)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="relative overflow-hidden flex-1">
              <input 
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-colors border border-dashed bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100">
                <ImageIcon size={16} /> Add Images
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={uploading || (!text && imageFiles.length === 0)} 
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
            >
              {uploading ? 'Posting...' : <><Send size={16} /> Post Update</>}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => (
               <div key={i} className="bg-white h-40 rounded-3xl border border-slate-100 animate-pulse"></div>
             ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-medium text-sm">No updates yet</p>
          </div>
        ) : (
          updates.map(update => (
            <div key={update.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 flex flex-col items-center justify-center">
                          <span className="font-black text-[10px] uppercase tracking-widest">Admin</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        BDPAY Team
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                        </svg>
                      </h4>
                      <p className="text-[11px] font-bold tracking-wide text-slate-400 capitalize">{new Date(update.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteUpdate(update.id)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                {update.text && (
                  <p className="text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{update.text}</p>
                )}
              </div>
              
              {update.images && update.images.length > 0 && (
                <div className="px-5 pb-5 relative z-10">
                    <div className={`grid gap-2 outline outline-1 outline-slate-100 rounded-2xl overflow-hidden ${
                      update.images.length === 1 ? 'grid-cols-1' :
                      update.images.length === 2 ? 'grid-cols-2 aspect-[2/1]' :
                      update.images.length === 3 ? 'grid-cols-2 aspect-square' :
                      update.images.length >= 4 ? 'grid-cols-2 aspect-square' : ''
                    }`}>
                        {update.images.slice(0, 4).map((img: string, i: number) => {
                            if (update.images.length === 3 && i === 0) {
                                return (
                                  <div key={i} className="col-span-2 row-span-1 relative bg-slate-100">
                                    <img src={img} alt={`Update ${i+1}`} className="absolute inset-0 w-full h-full object-cover" />
                                  </div>
                                )
                            }
                            const isLastOfFour = i === 3;
                            const remaining = update.images.length - 4;
                            return (
                              <div key={i} className="relative bg-slate-100 w-full h-full min-h-[120px]">
                                <img src={img} alt={`Update ${i+1}`} className="absolute inset-0 w-full h-full object-cover" />
                                {isLastOfFour && remaining > 0 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-white font-black tracking-widest text-xl">+{remaining}</span>
                                    </div>
                                )}
                              </div>
                            )
                        })}
                    </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
