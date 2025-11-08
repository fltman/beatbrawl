import { Game } from './game';

class GameManager {
  private games: Map<string, Game> = new Map();
  private socketToGame: Map<string, string> = new Map();

  createGame(masterSocketId: string): Game {
    const game = new Game(masterSocketId);
    this.games.set(game.getId(), game);
    this.socketToGame.set(masterSocketId, game.getId());
    return game;
  }

  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  getGameBySocket(socketId: string): Game | undefined {
    const gameId = this.socketToGame.get(socketId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  addPlayerToGame(gameId: string, socketId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    
    this.socketToGame.set(socketId, gameId);
    return true;
  }

  removePlayer(socketId: string): { game: Game; wasPlayer: boolean } | null {
    const gameId = this.socketToGame.get(socketId);
    if (!gameId) return null;

    const game = this.games.get(gameId);
    if (!game) return null;

    this.socketToGame.delete(socketId);

    if (game.getMasterSocketId() === socketId) {
      this.games.delete(gameId);
      return { game, wasPlayer: false };
    }

    game.removePlayer(socketId);
    return { game, wasPlayer: true };
  }

  deleteGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      this.socketToGame.delete(game.getMasterSocketId());
      game.getPlayers().forEach(p => this.socketToGame.delete(p.id));
      this.games.delete(gameId);
    }
  }
}

export const gameManager = new GameManager();
