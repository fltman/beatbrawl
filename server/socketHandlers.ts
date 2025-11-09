import { Server as SocketIOServer, Socket } from 'socket.io';
import { gameManager } from './gameManager';
import { storage } from './storage';
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

    socket.on('joinGame', async ({ gameCode, playerName, persistentId, profileId }: { gameCode: string; playerName: string; persistentId?: string; profileId?: string }) => {
      try {
        const game = gameManager.getGame(gameCode);
        if (!game) {
          socket.emit('error', 'Spelet hittades inte');
          return;
        }

        if (game.getState().phase !== 'lobby') {
          socket.emit('error', 'Spelet har redan startat');
          return;
        }

        // Fetch profile data if profileId is provided
        let profileData: { artistName?: string; avatarColor?: string; profileImage?: string } | undefined;
        if (profileId) {
          try {
            const profile = await storage.getPlayerProfile(profileId);
            if (profile) {
              profileData = {
                artistName: profile.artistName || undefined,
                avatarColor: profile.avatarColor,
                profileImage: profile.profileImage || undefined
              };
            }
          } catch (error) {
            console.error(`Failed to fetch profile ${profileId}:`, error);
            // Continue without profile data
          }
        }

        const player = game.addPlayer(socket.id, playerName, persistentId, profileId, profileData);
        gameManager.addPlayerToGame(gameCode, socket.id);
        socket.join(gameCode);

        socket.emit('playerJoined', {
          player,
          gameState: game.getState()
        });

        io.to(gameCode).emit('gameStateUpdate', game.getState());

        console.log(`Player ${playerName} joined game ${gameCode} with persistentId ${player.persistentId} and profileId ${profileId}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', 'Kunde inte gå med i spelet');
      }
    });

    socket.on('reconnectPlayer', ({ gameCode, persistentId }: { gameCode: string; persistentId: string }) => {
      try {
        const game = gameManager.getGame(gameCode);
        if (!game) {
          socket.emit('error', 'Spelet hittades inte');
          return;
        }

        const player = game.reconnectPlayer(persistentId, socket.id);
        if (!player) {
          socket.emit('error', 'Kunde inte återansluta - spelaren hittades inte');
          return;
        }

        // Update game manager mapping
        gameManager.addPlayerToGame(gameCode, socket.id);
        socket.join(gameCode);

        socket.emit('playerReconnected', {
          player,
          gameState: game.getState()
        });

        io.to(gameCode).emit('gameStateUpdate', game.getState());

        console.log(`Player ${player.name} (${persistentId}) reconnected to game ${gameCode}`);
      } catch (error) {
        console.error('Error reconnecting player:', error);
        socket.emit('error', 'Kunde inte återansluta till spelet');
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

        // Check if preferences is a JSON object with pre-generated songs
        let suggestions: any[] = [];
        let startYearRange: { min: number; max: number } | null = null;
        let searchQuery = '';
        let userPreference = '';

        try {
          const parsed = JSON.parse(preferences);
          if (parsed.songs && Array.isArray(parsed.songs)) {
            // Pre-generated songs from AI chat
            suggestions = parsed.songs;
            startYearRange = parsed.startYearRange || { min: 1950, max: 2020 };
            userPreference = parsed.preference || 'musikval från AI-chatten';
            searchQuery = 'AI-generated playlist';
            console.log(`Using ${suggestions.length} pre-generated songs from AI chat with preference: ${userPreference}`);
          }
        } catch {
          // Not JSON, treat as regular search query
          searchQuery = preferences?.trim() || game.getState().searchQuery?.trim() || '';
          userPreference = searchQuery;
        }

        if (!searchQuery && suggestions.length === 0) {
          socket.emit('error', 'Please provide music preferences');
          return;
        }

        game.setMusicPreferences(userPreference, searchQuery);

        // If no pre-generated songs, use AI service to generate them
        if (suggestions.length === 0) {
          console.log(`Confirming preferences with query: "${searchQuery}"`);
          const { aiService } = await import('./ai');
          const result = await aiService.generateSongSuggestions(searchQuery);
          suggestions = result.songs;
          startYearRange = result.startYearRange;
          
          if (suggestions.length === 0) {
            socket.emit('error', 'Could not generate song suggestions. Please try again.');
            return;
          }
        }

        // Search Spotify for the songs
        const { spotifyService } = await import('./spotify');
        const songs = await spotifyService.searchFromSuggestions(suggestions, 15);

        if (songs.length < 10) {
          socket.emit('error', `Only found ${songs.length} songs. Try different preferences like "80s rock" or "Swedish pop".`);
          return;
        }

        game.setSongs(songs);
        game.setStartYearRange(startYearRange || { min: 1950, max: 2020 });
        game.setPhase('lobby');

        socket.emit('preferencesConfirmed', {
          songs,
          gameState: game.getState()
        });

        console.log(`Preferences confirmed for game ${game.getId()} with ${songs.length} songs`);
      } catch (error) {
        console.error('Error confirming preferences:', error);
        socket.emit('error', 'Failed to find songs. Please try again.');
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

    socket.on('placeCard', async (position: number) => {
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
          console.log('All players ready, automatically revealing results...');
          
          const results = game.evaluateRound();
          if (results) {
            game.setPhase('reveal');

            io.to(game.getId()).emit('resultsRevealed', {
              results,
              gameState: game.getState()
            });

            // Check winner BEFORE generating DJ commentary
            const winner = game.checkWinner();
            const isGameFinished = !!winner;

            const currentSong = game.getState().currentSong;
            const musicContext = game.getState().musicPreferences;
            if (currentSong) {
              const { elevenLabsService } = await import('./elevenlabs');
              const audioBuffer = await elevenLabsService.generateDJCommentary(
                currentSong, 
                isGameFinished, 
                winner?.name,
                game.getId(),
                musicContext
              );
              
              if (audioBuffer) {
                const base64Audio = audioBuffer.toString('base64');
                io.to(game.getId()).emit('djCommentary', base64Audio);
                console.log(`DJ commentary generated for game ${game.getId()}`);
              }
            }

            if (winner) {
              io.to(game.getId()).emit('gameStateUpdate', game.getState());
              console.log(`Game ${game.getId()} finished - ${winner.name} won!`);
            }

            console.log(`Results auto-revealed for game ${game.getId()}`);
          }
        }
      } catch (error) {
        console.error('Error placing card:', error);
        socket.emit('error', 'Failed to place card');
      }
    });

    socket.on('revealResults', async () => {
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

        // Check winner BEFORE generating DJ commentary
        const winner = game.checkWinner();
        const isGameFinished = !!winner;

        const currentSong = game.getState().currentSong;
        const musicContext = game.getState().musicPreferences;
        if (currentSong) {
          const { elevenLabsService } = await import('./elevenlabs');
          const audioBuffer = await elevenLabsService.generateDJCommentary(
            currentSong, 
            isGameFinished, 
            winner?.name,
            game.getId(),
            musicContext
          );
          
          if (audioBuffer) {
            const base64Audio = audioBuffer.toString('base64');
            io.to(game.getId()).emit('djCommentary', base64Audio);
            console.log(`DJ commentary generated for game ${game.getId()}`);
          }
        }

        if (winner) {
          io.to(game.getId()).emit('gameStateUpdate', game.getState());
          console.log(`Game ${game.getId()} finished - ${winner.name} won!`);
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

        const currentPhase = game.getState().phase;
        if (currentPhase === 'finished') {
          console.log(`Game ${game.getId()} is finished - not starting next round`);
          return;
        }

        if (currentPhase !== 'reveal') {
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
        const game = gameManager.getGameBySocket(socket.id);
        if (game) {
          const player = game.markPlayerDisconnected(socket.id);

          if (player) {
            // Player disconnected - notify others but keep player in game
            io.to(game.getId()).emit('playerDisconnected', {
              playerId: socket.id,
              playerName: player.name
            });
            io.to(game.getId()).emit('gameStateUpdate', game.getState());
            console.log(`Player ${player.name} disconnected from game ${game.getId()}, can reconnect`);
          } else if (game.getMasterSocketId() === socket.id) {
            // Master disconnected - end game
            io.to(game.getId()).emit('error', 'Spelledaren har kopplat från');
            gameManager.removePlayer(socket.id);
            console.log(`Game master ${socket.id} disconnected, game ${game.getId()} ended`);
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }

      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
