import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room } from '../types';
import { Trophy, Star, Target, User, ArrowRight, RotateCcw, Share2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  room: Room;
  onRestart: () => void;
  isHost: boolean;
  onPrev: () => void;
}

export default function Summary({ room, onRestart, isHost, onPrev }: Props) {
  const stats = useMemo(() => {
    if (room.ratings.length === 0) return { avg: 0 };
    return { avg: Number((room.ratings.reduce((a, b) => a + b, 0) / room.ratings.length).toFixed(1)) };
  }, [room.ratings]);

  const favorites = useMemo(() => {
    return [...room.suggestions]
      .filter(s => s.type === 'positive')
      .sort((a, b) => b.votes.length - a.votes.length)
      .slice(0, 3);
  }, [room.suggestions]);

  const priorityImprovements = useMemo(() => {
    return [...room.suggestions]
      .filter(s => s.type === 'improvement')
      .sort((a, b) => b.votes.length - a.votes.length)
      .slice(0, 3);
  }, [room.suggestions]);

  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    const text = `Sprint Retro Summary: ${room.sprintName}\nScore: ${stats.avg}/10\nAction Items:\n${room.actionItems.map(i => `- ${i.text} (${i.owners.join(', ')})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 relative">
      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[70] flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-green-400" /> Summary copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100 text-[10px] font-black uppercase tracking-widest">
           <CheckCircle2 size={12} /> Retrospective Complete
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">{room.sprintName || "Untitled Sprint"}</h2>
        <div className="flex items-center justify-center gap-3 text-slate-500 font-medium">
           {room.participants.length > 0 && (
             <>
               <span>{room.participants.length} Participants</span>
               <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
             </>
           )}
           <span>Average Happiness: {stats.avg}/10</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Wins Section */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Star size={20} fill="currentColor" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Celebrated Wins</h3>
            </div>
            <div className="space-y-4">
               {favorites.map(s => (
                 <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{s.text}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {s.author} <span className="w-1 h-1 rounded-full bg-slate-300 mx-1" /> {s.votes.length} Votes
                    </div>
                 </div>
               ))}
               {favorites.length === 0 && <p className="text-slate-400 italic text-sm text-center py-6">No wins captured.</p>}
            </div>
         </div>

         {/* Improvements Section */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Target size={20} />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Key Themes</h3>
            </div>
            <div className="space-y-4">
               {priorityImprovements.map(s => (
                 <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{s.text}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {s.votes.length} Votes
                    </div>
                 </div>
               ))}
               {priorityImprovements.length === 0 && <p className="text-slate-400 italic text-sm text-center py-6">No specific themes identified.</p>}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-4 border-indigo-600 shadow-2xl shadow-indigo-100/50 space-y-8">
         <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900">Action Plan</h3>
            <button onClick={handleShare} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
               <Share2 size={20} />
            </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {room.actionItems.map((item, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                 <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 font-bold text-xs ring-2 ring-white">
                       {i + 1}
                    </div>
                    <div>
                       <p className="text-slate-900 font-bold leading-tight">{item.text}</p>
                       <div className="flex flex-wrap gap-2 mt-3">
                          {item.owners.map(o => (
                            <span key={o} className="flex items-center gap-1.5 text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-1 rounded-lg border border-slate-100">
                               <User size={10} /> {o}
                            </span>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
            ))}
            {room.actionItems.length === 0 && <div className="md:col-span-2 text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">No action items defined.</div>}
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        {isHost && (
          <>
            <button onClick={onPrev} className="bg-white text-slate-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-50 border border-slate-200 transition-all">
              <ArrowLeft size={20} /> Go Back
            </button>
            <button onClick={onRestart} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
              <RotateCcw size={20} /> New Retrospective
            </button>
          </>
        )}
        <button onClick={() => window.print()} className="bg-white text-slate-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-50 border border-slate-200 transition-all">
           Print Report
        </button>
      </div>
    </div>
  );
}
