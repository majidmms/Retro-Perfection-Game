import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import { nanoid } from "nanoid";

interface Participant {
  id: string;
  name: string;
  hasSubmitted: boolean;
  isReady: boolean;
}

interface Suggestion {
  id: string;
  author: string;
  text: string;
  tag: string;
  type: 'positive' | 'improvement';
  votes: string[];
  groupId: string | null;
}

interface ActionItem {
  id: string;
  text: string;
  owners: string[];
  completed: boolean;
}

interface Room {
  id: string;
  sprintName: string;
  hostId: string;
  phase: 'lobby' | 'rating' | 'rating-review' | 'positives' | 'walkthrough' | 'improvements' | 'discussion' | 'final-actions' | 'summary';
  participants: Participant[];
  ratings: number[];
  suggestions: Suggestion[];
  actionItems: ActionItem[];
  timerEnd: number | null;
  timerRemaining: number | null;
  isTimerPaused: boolean;
  lastActivity: number;
}

const rooms = new Map<string, Room>();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const PORT = 3000;

  // Cleanup rooms older than 24 hours
  setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, id) => {
      if (now - room.lastActivity > 24 * 60 * 60 * 1000) rooms.delete(id);
    });
  }, 60 * 60 * 1000);

  // Timer check loop
  setInterval(() => {
    const now = Date.now();
    rooms.forEach((room) => {
      if (room.timerEnd && !room.isTimerPaused && now >= room.timerEnd) {
        // Just clear the timer, don't move phase - moderator moves phase
        room.timerEnd = null;
        room.timerRemaining = 0;
        io.to(room.id).emit("room-updated", room);
      }
    });
  }, 1000);

  const phaseSequence: (Room['phase'])[] = ['lobby', 'rating', 'rating-review', 'positives', 'walkthrough', 'improvements', 'discussion', 'final-actions', 'summary'];

  const sanitizeRoom = (room: Room): any => {
    const sanitized = JSON.parse(JSON.stringify(room));
    
    if (room.phase === 'rating') {
      sanitized.ratings = []; // Hide ratings during voting
    } else if (room.phase === 'positives') {
      // Hide positive suggestions during voting
      sanitized.suggestions = room.suggestions.filter(s => s.type !== 'positive');
    } else if (room.phase === 'improvements') {
      // Hide improvement suggestions during voting
      sanitized.suggestions = room.suggestions.filter(s => s.type !== 'improvement');
    }
    
    return sanitized;
  };

  const broadcastRoom = (roomId: string, room: Room) => {
    io.to(roomId).emit("room-updated", sanitizeRoom(room));
  };

  io.on("connection", (socket) => {
    socket.on("create-room", ({ name, sprintName }) => {
      const roomId = nanoid(6).toUpperCase();
      const room: Room = {
        id: roomId,
        sprintName: sprintName || "",
        hostId: socket.id,
        phase: 'lobby',
        participants: [{ id: socket.id, name, hasSubmitted: false, isReady: false }],
        ratings: [],
        suggestions: [],
        actionItems: [],
        timerEnd: null,
        timerRemaining: null,
        isTimerPaused: false,
        lastActivity: Date.now(),
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit("room-joined", { room: sanitizeRoom(room), roomId, userId: socket.id });
    });

    socket.on("join-room", ({ roomId, name, userId }) => {
      const room = rooms.get(roomId?.toUpperCase());
      if (!room) return socket.emit("error", { message: "Room not found" });
      
      // Handle reconnecting user
      let participant = room.participants.find(p => p.id === userId);
      
      if (participant) {
        participant.id = socket.id; // Update to latest socket id
      } else {
        // Handle duplicate name
        let finalName = name;
        let count = 1;
        while (room.participants.some(p => p.name === finalName)) {
          count++;
          finalName = `${name} (${count})`;
        }
        participant = { id: socket.id, name: finalName, hasSubmitted: false, isReady: false };
        room.participants.push(participant);
      }
      
      room.lastActivity = Date.now();
      socket.join(room.id);
      broadcastRoom(room.id, room);
      socket.emit("room-joined", { room: sanitizeRoom(room), roomId: room.id, userId: socket.id });
    });

    socket.on("set-phase", ({ roomId, phase }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.phase = phase;
        room.timerEnd = null;
        room.timerRemaining = null;
        room.isTimerPaused = false;
        room.participants.forEach(p => { p.hasSubmitted = false; p.isReady = false; });
        
        if (phase === 'positives') room.timerEnd = Date.now() + 3 * 60 * 1000;
        if (phase === 'improvements') room.timerEnd = Date.now() + 5 * 60 * 1000;
        
        // Shuffle suggestions when entering Reveal or Discussion for true anonymity
        if (phase === 'rating-review' || phase === 'walkthrough' || phase === 'discussion') {
          for (let i = room.suggestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [room.suggestions[i], room.suggestions[j]] = [room.suggestions[j], room.suggestions[i]];
          }
        }
        
        room.lastActivity = Date.now();
        broadcastRoom(roomId, room);
      }
    });

    socket.on("prev-phase", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        const currentIndex = phaseSequence.indexOf(room.phase);
        if (currentIndex > 0) {
          const prevPhase = phaseSequence[currentIndex - 1];
          room.phase = prevPhase;
          room.timerEnd = null;
          room.timerRemaining = null;
          room.isTimerPaused = false;
          // Clear submission status if moving back to a voting phase
          if (['rating', 'positives', 'improvements'].includes(prevPhase)) {
            room.participants.forEach(p => p.hasSubmitted = false);
          }
          broadcastRoom(roomId, room);
        }
      }
    });

    socket.on("toggle-timer", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id && room.timerEnd) {
        const now = Date.now();
        if (room.isTimerPaused) {
          // Resume
          room.timerEnd = now + (room.timerRemaining || 0);
          room.timerRemaining = null;
          room.isTimerPaused = false;
        } else {
          // Pause
          room.timerRemaining = Math.max(0, room.timerEnd - now);
          room.isTimerPaused = true;
        }
        broadcastRoom(roomId, room);
      }
    });

    socket.on("submit-rating", ({ roomId, rating }) => {
      const room = rooms.get(roomId);
      if (room && room.phase === 'rating') {
        const p = room.participants.find(p => p.id === socket.id);
        if (p && !p.hasSubmitted) {
          room.ratings.push(rating);
          p.hasSubmitted = true;
          if (room.participants.every(p => p.hasSubmitted)) room.phase = 'rating-review';
          broadcastRoom(roomId, room);
        }
      }
    });

    socket.on("submit-positives", ({ roomId, list }) => {
      const room = rooms.get(roomId);
      if (room && room.phase === 'positives') {
        const p = room.participants.find(p => p.id === socket.id);
        if (p && !p.hasSubmitted) {
          list.forEach((text: string) => {
            if (text.trim()) room.suggestions.push({
              id: nanoid(), author: p.name, text, tag: "Wins", type: 'positive', votes: [], groupId: null
            });
          });
          p.hasSubmitted = true;
          if (room.participants.every(p => p.hasSubmitted)) {
            room.phase = 'walkthrough';
            room.timerEnd = null;
          }
          broadcastRoom(roomId, room);
        }
      }
    });

    socket.on("submit-improvements", ({ roomId, list }) => {
      const room = rooms.get(roomId);
      if (room && room.phase === 'improvements') {
        const p = room.participants.find(p => p.id === socket.id);
        if (p && !p.hasSubmitted) {
          list.slice(0, 3).forEach((text: string) => {
            if (text.trim()) room.suggestions.push({
              id: nanoid(), author: p.name, text, tag: "General", type: 'improvement', votes: [], groupId: null
            });
          });
          p.hasSubmitted = true;
          if (room.participants.every(p => p.hasSubmitted)) {
            room.phase = 'discussion';
            room.timerEnd = null;
          }
          broadcastRoom(roomId, room);
        }
      }
    });

    socket.on("group-suggestions", ({ roomId, targetId, dragId }) => {
      const room = rooms.get(roomId);
      if (room && room.phase === 'discussion') {
        const target = room.suggestions.find(s => s.id === targetId);
        const dragged = room.suggestions.find(s => s.id === dragId);
        if (target && dragged && targetId !== dragId) {
          const groupId = target.groupId || target.id;
          dragged.groupId = groupId;
          target.groupId = groupId;
          broadcastRoom(roomId, room);
        }
      }
    });

    socket.on("upvote-suggestion", ({ roomId, suggestionId }) => {
      const room = rooms.get(roomId);
      if (room && room.phase === 'discussion') {
        const suggestion = room.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          const groupId = suggestion.groupId;
          const items = groupId ? room.suggestions.filter(s => s.groupId === groupId) : [suggestion];
          
          items.forEach(item => {
            const idx = item.votes.indexOf(socket.id);
            if (idx === -1) item.votes.push(socket.id);
            else item.votes.splice(idx, 1);
          });
          broadcastRoom(roomId, room);
        }
      }
    });

    socket.on("add-action-item", ({ roomId, text, owners }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.actionItems.push({ id: nanoid(), text, owners, completed: false });
        broadcastRoom(roomId, room);
      }
    });

    socket.on("tag-suggestion", ({ roomId, suggestionId, tag }) => {
      const room = rooms.get(roomId);
      if (room && room.phase === 'discussion') {
        const suggestion = room.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          suggestion.tag = tag;
          room.lastActivity = Date.now();
          broadcastRoom(roomId, room);
        }
      }
    });

    socket.on("set-sprint-name", ({ roomId, sprintName }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.sprintName = sprintName;
        room.lastActivity = Date.now();
        broadcastRoom(roomId, room);
      }
    });

    socket.on("kick-participant", ({ roomId, participantId }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.participants = room.participants.filter(p => p.id !== participantId);
        room.lastActivity = Date.now();
        broadcastRoom(roomId, room);
        io.to(participantId).emit("kicked");
      }
    });

    socket.on("end-session", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        rooms.delete(roomId);
        io.to(roomId).emit("session-ended");
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // We don't remove participants immediately to handle refreshes
      // But we could if we wanted. For this app, let's keep them and mark as offline?
      // Actually, for simplicity let's remove them if they aren't the host
      // or just leave them there so they can "rejoin" with the same name if they have the ID.
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
