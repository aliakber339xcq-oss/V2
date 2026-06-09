import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Video, AlertCircle, PlayCircle } from 'lucide-react';

export function TutorialView() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorialUrl = async () => {
      const { data } = await supabase.from('site_settings').select('tutorial_url').limit(1).single();
      if (data && data.tutorial_url) {
        setVideoUrl(data.tutorial_url);
      }
      setLoading(false);
    };
    fetchTutorialUrl();
  }, []);

  const getEmbedUrl = (input: string) => {
    let fbUrl = input.trim();
    
    // If input is just numeric (a video ID)
    if (/^\d+$/.test(fbUrl)) {
        fbUrl = `https://www.facebook.com/video.php?v=${fbUrl}`;
    } else if (fbUrl.includes('/reel/') || fbUrl.includes('/share/r/')) {
        fbUrl = fbUrl.split('?')[0]; // Clean query string for clean embed
    }
    
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fbUrl)}&show_text=false&width=auto`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-inner border border-indigo-100/50">
             <Video size={20} />
          </div>
          টিউটোরিয়াল
        </h2>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
           <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-sm"></div>
           <span className="font-bold uppercase tracking-widest text-[10px]">Loading Video...</span>
        </div>
      ) : videoUrl ? (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-4 sm:p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-bl-full -mr-10 -mt-10 z-0"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight flex justify-center items-center gap-2">
              <PlayCircle className="text-indigo-500" /> কিভাবে কাজ করবেন?
            </h3>
            
            <div className="relative w-full overflow-hidden aspect-[9/16] max-w-[320px] mx-auto bg-slate-900 rounded-[24px] shadow-2xl flex items-center justify-center border-4 border-slate-100">
              <iframe 
                src={getEmbedUrl(videoUrl)} 
                className="absolute top-0 left-0 w-full h-full bg-black/5"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no" 
                frameBorder="0" 
                allowFullScreen={true} 
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                title="Tutorial Video"
              />
            </div>
            
            <p className="text-slate-500 text-[14px] leading-relaxed mt-6 font-medium mx-auto max-w-[280px]">
               এই টিউটোরিয়াল ভিডিওটি সম্পূর্ণ দেখুন। তাহলে আপনি বুঝতে পারবেন কিভাবে কাজ করে পেমেন্ট নিতে হবে।
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="bg-amber-50 rounded-[32px] shadow-sm p-8 text-center border border-amber-100">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-amber-800 mb-1">কোনো টিউটোরিয়াল নেই</h3>
          <p className="text-amber-600 text-[13px] font-medium leading-relaxed max-w-[200px] mx-auto">বর্তমানে কোনো টিউটোরিয়াল ভিডিও দেওয়া নেই। পরবর্তীতে আবার চেক করুন।</p>
        </div>
      )}
    </motion.div>
  );
}
