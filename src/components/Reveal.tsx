import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ArrowRight, Trophy, BarChart3, Star, Ghost, MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  room: Room;
  phase?: 'rating-review' | 'walkthrough';
  isHost: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export default function Reveal({ room, phase = 'rating-review', isHost, onNext, onPrev }: Props) {
  const stats = useMemo(() => {
    if (room.ratings.length === 0) return { avg: 0, median: 0, count: 0 };
    const sum = room.ratings.reduce((a, b) => a + b, 0);
    const sorted = [...room.ratings].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    return { avg: Number((sum / room.ratings.length).toFixed(1)), median: Number(median.toFixed(1)), count: room.ratings.length };
  }, [room.ratings]);

  const chartData = useMemo(() => new Array(10).fill(0).map((_, i) => ({ score: i + 1, count: room.ratings.filter(r => r === i + 1).length })), [room.ratings]);

  if (phase === 'walkthrough') {
    const positives = room.suggestions.filter(s => s.type === 'positive');
    return (
      <div className="space-y-10 pb-20">
        <div className="text-center space-y-3">
          <div className="flex justify-center"><div className="bg-amber-50 text-amber-500 p-4 rounded-full"><Star size={32} fill="currentColor" /></div></div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Wins & Positives Walkthrough</h2>
          <p className="text-slate-500">Every statement is valid. Ask questions only for better understanding.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {positives.map((s, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={s.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 flex-shrink-0">{s.author.charAt(0)}</div>
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.author}</p>
                   <p className="text-slate-800 font-medium">{s.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {positives.length === 0 && <div className="md:col-span-2 text-center py-20 text-slate-400">No positive items submitted.</div>}
        </div>

        {isHost && (
          <div className="flex justify-center items-center gap-4 pt-10">
            <button onClick={onPrev} className="bg-white text-slate-500 border border-slate-200 px-8 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
               <ArrowLeft size={20} /> Back
            </button>
            <button onClick={onNext} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
              Next: Improvements <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Rating Revealed</h2>
        <p className="text-slate-500">How the team feels about the sprint overall.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[ { label: 'Average', val: stats.avg, color: 'text-indigo-600' }, { label: 'Median', val: stats.median, color: 'text-slate-900' }, { label: 'Count', val: stats.count, color: 'text-slate-900' } ].map(s => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <div className={cn("text-4xl font-black font-mono tracking-tighter", s.color)}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-10"><BarChart3 size={20} className="text-slate-400" /><h3 className="text-xl font-bold text-slate-900">Score Distribution</h3></div>
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="count" radius={[8, 8, 8, 8]} isAnimationActive animationDuration={1000}>
                {chartData.map((e, i) => <Cell key={i} fill={e.count > 0 ? '#4f46e5' : '#f1f5f9'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isHost && (
        <div className="flex justify-center items-center gap-4">
          <button onClick={onPrev} className="bg-white text-slate-500 border border-slate-200 px-8 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
             <ArrowLeft size={20} /> Back
          </button>
          <button onClick={onNext} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
            Next: What Worked Well <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
