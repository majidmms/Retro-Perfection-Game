import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Suggestion, ActionItem } from '../types';
import { ThumbsUp, Tag, Plus, Copy, Check, RotateCcw, XCircle, Share2, Filter, Target, Star, Trash2, User, Send, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  room: Room;
  phase?: 'discussion' | 'final-actions';
  userId: string;
  onUpvote?: (id: string) => void;
  onTag?: (id: string, tag: string) => void;
  onGroup?: (targetId: string, dragId: string) => void;
  onActionItem?: (text: string, owners: string[]) => void;
  isHost: boolean;
  onEnd?: () => void;
  onRestart?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

interface PillProps { 
  suggestion: Suggestion; 
  isGrouped?: boolean; 
  onUpvote?: (id: string) => void; 
  userId: string;
  onTag?: (id: string, tag: string) => void;
  isHost: boolean;
  key?: string | number;
}

function SuggestionPill({ suggestion, isGrouped = false, onUpvote, userId, onTag, isHost }: PillProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: suggestion.id });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(
      "p-4 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-all group",
      isGrouped && "ml-4 border-l-4 border-l-indigo-500"
    )}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{suggestion.author}</span>
             {suggestion.type === 'positive' && <Star size={10} className="text-amber-400 fill-amber-400" />}
          </div>
          <p className="text-sm font-medium text-slate-800">{suggestion.text}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onUpvote?.(suggestion.id); }}
          className={cn(
            "flex flex-col items-center justify-center w-10 h-10 rounded-xl border transition-all",
            suggestion.votes.includes(userId) ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-100 text-slate-400"
          )}
        >
          <ThumbsUp size={14} />
          <span className="text-[10px] font-bold">{suggestion.votes.length}</span>
        </button>
      </div>
    </div>
  );
}

