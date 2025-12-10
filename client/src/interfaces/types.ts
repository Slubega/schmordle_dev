import { Timestamp } from 'firebase/firestore';

// --- GAME CORE TYPES ---
export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export interface TileState {
  letter: string;
  state: LetterState;
}

export interface RhymeSet {
  id: string;
  label: string;
  theme: string;
  words: string[]; // List of all valid 5-letter rhyming words for this set
  wordThemes?: Record<string, string | undefined>; // Optional word-specific hints
  solutionWord?: string; // Optional selected target word for a session
}

export interface GuessResult {
  guess: string;
  feedback: TileState[];
  isWin: boolean;
}

// --- FIREBASE / PERSISTENCE TYPES ---

export interface DailyChallengeConfig {
  rhymeSetId: string;
  date: string; // YYYY-MM-DD
  isComplete?: boolean; // For client-side tracking
}

export interface MultiplayerSubmission {
  userId: string;
  userName: string;
  word: string;
  timestamp: Timestamp;
}

export interface MultiplayerRoom {
  roomId: string;
  rhymeSetId: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'completed';
  players: { [key: string]: string }; // userId: userName
  startTime?: Timestamp;
  endTime?: Timestamp;
  submissions?: MultiplayerSubmission[];
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
} 
