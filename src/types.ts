export type Phase = 
  | 'lobby' 
  | 'rating' 
  | 'rating-review' 
  | 'positives' 
  | 'walkthrough' 
  | 'improvements' 
  | 'discussion' 
  | 'final-actions'
  | 'summary';

export interface Participant {
  id: string;
  name: string;
  hasSubmitted: boolean;
  isReady: boolean;
}

export interface Suggestion {
  id: string;
  author: string;
  text: string;
  tag: string;
  type: 'positive' | 'improvement';
  votes: string[];
  groupId: string | null;
}

export interface ActionItem {
  id: string;
  text: string;
  owners: string[];
  completed: boolean;
}

export interface RetroHistory {
  id: string;
  sprintName: string;
  date: string;
  avgRating: number;
  actionItems: ActionItem[];
  suggestions: Suggestion[];
  ratings: number[];
}

export interface Room {
  id: string;
  sprintName: string;
  hostId: string;
  phase: Phase;
  participants: Participant[];
  ratings: number[];
  suggestions: Suggestion[];
  actionItems: ActionItem[];
  timerEnd: number | null;
  timerRemaining: number | null;
  isTimerPaused: boolean;
  lastActivity: number;
}

export interface UserState {
  roomId: string | null;
  userId: string | null;
  name: string | null;
  isHost: boolean;
}
