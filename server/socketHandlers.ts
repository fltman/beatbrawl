import { Server as SocketIOServer, Socket } from 'socket.io';
import { gameManager } from './gameManager';
import type { SocketEvents } from '../shared/types';

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('createGame', () => {
      try {
        const game = gameManager.createGame(socket.id);
        socket.join(game.getId());
        
        socket.emit('gameCreated', {
          gameId: game.getId(),
          gameState: game.getState()
        });

        console.log(`Game created: ${game.getId()} by ${socket.id}`);
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', 'Failed to create game');
      }
    });

    socket.on('joinGame', ({ gameCode, playerName }: { gameCode: string; playerName: string }) => {
      try {
        const game = gameManager.getGame(gameCode);
        if (!game) {
          socket.emit('error', 'Game not found');
          return;
        }

        if (game.getState().phase !== 'lobby') {
          socket.emit('error', 'Game has already started');
          return;
        }

        const player = game.addPlayer(socket.id, playerName);
        gameManager.addPlayerToGame(gameCode, socket.id);
        socket.join(gameCode);

        socket.emit('playerJoined', {
          player,
          gameState: game.getState()
        });

        io.to(gameCode).emit('gameStateUpdate', game.getState());

        console.log(`Player ${playerName} joined game ${gameCode}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', 'Failed to join game');
      }
    });

    socket.on('aiChat', async (message: string) => {
      try {
        const game = gameManager.getGameBySocket(socket.id);
        if (!game || game.getMasterSocketId() !== socket.id) {
          socket.emit('error', 'Not authorized');
          return;
        }

        console.log(`AI Chat message: ${message}`);
        
        socket.emit('aiResponse', {
          searchQuery: message,
          preferences: message,
          response: `Perfekt! Jag har förberett ${message} för er. Klicka på "Bekräfta" för att börja!`,
          voicePrompt: `Okej! Jag har valt ${message} åt er. Det blir bra!`
        });
      } catch (error) {
        console.error('Error in AI chat:', error);
        socket.emit('error', 'AI chat failed');
      }
    });

    socket.on('confirmPreferences', async (preferences: string) => {
      try {
        const game = gameManager.getGameBySocket(socket.id);
        if (!game || game.getMasterSocketId() !== socket.id) {
          socket.emit('error', 'Not authorized');
          return;
        }

        game.setMusicPreferences(preferences, preferences);
        
        const { spotifyService } = await import('./spotify');
        let songs = await spotifyService.searchSongs(preferences, 15);
        
        if (songs.length < 10) {
          console.log(`Not enough songs from search, trying recommendations...`);
          songs = await spotifyService.getRecommendations(preferences, 15);
        }

        if (songs.length === 0) {
          socket.emit('error', 'Could not find songs matching your preferences. Try different keywords.');
          return;
        }

        game.setSongs(songs);
        game.setPhase('lobby');

        socket.emit('preferencesConfirmed', {
          songs,
          gameState: game.getState()
        });

        console.log(`Preferences confirmed for game ${game.getId()} with ${songs.length} songs`);
      } catch (error) {
        console.error('Error confirming preferences:', error);
        socket.emit('error', 'Failed to confirm preferences');
      }
    });

    socket.on('startGame', () => {
      try {
        const game = gameManager.getGameBySocket(socket.id);
        if (!game || game.getMasterSocketId() !== socket.id) {
          socket.emit('error', 'Not authorized');
          return;
        }

        if (!game.startGame()) {
          socket.emit('error', 'Cannot start game - no players or songs');
          return;
        }

        io.to(game.getId()).emit('gameStarted', game.getState());
        console.log(`Game ${game.getId()} started`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', 'Failed to start game');
      }
    });

    socket.on('placeCard', (position: number) => {
      try {
        const game = gameManager.getGameBySocket(socket.id);
        if (!game) {
          socket.emit('error', 'Game not found');
          return;
        }

        if (!game.placeSong(socket.id, position)) {
          socket.emit('error', 'Failed to place card');
          return;
        }

        io.to(game.getId()).emit('cardPlaced', {
          playerId: socket.id,
          position
        });

        io.to(game.getId()).emit('gameStateUpdate', game.getState());

        console.log(`Player ${socket.id} placed card at position ${position}`);

        if (game.allPlayersReady()) {
          io.to(game.getId()).emit('gameStateUpdate', game.getState());
        }
      } catch (error) {
        console.error('Error placing card:', error);
        socket.emit('error', 'Failed to place card');
      }
    });

    socket.on('revealResults', () => {
      try {
        const game = gameManager.getGameBySocket(socket.id);
        if (!game || game.getMasterSocketId() !== socket.id) {
          socket.emit('error', 'Not authorized');
          return;
        }

        if (game.getState().phase !== 'playing') {
          socket.emit('error', 'Cannot reveal results - not in playing phase');
          return;
        }

        const results = game.evaluateRound();
        if (!results) {
          socket.emit('error', 'Cannot evaluate round');
          return;
        }

        game.setPhase('reveal');

        io.to(game.getId()).emit('resultsRevealed', {
          results,
          gameState: game.getState()
        });

        const winner = game.checkWinner();
        if (winner) {
          io.to(game.getId()).emit('gameStateUpdate', game.getState());
        }

        console.log(`Results revealed for game ${game.getId()}`);
      } catch (error) {
        console.error('Error revealing results:', error);
        socket.emit('error', 'Failed to reveal results');
      }
    });

    socket.on('nextRound', () => {
      try {
        const game = gameManager.getGameBySocket(socket.id);
        if (!game || game.getMasterSocketId() !== socket.id) {
          socket.emit('error', 'Not authorized');
          return;
        }

        if (game.getState().phase !== 'reveal') {
          socket.emit('error', 'Cannot start next round - not in reveal phase');
          return;
        }

        const nextSong = game.nextRound();

        if (!nextSong) {
          io.to(game.getId()).emit('gameStateUpdate', game.getState());
          console.log(`Game ${game.getId()} finished - no more songs`);
          return;
        }

        io.to(game.getId()).emit('roundStarted', game.getState());
        console.log(`Next round started for game ${game.getId()}`);
      } catch (error) {
        console.error('Error starting next round:', error);
        socket.emit('error', 'Failed to start next round');
      }
    });

    socket.on('disconnect', () => {
      try {
        const result = gameManager.removePlayer(socket.id);
        if (result) {
          if (result.wasPlayer) {
            io.to(result.game.getId()).emit('gameStateUpdate', result.game.getState());
            console.log(`Player ${socket.id} left game ${result.game.getId()}`);
          } else {
            io.to(result.game.getId()).emit('error', 'Game master disconnected');
            console.log(`Game master ${socket.id} disconnected, game ${result.game.getId()} ended`);
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
      
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
