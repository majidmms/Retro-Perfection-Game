import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, ArrowRight, History, Calendar, Star, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { RetroHistory } from '../types';

interface Props {
  onCreate: (name: string, sprintName: string) => void;
  onJoin: (code: string, name: string) => void;
  onViewHistory: (retro: RetroHistory) => void;
  initialCode: string;
  history: RetroHistory[];
}

export default function CreateJoin({ onCreate, onJoin, onViewHistory, initialCode, history }: Props) {
  const [mode, setMode] = useState<'initial' | 'create' | 'join' | 'history'>(initialCode ? 'join' : 'initial');
  const [name, setName] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [code, setCode] = useState(initialCode || '');

  const containerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  if (mode === 'initial') {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-10 py-12">
        <div className="text-center space-y-4">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900"
          >
            Retro<span className="text-indigo-600">Flow</span>
          </motion.h2>
          <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">
            Surface improvements and celebrate wins. No complaints, only progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
          <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('create')}
            className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center space-y-4 shadow-sm group"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Plus size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Host a Session</h3>
              <p className="text-slate-400 text-xs">Create a new room for your team</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('join')}
            className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center space-y-4 shadow-sm group"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <Users size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Join a Session</h3>
              <p className="text-slate-400 text-xs">Enter a code to participate</p>
            </div>
          </motion.button>
        </div>

        {history.length > 0 && (
          <button 
            onClick={() => setMode('history')}
            className="text-slate-400 hover:text-indigo-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <History size={14} /> View History ({history.length})
          </button>
        )}
      </div>
    );
  }

  if (mode === 'history') {
    return (
      <div className="h-full flex items-center justify-center px-4 py-12">
        <motion.div 
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-xl shadow-indigo-100/50 border border-slate-100"
        >
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="text-indigo-600" /> Previous Sessions
            </h2>
            <button 
              onClick={() => setMode('initial')}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium"
            >
              Back
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((retro) => (
              <button
                key={retro.id}
                onClick={() => onViewHistory(retro)}
                className="w-full bg-slate-50 hover:bg-indigo-50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all flex items-center justify-between group"
              >
                <div className="text-left space-y-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{retro.sprintName || "Untitled Sprint"}</h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(retro.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-indigo-500"><Star size={10} fill="currentColor" /> {retro.avgRating}/10</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-white shadow-sm transition-all">
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Only stored locally on this device</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center px-4">
      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-xl shadow-indigo-100/50 border border-slate-100"
      >
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'create' ? 'Host a Session' : 'Join a Session'}
          </h2>
          <button 
            onClick={() => setMode('initial')}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            Back
          </button>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === 'create') onCreate(name, sprintName);
            else onJoin(code.toUpperCase(), name);
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Display Name</label>
              <input 
                autoFocus
                required
                type="text" 
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              />
            </div>

            {mode === 'create' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Sprint Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sprint 42"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>
            )}
          </div>

          {mode === 'join' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Room Code</label>
              <input 
                required
                type="text" 
                placeholder="XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-mono tracking-widest text-lg"
                maxLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!name || (mode === 'join' && !code)}
            className={cn(
              "w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg",
              name && (mode === 'create' || code) 
                ? "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
            )}
          >
            {mode === 'create' ? 'Start Session' : 'Join Room'}
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            By joining, you agree to the Perfection Game norm: <br />
            <strong>Constructive improvements only, no complaints.</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
