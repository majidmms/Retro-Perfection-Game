import React, { useState, useEffect } from 'react';
import { Clock, Pause, Play } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  endTime: number;
  isPaused?: boolean;
  remainingTime?: number | null;
}

export default function Timer({ endTime, isPaused, remainingTime }: Props) {
  const [timeLeft, setTimeLeft] = useState(isPaused ? (remainingTime || 0) : Math.max(0, endTime - Date.now()));

  useEffect(() => {
    if (isPaused) {
      if (remainingTime !== undefined && remainingTime !== null) setTimeLeft(remainingTime);
      return;
    }
    const timer = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, isPaused, remainingTime]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg border transition-all",
      timeLeft === 0 ? "bg-red-600 text-white border-red-700 animate-bounce scale-110 shadow-lg shadow-red-200" :
      isPaused ? "bg-slate-50 text-slate-400 border-slate-100" :
      timeLeft < 30000 ? "bg-red-50 text-red-500 animate-pulse border-red-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
    )}>
      {timeLeft === 0 ? <Clock size={20} className="animate-spin" /> : isPaused ? <Pause size={18} /> : <Clock size={20} />}
      {timeLeft === 0 ? "TIME'S UP!" : `${minutes}:${seconds.toString().padStart(2, '0')}`}
    </div>
  );
}
