import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, UserState } from '../types';
import { Users, Play, Copy, Check, X, Shield, Crown, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  room: Room;
  user: UserState;
  onStart: () => void;
  onSetSprintName: (name: string) => void;
  onKick: (id: string) => void;
}

export default function Lobby({ room, user, onStart, onSetSprintName, onKick }: Props) {
  const [copied, setCopied] = useState(false);
  const [editingSprint, setEditingSprint] = useState(false);
  const [tempSprintName, setTempSprintName] = useState(room.sprintName);

  React.useEffect(() => {
    setTempSprintName(room.sprintName);
  }, [room.sprintName]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSprintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetSprintName(tempSprintName);
    setEditingSprint(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Users size={14} /> Lobby
          </div>
          {user.isHost && editingSprint ? (
            <form onSubmit={handleSprintSubmit} className="flex items-center gap-2">
              <input 
                autoFocus
                type="text" 
                value={tempSprintName}
                onChange={(e) => setTempSprintName(e.target.value)}
                placeholder="e.g. Sprint 42"
                className="text-3xl font-bold bg-white border-b-2 border-indigo-600 focus:outline-none px-0"
                onBlur={handleSprintSubmit}
              />
            </form>
          ) : (
            <h2 
              onClick={() => user.isHost && setEditingSprint(true)}
              className={cn(
                "text-3xl md:text-4xl font-bold tracking-tight text-slate-900 cursor-pointer",
                !room.sprintName && "text-slate-300 italic font-medium"
              )}
            >
              {room.sprintName || "Name this session..."}
            </h2>
          )}
          <p className="text-slate-500">Waiting for everyone to join before we begin.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied Link' : 'Copy Share Link'}
          </button>
          
          {user.isHost && (
            <button 
              onClick={onStart}
              disabled={room.participants.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} /> Start Round
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/50">
            <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Info size={18} /> How to play
            </h3>
            <ul className="space-y-4 text-indigo-900/70 text-sm leading-relaxed">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 text-xs shadow-sm">1</span>
                <span><strong>Rate the sprint 1-10.</strong> Anonymously score the past iteration based on how perfect it was.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 text-xs shadow-sm">2</span>
                <span><strong>Explain your score.</strong> If it's not a 10, answer: "What would have made it a 10?" Focus only on constructive improvements.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 text-xs shadow-sm">3</span>
                <span><strong>No complaints.</strong> The rule of the Perfection Game is that suggestions must be phrased as things to <em>do</em>, not things that went <em>wrong</em>.</span>
              </li>
            </ul>
          </div>

          <div className="hidden lg:block p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 text-sm italic">"A rating of 10 means nothing could be improved."</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 px-2">
              Participants <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{room.participants.length}</span>
            </h3>
          </div>
          
          <div className="space-y-2 flex-1">
            {room.participants.map((p) => (
              <motion.div 
                layout
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm",
                    p.id === user.userId ? "bg-indigo-500" : "bg-slate-300"
                  )}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      {p.name}
                      {p.id === room.hostId && <Crown size={12} className="text-amber-500" title="Host" />}
                      {p.id === user.userId && <span className="text-[10px] text-indigo-500 font-medium">(You)</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Ready</span>
                  </div>
                </div>

                {user.isHost && p.id !== user.userId && (
                  <button 
                    onClick={() => onKick(p.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                    title="Kick Participant"
                  >
                    <X size={16} />
                  </button>
                )}
              </motion.div>
            ))}

            {room.participants.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Users size={32} className="mx-auto text-slate-200" />
                <p className="text-sm text-slate-400">Invite others with the room link</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50">
             <div className="flex items-center justify-center p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-400 gap-2">
               <Shield size={12} />
               Scores are anonymous, suggestions are public
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
