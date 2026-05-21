import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room } from '../types';
import { Check, Info, Plus, Trash2, Send, Clock, Eye, Star, Target, Pause, Play, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import Timer from './Timer';

interface Props {
  room: Room;
  phase: 'rating' | 'positives' | 'improvements';
  userId: string;
  onSubmit: (data: any) => void;
  onToggleTimer: () => void;
  isHost: boolean;
  onForceReveal: () => void;
  onPrev: () => void;
}

export default function Voting({ room, phase, userId, onSubmit, onToggleTimer, isHost, onForceReveal, onPrev }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [list, setList] = useState<string[]>(() => {
    if (phase === 'rating') return [''];
    const saved = localStorage.getItem(`retro_draft_${room.id}_${phase}`);
    return saved ? JSON.parse(saved) : [''];
  });

  React.useEffect(() => {
    if (phase !== 'rating') {
      localStorage.setItem(`retro_draft_${room.id}_${phase}`, JSON.stringify(list));
    }
  }, [list, phase, room.id]);

  const participant = room.participants.find(p => p.id === userId);
  const submitted = participant?.hasSubmitted || false;
  const submittedCount = room.participants.filter(p => p.hasSubmitted).length;
  const totalCount = room.participants.length;

  const handleAddField = () => {
    if (phase === 'improvements' && list.length >= 3) return;
    setList([...list, '']);
  };

  const handleUpdateField = (idx: number, val: string) => {
    const next = [...list];
    next[idx] = val;
    setList(next);
  };

  const handleRemoveField = (idx: number) => {
    if (list.length > 1) setList(list.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (phase === 'rating') {
      if (rating !== null) onSubmit(rating);
    } else {
      onSubmit(list.filter(s => s.trim() !== ''));
      localStorage.removeItem(`retro_draft_${room.id}_${phase}`);
    }
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-2 border border-green-100 shadow-sm">
           <Check size={40} strokeWidth={3} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Submitted!</h2>
          <p className="text-slate-500">Waiting for {totalCount - submittedCount} more team members.</p>
        </div>
        
        {(room.timerEnd !== null || room.timerRemaining === 0) && (
          <div className="flex flex-col items-center gap-2">
            <Timer endTime={room.timerEnd || 0} isPaused={room.isTimerPaused || room.timerEnd === null} remainingTime={room.timerRemaining} />
            {isHost && (
              <button 
                onClick={onToggleTimer}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-wider"
              >
                {room.isTimerPaused ? <><Play size={12} className="fill-slate-500" /> Resume Timer</> : <><Pause size={12} className="fill-slate-500" /> Pause Timer</>}
              </button>
            )}
          </div>
        )}

        <div className="w-full max-w-xs bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
           <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
             <span>Progress</span>
             <span>{submittedCount} / {totalCount}</span>
           </div>
           <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
             <motion.div animate={{ width: `${(submittedCount / totalCount) * 100}%` }} className="bg-indigo-600 h-full rounded-full" />
           </div>
        </div>

        {isHost && (
          <button onClick={onForceReveal} className="flex items-center gap-2 px-6 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <Eye size={16} /> Force Reveal
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
             {isHost && (
               <button onClick={onPrev} title="Previous Step" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                  <ArrowLeft size={20} />
               </button>
             )}
             <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
               {phase === 'rating' && "Rate the Sprint"}
               {phase === 'positives' && <>What worked well? <Star className="text-amber-400 fill-amber-400" size={24} /></>}
               {phase === 'improvements' && <>How could we improve? <Target className="text-indigo-600" size={24} /></>}
             </h2>
          </div>
          <p className="text-slate-500">
            {phase === 'rating' && "Pick a score from 1 (worst) to 10 (perfect). Be honest."}
            {phase === 'positives' && "Highlight the wins and positives. Timeboxed to 3 minutes."}
            {phase === 'improvements' && "Write up to 3 ACTIONABLE improvements. Make them specific tasks."}
          </p>
        </div>
        {(room.timerEnd !== null || room.timerRemaining === 0) && (
          <div className="flex flex-col items-end gap-2 pr-2">
            <Timer endTime={room.timerEnd || 0} isPaused={room.isTimerPaused || room.timerEnd === null} remainingTime={room.timerRemaining} />
            {isHost && (
              <button 
                onClick={onToggleTimer}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-wider"
              >
                {room.isTimerPaused ? <><Play size={12} className="fill-slate-500" /> Resume</> : <><Pause size={12} className="fill-slate-500" /> Pause</>}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
        {phase === 'rating' && (
          <div className="space-y-10 py-4">
            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  className={cn(
                    "aspect-square rounded-2xl md:rounded-3xl font-bold transition-all text-xl border",
                    rating === num 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between px-2 text-[10px] font-bold text-slate-300 uppercase italic">
              <span>Could be better</span>
              <span>Perfect</span>
            </div>
            <button
               onClick={handleSubmit}
               disabled={rating === null}
               className={cn(
                 "w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg",
                 rating !== null ? "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700" : "bg-slate-100 text-slate-300 pointer-events-none"
               )}
            >
               Submit Rating
            </button>
          </div>
        )}

        {['positives', 'improvements'].includes(phase) && (
          <div className="space-y-6">
            {list.map((item, i) => (
              <div key={i} className="flex gap-3">
                <textarea 
                  autoFocus={i === list.length - 1}
                  placeholder={phase === 'positives' ? "A win for the team..." : "An actionable item (e.g. Set up a shared Slack channel for API docs)..."}
                  value={item}
                  onChange={(e) => handleUpdateField(i, e.target.value)}
                  className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm resize-none h-24"
                />
                {list.length > 1 && (
                  <button onClick={() => handleRemoveField(i)} className="p-3 self-start text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}

            {(phase === 'positives' || (phase === 'improvements' && list.length < 3)) && (
              <button onClick={handleAddField} className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors px-1">
                <Plus size={18} /> Add another {phase === 'positives' ? 'win' : 'improvement'}
              </button>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 mt-8"
            >
              <Send size={18} /> Submit Feedback
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
         <div className="flex items-center gap-1.5"><Clock size={14} /> Private Phase</div>
         <div className="h-1 w-1 rounded-full bg-slate-300" />
         <div className="flex items-center gap-1.5"><Eye size={14} /> {submittedCount} / {totalCount} Ready</div>
      </div>
    </div>
  );
}
