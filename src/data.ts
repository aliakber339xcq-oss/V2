import { 
  Youtube, 
  Globe, 
  Gamepad2, 
  Keyboard, 
  Smartphone, 
  Video, 
  Mail, 
  Send, 
  Crown, 
  CreditCard, 
  CheckSquare
} from 'lucide-react';

export const TASK_LIST = [
  { id: 'fb-reels', title: 'FB Reels View', icon: Video, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 'fb-custom', title: 'FB Customize Task', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'youtube', title: 'Youtube Task', icon: Youtube, color: 'text-red-500', bg: 'bg-red-100' },
  { id: 'website', title: 'Website Visit', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { id: 'gmail', title: 'Gmail Task', icon: Mail, color: 'text-red-400', bg: 'bg-red-50' },
  { id: 'telegram', title: 'Telegram Sell', icon: Send, color: 'text-sky-500', bg: 'bg-sky-100' },
  { id: 'playstore', title: 'Playstore Task', icon: Gamepad2, color: 'text-green-500', bg: 'bg-green-100' },
  { id: 'typing', title: 'Typing Task', icon: Keyboard, color: 'text-slate-600', bg: 'bg-slate-200' },
  { id: 'tiktok', title: 'Tiktok Task', icon: Smartphone, color: 'text-pink-500', bg: 'bg-pink-100' },
  { id: 'special', title: 'Special Task', icon: Video, color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 'premium', title: 'Premium Task', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-100' },
  { id: 'recharge', title: 'Mobile Recharge', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-100' },
];