export default function Discussion({ room, phase = 'discussion', userId, onUpvote, onGroup, onActionItem, isHost, onEnd, onRestart, onNext, onPrev }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'positives' | 'improvements'>('improvements');
  const [actionText, setActionText] = useState('');
  const [actionOwners, setActionOwners] = useState<string[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const topImprovements = useMemo(() => {
    const improvements = room.suggestions.filter(s => s.type === 'improvement');
    const themeScores: Record<string, { text: string, score: number, id: string }> = {};
    improvements.forEach(s => {
      const key = s.groupId || s.id;
      if (!themeScores[key]) themeScores[key] = { text: s.text, score: 0, id: s.id };
      themeScores[key].score = Math.max(themeScores[key].score, s.votes.length);
    });
    return Object.values(themeScores).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [room.suggestions]);

  const groups = useMemo(() => {
    let items = room.suggestions.filter(s => activeTab === 'all' || (activeTab === 'positives' ? s.type === 'positive' : s.type === 'improvement'));
    const grouped: Record<string, Suggestion[]> = {};
    const singles: Suggestion[] = [];
    
    items.forEach((s: Suggestion) => {
      if (s.groupId) {
        if (!grouped[s.groupId]) grouped[s.groupId] = [];
        grouped[s.groupId].push(s);
      } else {
        singles.push(s);
      }
    });

    return { grouped, singles };
  }, [room.suggestions, activeTab]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onGroup?.(over.id, active.id);
    }
  };

  if (phase === 'final-actions') {
    return (
      <div className="space-y-10 pb-20">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-extrabold text-slate-900">Final Action Items</h2>
          <p className="text-slate-500">Refine the top priorities and assign responsibility (up to 2 people).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
           <div className="md:col-span-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-2">Top Voted Improvements</h3>
                <div className="grid grid-cols-1 gap-3">
                   {topImprovements.map(imp => (
                     <div key={imp.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 group">
                        <div className="flex-1">
                           <p className="text-slate-800 font-medium">{imp.text}</p>
                           <div className="flex items-center gap-1.5 mt-1">
                              <ThumbsUp size={10} className="text-indigo-400" />
                              <span className="text-[10px] font-bold text-slate-400">{imp.score} votes</span>
                           </div>
                        </div>
                        {isHost && (
                          <button 
                            onClick={() => { setActionText(imp.text); setActionOwners([]); }}
                            className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                          >
                             Convert to Action
                          </button>
                        )}
                     </div>
                   ))}
                   {topImprovements.length === 0 && <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm">No improvements submitted.</div>}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-2">Confirmed Action Items</h3>
                <div className="space-y-3">
                   <AnimatePresence>
                     {room.actionItems.map(item => (
                       <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                         <div className="flex-1">
                           <p className="text-slate-800 font-bold">{item.text}</p>
                           <div className="flex flex-wrap gap-2 mt-2">
                             {item.owners.map(o => (
                               <span key={o} className="flex items-center gap-1.5 text-[10px] bg-indigo-50 text-indigo-600 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-100">
                                 <User size={10} /> {o}
                               </span>
                             ))}
                           </div>
                         </div>
                         <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-tighter">Draft</div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                   {room.actionItems.length === 0 && <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic">No action items defined yet.</div>}
                </div>
              </div>
           </div>

           {isHost && (
             <div className="md:col-span-4 space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-xl shadow-indigo-100/30 space-y-6 sticky top-8">
                  <h3 className="font-black text-indigo-900 text-lg">Define Action</h3>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <textarea value={actionText} onChange={e => setActionText(e.target.value)} placeholder="What needs to be done?" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl h-24 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Owners (Max 2)</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                           {room.participants.map(p => {
                             const isSelected = actionOwners.includes(p.name);
                             return (
                               <button 
                                 key={p.id}
                                 onClick={() => {
                                   if (isSelected) setActionOwners(actionOwners.filter(n => n !== p.name));
                                   else if (actionOwners.length < 2) setActionOwners([...actionOwners, p.name]);
                                 }}
                                 className={cn(
                                   "px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                                   isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                                 )}
                               >
                                  {p.name}
                               </button>
                             );
                           })}
                        </div>
                     </div>
                     <button 
                       onClick={() => { if(actionText && actionOwners.length > 0) { onActionItem?.(actionText, actionOwners); setActionText(''); setActionOwners([]); } }} 
                       className={cn(
                         "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                         (actionText && actionOwners.length > 0) ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100" : "bg-slate-100 text-slate-300 pointer-events-none shadow-none"
                       )}
                     >
                       <Plus size={18} /> Confirm Action Item
                     </button>
                  </div>

                  <div className="pt-6 border-t border-slate-50 space-y-3">
                     <button onClick={onPrev} className="w-full py-3 bg-white text-slate-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border border-slate-100">
                       <ArrowLeft size={14} /> Previous Step
                     </button>
                     <button onClick={onRestart} className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                       <RotateCcw size={14} /> Start New Round
                     </button>
                     <button onClick={onEnd} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-all shadow-sm">
                       <XCircle size={14} /> End Session
                     </button>
                  </div>
               </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Discussion & Grouping</h2>
          <p className="text-slate-500">Drag items on top of each other to group them by theme.</p>
        </div>
        <div className="flex gap-2">
          {['improvements', 'positives', 'all'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === t ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50")}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-8">
           {(Object.entries(groups.grouped) as [string, Suggestion[]][]).map(([groupId, items]) => {
             const groupVotes = Math.max(...items.map(i => i.votes.length));
             const isUpvotedByMe = items.some(i => i.votes.includes(userId));
             return (
               <div key={groupId} className="bg-slate-50/50 p-6 rounded-[2.5rem] border-2 border-dashed border-indigo-100 space-y-4">
                  <div className="flex justify-between items-center px-2">
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Group: {items[0].tag === 'Wins' ? 'Celebration Cluster' : 'Theme ' + groupId.slice(0, 4)}</span>
                     <button onClick={() => onUpvote?.(items[0].id)} className={cn("px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all border", isUpvotedByMe ? "bg-indigo-600 text-white border-indigo-500" : "bg-white text-slate-400 border-slate-200")}>
                       <ThumbsUp size={12} /> Group Vote: {groupVotes}
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map(s => <SuggestionPill key={s.id} suggestion={s} isGrouped userId={userId} onUpvote={onUpvote} isHost={isHost} />)}
                  </div>
               </div>
             );
           })}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SortableContext items={groups.singles.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {groups.singles.map(s => <SuggestionPill key={s.id} suggestion={s} userId={userId} onUpvote={onUpvote} isHost={isHost} />)}
              </SortableContext>
           </div>
        </div>
      </DndContext>

      {isHost && (
        <div className="flex justify-center items-center gap-4 pt-8">
          <button onClick={onPrev} className="bg-white text-slate-500 border border-slate-200 px-8 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
             <ArrowLeft size={20} /> Back
          </button>
          <button onClick={onNext} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
             Final Phase: Action Items <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
