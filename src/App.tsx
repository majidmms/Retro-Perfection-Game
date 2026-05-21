import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Room, UserState, RetroHistory } from './types';
import CreateJoin from './components/CreateJoin';
import Lobby from './components/Lobby';
import Voting from './components/Voting';
import Reveal from './components/Reveal';
import Discussion from './components/Discussion';
import Summary from './components/Summary';
import { Settings, LogOut, Info, Target } from 'lucide-react';

const socket: Socket = io();

export default function App() {
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('retro_user_identity');
    return saved ? JSON.parse(saved) : { roomId: null, userId: null, name: null, isHost: false };
  });
  const [room, setRoom] = useState<Room | null>(null);
  const [history, setHistory] = useState<RetroHistory[]>(() => {
    const saved = localStorage.getItem('retro_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user.name) {
      localStorage.setItem('retro_user_identity', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      const saved = localStorage.getItem('retro_user_identity');
      if (saved) {
         const { roomId, name, userId } = JSON.parse(saved);
         if (roomId && name) {
           socket.emit('join-room', { roomId, name, userId });
         }
      }
    };
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('room-joined', ({ room: joinedRoom, roomId, userId }) => {
      setRoom(joinedRoom);
      const isHost = joinedRoom.hostId === userId;
      setUser(prev => ({ ...prev, roomId, userId, name: joinedRoom.participants.find((p: any) => p.id === userId)?.name || prev.name, isHost }));
      window.history.pushState({}, '', `?room=${roomId}`);
    });

    socket.on('room-updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      
      // Save to history automatically if session reaches summary phase
      if (updatedRoom.phase === 'summary' && !history.some(h => h.id === updatedRoom.id)) {
        const avg = updatedRoom.ratings.length > 0 
          ? Number((updatedRoom.ratings.reduce((a, b) => a + b, 0) / updatedRoom.ratings.length).toFixed(1))
          : 0;
        
        const newHistoryItem: RetroHistory = {
          id: updatedRoom.id,
          sprintName: updatedRoom.sprintName,
          date: new Date().toISOString(),
          avgRating: avg,
          actionItems: updatedRoom.actionItems,
          suggestions: updatedRoom.suggestions,
          ratings: updatedRoom.ratings
        };
        const newHistory = [newHistoryItem, ...history].slice(0, 50); // Keep last 50
        setHistory(newHistory);
        localStorage.setItem('retro_history', JSON.stringify(newHistory));
      }
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    });

    socket.on('kicked', () => {
      leaveRoom();
      setError('You have been kicked from the room.');
    });

    socket.on('session-ended', () => {
      leaveRoom();
      setError('The session has ended.');
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-joined');
      socket.off('room-updated');
      socket.off('error');
      socket.off('kicked');
      socket.off('session-ended');
    };
  }, []);

  const leaveRoom = () => {
    setRoom(null);
    setUser({ roomId: null, userId: null, name: null, isHost: false });
    localStorage.removeItem('retro_user_identity');
    window.history.pushState({}, '', '/');
  };

  const createRoom = (name: string, sprintName: string) => {
    setUser(prev => ({ ...prev, name }));
    socket.emit('create-room', { name, sprintName });
  };

  const joinRoom = (roomId: string, name: string) => {
    setUser(prev => ({ ...prev, name }));
    socket.emit('join-room', { roomId, name, userId: user.userId });
  };

  const startRound = () => {
    if (room && user.isHost) {
      socket.emit('set-phase', { roomId: room.id, phase: 'rating' });
    }
  };

  const submitRating = (rating: number) => {
    if (room) socket.emit('submit-rating', { roomId: room.id, rating });
  };

  const submitPositives = (list: string[]) => {
    if (room) socket.emit('submit-positives', { roomId: room.id, list });
  };

  const submitImprovements = (list: string[]) => {
    if (room) socket.emit('submit-improvements', { roomId: room.id, list });
  };

  const setPhase = (phase: string) => {
    if (room && user.isHost) socket.emit('set-phase', { roomId: room.id, phase });
  };

  const upvoteSuggestion = (suggestionId: string) => {
    if (room) socket.emit('upvote-suggestion', { roomId: room.id, suggestionId });
  };

  const groupSuggestions = (targetId: string, dragId: string) => {
    if (room) socket.emit('group-suggestions', { roomId: room.id, targetId, dragId });
  };

  const tagSuggestion = (suggestionId: string, tag: string) => {
    if (room) socket.emit('tag-suggestion', { roomId: room.id, suggestionId, tag });
  };

  const addActionItem = (text: string, owners: string[]) => {
    if (room && user.isHost) socket.emit('add-action-item', { roomId: room.id, text, owners });
  };

  const setSprintName = (name: string) => {
    if (room && user.isHost) socket.emit('set-sprint-name', { roomId: room.id, sprintName: name });
  };

  const kickParticipant = (id: string) => {
    if (room && user.isHost) socket.emit('kick-participant', { roomId: room.id, participantId: id });
  };

  const endSession = () => {
    if (room && user.isHost) socket.emit('end-session', { roomId: room.id });
  };

  const toggleTimer = () => {
    if (room && user.isHost) socket.emit('toggle-timer', { roomId: room.id });
  };

  const prevPhase = () => {
    if (room && user.isHost) socket.emit('prev-phase', { roomId: room.id });
  };

  const viewHistory = (retro: RetroHistory) => {
    // Create a "mock" room for the summary view
    const mockRoom: Room = {
      ...retro,
      hostId: '',
      phase: 'summary',
      participants: [], // Participants not saved in history for privacy/size
      timerEnd: null,
      timerRemaining: null,
      isTimerPaused: false,
      lastActivity: Date.now()
    };
    setRoom(mockRoom);
  };

  const renderPhase = () => {
    if (!room) return <CreateJoin onCreate={createRoom} onJoin={joinRoom} onViewHistory={viewHistory} history={history} initialCode={new URLSearchParams(window.location.search).get('room') || ''} />;

    switch (room.phase) {
      case 'lobby':
        return <Lobby room={room} user={user} onStart={startRound} onSetSprintName={setSprintName} onKick={kickParticipant} />;
      case 'rating':
        return <Voting room={room} phase="rating" userId={user.userId!} onSubmit={submitRating} onToggleTimer={toggleTimer} isHost={user.isHost} onForceReveal={() => setPhase('rating-review')} onPrev={prevPhase} />;
      case 'rating-review':
        return <Reveal room={room} isHost={user.isHost} onNext={() => setPhase('positives')} onPrev={prevPhase} />;
      case 'positives':
        return <Voting room={room} phase="positives" userId={user.userId!} onSubmit={submitPositives} onToggleTimer={toggleTimer} isHost={user.isHost} onForceReveal={() => setPhase('walkthrough')} onPrev={prevPhase} />;
      case 'walkthrough':
        return <Reveal room={room} phase="walkthrough" isHost={user.isHost} onNext={() => setPhase('improvements')} onPrev={prevPhase} />;
      case 'improvements':
        return <Voting room={room} phase="improvements" userId={user.userId!} onSubmit={submitImprovements} onToggleTimer={toggleTimer} isHost={user.isHost} onForceReveal={() => setPhase('discussion')} onPrev={prevPhase} />;
      case 'discussion':
        return <Discussion room={room} userId={user.userId!} onUpvote={upvoteSuggestion} onGroup={groupSuggestions} onTag={tagSuggestion} isHost={user.isHost} onNext={() => setPhase('final-actions')} onPrev={prevPhase} />;
      case 'final-actions':
        return <Discussion room={room} phase="final-actions" userId={user.userId!} onActionItem={addActionItem} isHost={user.isHost} onEnd={endSession} onRestart={startRound} onNext={() => setPhase('summary')} onPrev={prevPhase} />;
      case 'summary':
        return <Summary room={room} onRestart={startRound} isHost={room.hostId === '' ? true : user.isHost} onPrev={room.hostId === '' ? () => setRoom(null) : prevPhase} />;
      default:
        return <div>Unknown phase</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 selection:bg-indigo-100 selection:text-indigo-700">
      <AnimatePresence>
        {!isConnected && (
          <motion.div 
            initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 flex items-center justify-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Connection lost. Reconnecting...
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
             <Target size={18} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Retro<span className="text-indigo-600">Flow</span></h1>
        </div>
        
        {room && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sprint</span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">{room.sprintName || 'Reviewing...'}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden md:block" />
            <div className="flex -space-x-2">
               {room.participants.slice(0, 5).map(p => (
                 <div key={p.id} title={p.name} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">
                    {p.name.charAt(0)}
                 </div>
               ))}
               {room.participants.length > 5 && (
                 <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                   +{room.participants.length - 5}
                 </div>
               )}
            </div>
            <button 
              onClick={leaveRoom}
              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
              title="Leave Room"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-100 shadow-sm text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={room ? room.phase : 'auth'}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center w-full"
          >
            <div className="w-full max-w-4xl">
              {renderPhase()}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="px-6 py-3 bg-white border-t border-slate-100 flex justify-between items-center text-[10px] md:text-xs text-slate-400">
        <p>A collaborative retrospective experiment</p>
        <div className="flex items-center gap-3">
          <a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
            <Info size={12} /> How it works
          </a>
        </div>
      </footer>
    </div>
  );
}
