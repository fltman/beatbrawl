import { io, Socket } from 'socket.io-client';
import type { GameState, Player, Song, RoundResult, AIResponse } from '@/types/game.types';

const SOCKET_URL = window.location.origin;

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('error', (message: string) => {
        console.error('Socket error:', message);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  createGame(callback: (data: { gameId: string; gameState: GameState }) => void) {
    if (!this.socket) return;
    this.socket.emit('createGame');
    this.socket.once('gameCreated', callback);
  }

  joinGame(gameCode: string, playerName: string, callback: (data: { player: Player; gameState: GameState }) => void) {
    if (!this.socket) return;
    this.socket.emit('joinGame', { gameCode, playerName });
    this.socket.once('playerJoined', callback);
  }

  aiChat(message: string, callback: (response: AIResponse) => void) {
    if (!this.socket) return;
    this.socket.emit('aiChat', message);
    this.socket.once('aiResponse', callback);
  }

  confirmPreferences(preferences: string, callback: (data: { songs: Song[]; gameState: GameState }) => void) {
    if (!this.socket) return;
    this.socket.emit('confirmPreferences', preferences);
    this.socket.once('preferencesConfirmed', callback);
  }

  startGame() {
    if (!this.socket) return;
    this.socket.emit('startGame');
  }

  placeCard(position: number) {
    if (!this.socket) return;
    this.socket.emit('placeCard', position);
  }

  revealResults() {
    if (!this.socket) return;
    this.socket.emit('revealResults');
  }

  nextRound() {
    if (!this.socket) return;
    this.socket.emit('nextRound');
  }

  onGameStateUpdate(callback: (gameState: GameState) => void) {
    if (!this.socket) return;
    this.socket.on('gameStateUpdate', callback);
  }

  onGameStarted(callback: (gameState: GameState) => void) {
    if (!this.socket) return;
    this.socket.on('gameStarted', callback);
  }

  onCardPlaced(callback: (data: { playerId: string; position: number }) => void) {
    if (!this.socket) return;
    this.socket.on('cardPlaced', callback);
  }

  onResultsRevealed(callback: (data: { results: RoundResult[]; gameState: GameState }) => void) {
    if (!this.socket) return;
    this.socket.on('resultsRevealed', callback);
  }

  onRoundStarted(callback: (gameState: GameState) => void) {
    if (!this.socket) return;
    this.socket.on('roundStarted', callback);
  }

  onError(callback: (message: string) => void) {
    if (!this.socket) return;
    this.socket.on('error', callback);
  }

  off(event: string) {
    if (!this.socket) return;
    this.socket.off(event);
  }
}

export const socketService = new SocketService();
