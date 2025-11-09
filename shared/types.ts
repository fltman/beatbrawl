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
  startYearRange?: { min: number; max: number };
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

export interface SocketEvents {
  createGame: () => void;
  gameCreated: (data: { gameId: string; gameState: GameState }) => void;
  
  joinGame: (data: { gameCode: string; playerName: string }) => void;
  playerJoined: (data: { player: Player; gameState: GameState }) => void;
  
  aiChat: (message: string) => void;
  aiResponse: (response: AIResponse) => void;
  
  confirmPreferences: (preferences: string) => void;
  preferencesConfirmed: (data: { songs: Song[]; gameState: GameState }) => void;
  
  startGame: () => void;
  gameStarted: (gameState: GameState) => void;
  
  placeCard: (position: number) => void;
  cardPlaced: (data: { playerId: string; position: number }) => void;
  
  revealResults: () => void;
  resultsRevealed: (data: { results: RoundResult[]; gameState: GameState }) => void;
  
  djCommentary: (audioData: string) => void;
  
  nextRound: () => void;
  roundStarted: (gameState: GameState) => void;
  
  gameStateUpdate: (gameState: GameState) => void;
  error: (message: string) => void;
}
