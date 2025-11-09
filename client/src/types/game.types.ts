export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  spotifyUri?: string;
  previewUrl?: string;
  albumCover?: string;
  movie?: string;
}

export interface Player {
  id: string;
  name: string;
  timeline: Song[];
  startYear: number;
  score: number;
  isReady: boolean;
  connected: boolean;
  persistentId?: string;
  profileId?: string;
  artistName?: string;
  avatarColor?: string;
  profileImage?: string;
  currentPlacement?: { song: Song; position: number };
}

export interface GameState {
  id: string;
  masterSocketId: string;
  players: Player[];
  currentSong: Song | null;
  songs: Song[];
  phase: 'setup' | 'lobby' | 'playing' | 'reveal' | 'finished';
  musicPreferences: string;
  searchQuery: string;
  roundNumber: number;
  winner: Player | null;
}

export interface AIResponse {
  searchQuery: string;
  preferences: string;
  response: string;
  voicePrompt: string;
}

export interface RoundResult {
  playerId: string;
  playerName: string;
  correct: boolean;
  placedAt: number;
  correctYear: number;
}
