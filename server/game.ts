import { Song, Player, GameState, RoundResult } from '../shared/types';

export class Game {
  private state: GameState;

  constructor(masterSocketId: string) {
    this.state = {
      id: this.generateGameId(),
      masterSocketId,
      players: [],
      currentSong: null,
      songs: [],
      phase: 'setup',
      musicPreferences: '',
      searchQuery: '',
      roundNumber: 0,
      winner: null,
      startYearRange: { min: 1950, max: 2020 }
    };
  }

  private generateGameId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  getState(): GameState {
    return { ...this.state };
  }

  getId(): string {
    return this.state.id;
  }

  getMasterSocketId(): string {
    return this.state.masterSocketId;
  }

  addPlayer(socketId: string, name: string): Player {
    const range = this.state.startYearRange || { min: 1950, max: 2020 };
    const startYear = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const player: Player = {
      id: socketId,
      name,
      timeline: [],
      startYear,
      score: 0,
      isReady: false
    };
    this.state.players.push(player);
    return player;
  }

  removePlayer(socketId: string): void {
    this.state.players = this.state.players.filter(p => p.id !== socketId);
  }

  getPlayer(socketId: string): Player | undefined {
    return this.state.players.find(p => p.id === socketId);
  }

  setMusicPreferences(preferences: string, searchQuery: string): void {
    this.state.musicPreferences = preferences;
    this.state.searchQuery = searchQuery;
  }

  setSongs(songs: Song[]): void {
    this.state.songs = songs.sort(() => Math.random() - 0.5);
  }

  setStartYearRange(range: { min: number; max: number }): void {
    this.state.startYearRange = range;
  }

  setPhase(phase: GameState['phase']): void {
    this.state.phase = phase;
  }

  startGame(): boolean {
    if (this.state.players.length === 0 || this.state.songs.length === 0) {
      return false;
    }
    this.state.phase = 'playing';
    this.nextRound();
    return true;
  }

  nextRound(): Song | null {
    if (this.state.roundNumber >= this.state.songs.length) {
      this.state.phase = 'finished';
      this.state.currentSong = null;
      return null;
    }

    this.state.currentSong = this.state.songs[this.state.roundNumber];
    this.state.roundNumber++;
    this.state.phase = 'playing';
    
    this.state.players.forEach(player => {
      player.isReady = false;
      player.currentPlacement = undefined;
    });

    return this.state.currentSong;
  }

  placeSong(playerId: string, position: number): boolean {
    if (this.state.phase !== 'playing') return false;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !this.state.currentSong || player.isReady) return false;

    player.currentPlacement = {
      song: this.state.currentSong,
      position
    };
    player.isReady = true;
    return true;
  }

  allPlayersReady(): boolean {
    return this.state.players.length > 0 && 
           this.state.players.every(p => p.isReady);
  }

  evaluateRound(): RoundResult[] | null {
    if (this.state.phase !== 'playing') {
      return null;
    }

    const results: RoundResult[] = [];

    this.state.players.forEach(player => {
      if (!player.currentPlacement || !this.state.currentSong) return;

      const { song, position } = player.currentPlacement;
      const timeline = player.timeline;

      let correct = false;

      if (timeline.length === 0) {
        // First card: position 0 = before startYear, position 1 = after startYear
        if (position === 0) {
          correct = song.year <= player.startYear;
        } else if (position === 1) {
          correct = song.year >= player.startYear;
        }
      } else if (position === 0) {
        correct = song.year <= timeline[0].year;
      } else if (position === timeline.length) {
        correct = song.year >= timeline[timeline.length - 1].year;
      } else {
        const before = timeline[position - 1];
        const after = timeline[position];
        correct = song.year >= before.year && song.year <= after.year;
      }

      if (correct) {
        player.timeline.splice(position, 0, song);
        player.score++;
      }

      results.push({
        playerId: player.id,
        playerName: player.name,
        correct,
        placedAt: position,
        correctYear: song.year
      });

      player.currentPlacement = undefined;
    });

    return results;
  }

  checkWinner(): Player | null {
    const winner = this.state.players.find(p => p.score >= 10);
    
    if (winner) {
      this.state.winner = winner;
      this.state.phase = 'finished';
    }

    return winner || null;
  }

  getPlayers(): Player[] {
    return [...this.state.players];
  }
}
