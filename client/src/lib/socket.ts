import { io, Socket } from 'socket.io-client';
import type { GameState, Player, Song, RoundResult, AIResponse } from '@/types/game.types';

const SOCKET_URL = window.location.origin;

class SocketService {
  private socket: Socket | null = null;
  // Master credentials for reclaiming the game after a silent socket reconnect
  private masterGameId: string | null = null;
  private masterToken: string | null = null;
  // Player seat to reclaim after a silent socket reconnect
  private playerSession: { gameCode: string; persistentId: string } | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        // Socket.io reconnects give us a new socket id - reclaim our role
        if (this.masterGameId && this.masterToken) {
          console.log('Reclaiming master role for game', this.masterGameId);
          this.socket!.emit('reconnectMaster', {
            gameId: this.masterGameId,
            masterToken: this.masterToken
          });
        } else if (this.playerSession) {
          console.log('Reclaiming player seat in game', this.playerSession.gameCode);
          this.socket!.emit('reconnectPlayer', this.playerSession);
        }
      });

      this.socket.on('masterReconnectFailed', () => {
        // Game is gone (e.g. server restart) - reload to start fresh
        if (this.masterGameId) {
          console.warn('Master reconnect failed - reloading');
          window.location.reload();
        }
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
    this.masterGameId = null;
    this.masterToken = null;
    this.playerSession = null;
  }

  getSocket() {
    return this.socket;
  }

  createGame(callback: (data: { gameId: string; gameState: GameState }) => void) {
    if (!this.socket) return;
    this.socket.emit('createGame');
    this.socket.once('gameCreated', (data: { gameId: string; gameState: GameState; masterToken?: string }) => {
      this.masterGameId = data.gameId;
      this.masterToken = data.masterToken ?? null;
      callback(data);
    });
  }

  joinGame(gameCode: string, playerName: string, profileId?: string, callback?: (data: { player: Player; gameState: GameState }) => void) {
    if (!this.socket) return;

    // Get or create persistent ID
    let persistentId = localStorage.getItem('hitster_player_id');
    if (!persistentId) {
      persistentId = this.generatePersistentId();
      localStorage.setItem('hitster_player_id', persistentId);
    }

    this.socket.emit('joinGame', { gameCode, playerName, persistentId, profileId });
    this.socket.once('playerJoined', (data) => {
      // Save session info for reconnection
      const finalPersistentId = data.player.persistentId || persistentId;
      this.savePlayerSession(gameCode, playerName, finalPersistentId, profileId);
      this.playerSession = { gameCode, persistentId: finalPersistentId };
      if (callback) callback(data);
    });
  }

  reconnectPlayer(gameCode: string, persistentId: string, profileId?: string, callback?: (data: { player: Player; gameState: GameState }) => void) {
    if (!this.socket) return;
    this.socket.emit('reconnectPlayer', { gameCode, persistentId, profileId });
    this.playerSession = { gameCode, persistentId };
    if (callback) {
      this.socket.once('playerReconnected', callback);
    }
  }

  private generatePersistentId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  savePlayerSession(gameCode: string, playerName: string, persistentId: string, profileId?: string) {
    const session = {
      gameCode,
      playerName,
      persistentId,
      profileId,
      timestamp: Date.now()
    };
    localStorage.setItem('hitster_session', JSON.stringify(session));
  }

  getPlayerSession(): { gameCode: string; playerName: string; persistentId: string; profileId?: string; timestamp: number } | null {
    const session = localStorage.getItem('hitster_session');
    if (!session) return null;

    try {
      const parsed = JSON.parse(session);
      // Session expires after 2 hours
      if (Date.now() - parsed.timestamp > 2 * 60 * 60 * 1000) {
        this.clearPlayerSession();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  clearPlayerSession() {
    localStorage.removeItem('hitster_session');
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

  onDJCommentary(callback: (audioData: string) => void) {
    if (!this.socket) return;
    this.socket.on('djCommentary', callback);
  }

  onError(callback: (message: string) => void) {
    if (!this.socket) return;
    this.socket.on('error', callback);
  }

  onPlayerDisconnected(callback: (data: { playerId: string; playerName: string }) => void) {
    if (!this.socket) return;
    this.socket.on('playerDisconnected', callback);
  }

  off(event: string) {
    if (!this.socket) return;
    this.socket.off(event);
  }
}

export const socketService = new SocketService();
