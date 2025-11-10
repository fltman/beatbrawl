import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Timeline from '@/components/Timeline';
import CardPlacement from '@/components/CardPlacement';
import ScoreDisplay from '@/components/ScoreDisplay';
import WinnerScreen from '@/components/WinnerScreen';
import MusicEqualizer from '@/components/MusicEqualizer';
import ProfileSetup from '@/components/ProfileSetup';
import { socketService } from '@/lib/socket';
import type { GameState, Player, Song } from '@/types/game.types';

interface PlayerProfile {
  id: string;
  displayName: string;
  avatarColor: string;
  artistName?: string;
  musicStyle?: string;
  profileImage?: string;
  originalPhoto?: string;
  createdAt: string;
  lastUsedAt: string;
}

export default function PlayerPage() {
  const params = useParams<{ gameCode?: string }>();
  const [phase, setPhase] = useState<'profile' | 'join' | 'reconnect' | 'lobby' | 'playing'>('profile');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState(params.gameCode || '');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [confirmedPlacement, setConfirmedPlacement] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [savedSession, setSavedSession] = useState<{ gameCode: string; playerName: string; persistentId: string; profileId?: string } | null>(null);
  const { toast } = useToast();

  const handleProfileReady = (loadedProfile: PlayerProfile | null) => {
    if (loadedProfile) {
      setProfile(loadedProfile);
      setPlayerName(loadedProfile.displayName);
    }
    // If no profile (guest mode), playerName will be entered manually

    // Check for existing session after profile is loaded
    const session = socketService.getPlayerSession();
    if (session && (!params.gameCode || params.gameCode.toUpperCase() === session.gameCode)) {
      setSavedSession(session);
      setGameCode(session.gameCode);
      setPhase('reconnect');
      return;
    }

    // If QR code was scanned (gameCode in URL) and we have a profile with name, join directly
    if (params.gameCode && loadedProfile?.displayName) {
      const socket = socketService.connect();
      setupSocketListeners(socket);

      setGameCode(params.gameCode.toUpperCase());
      socketService.joinGame(
        params.gameCode.toUpperCase(),
        loadedProfile.displayName,
        loadedProfile.id,
        (data) => {
          setMyPlayer(data.player);
          setGameState(data.gameState);
          setPhase('lobby');
        }
      );
    } else if (params.gameCode) {
      // QR code scanned but no profile yet - will join after profile creation
      setGameCode(params.gameCode.toUpperCase());
      setPhase('join');
    } else {
      setPhase('join');
    }
  };

  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  const setupSocketListeners = (socket: any) => {
    socketService.onGameStateUpdate((newState) => {
      setGameState(newState);
      const player = newState.players.find(p => p.id === socket?.id);
      if (player) {
        setMyPlayer(player);
      }

      if (newState.phase === 'playing' && phase !== 'playing') {
        setPhase('playing');
      }
    });

    socketService.onGameStarted((newState) => {
      setGameState(newState);
      setPhase('playing');
    });

    socketService.onRoundStarted((newState) => {
      setGameState(newState);
      const player = newState.players.find(p => p.id === socket?.id);
      if (player) {
        setMyPlayer(player);
      }
      setSelectedPosition(null);
      setConfirmedPlacement(false);
    });

    socketService.onResultsRevealed((data) => {
      setGameState(data.gameState);
      const player = data.gameState.players.find(p => p.id === socket?.id);
      if (player) {
        setMyPlayer(player);
      }
    });

    socketService.onPlayerDisconnected((data) => {
      toast({
        title: 'Player Disconnected',
        description: `${data.playerName} lost connection`,
        duration: 3000
      });
    });

    socketService.onError((message) => {
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    });
  };

  const handleReconnect = () => {
    if (!savedSession) return;

    const socket = socketService.connect();
    setupSocketListeners(socket);

    socketService.reconnectPlayer(
      savedSession.gameCode,
      savedSession.persistentId,
      savedSession.profileId,
      (data) => {
        setMyPlayer(data.player);
        setGameState(data.gameState);

        if (data.gameState.phase === 'lobby') {
          setPhase('lobby');
        } else if (data.gameState.phase === 'playing') {
          setPhase('playing');
        }

        toast({
          title: 'Reconnected! ✓',
          description: 'You are back in the game',
          duration: 3000
        });
      }
    );
  };

  const handleStartNew = () => {
    socketService.clearPlayerSession();
    setSavedSession(null);
    setPhase('join');
    // Keep name but clear game code so user can enter new one
    setGameCode('');
  };

  const handleJoin = () => {
    if (!playerName || !gameCode) return;

    // If user manually enters different game code, clear old session
    const session = socketService.getPlayerSession();
    if (session && gameCode.toUpperCase() !== session.gameCode) {
      socketService.clearPlayerSession();
    }

    const socket = socketService.connect();
    setupSocketListeners(socket);

    socketService.joinGame(
      gameCode.toUpperCase(),
      playerName,
      profile?.id,
      (data) => {
        setMyPlayer(data.player);
        setGameState(data.gameState);
        setPhase('lobby');
      }
    );
  };

  const handleConfirmPlacement = () => {
    if (selectedPosition === null) return;
    socketService.placeCard(selectedPosition);
    setConfirmedPlacement(true);
    toast({
      title: 'Placement Confirmed! ✓',
      description: `You chose position ${selectedPosition + 1}`,
      duration: 3000
    });
  };

  if (phase === 'profile') {
    return <ProfileSetup onProfileReady={handleProfileReady} />;
  }

  if (phase === 'reconnect') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* BeatBrawl Logo - Upper Left */}
        <div className="absolute top-8 left-8 z-20">
          <img
            src="/beatbrawl.png"
            alt="BeatBrawl Logo"
            className="h-24 w-auto"
          />
        </div>

        <Card className="w-full max-w-md p-10 bg-black border-4 border-white shadow-2xl relative z-30">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔄</div>
            <h1 className="text-4xl font-black mb-3 text-white" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              WELCOME BACK!
            </h1>
            <p className="text-white/70 text-lg">We found your last game</p>
          </div>
          <div className="space-y-4">
            <div className="bg-white/10 rounded-2xl p-6 border-2 border-white/20">
              <p className="text-sm text-white/60 mb-1 font-bold">Player</p>
              <p className="text-xl font-bold text-white mb-3">{savedSession?.playerName}</p>
              <p className="text-sm text-white/60 mb-1 font-bold">Game Code</p>
              <p className="text-2xl font-mono font-black text-white">{savedSession?.gameCode}</p>
            </div>
            <Button
              size="lg"
              className="w-full text-xl py-6 bg-red-500 hover:bg-red-600 text-white font-black border-4 border-white"
              onClick={handleReconnect}
              data-testid="button-reconnect"
            >
              Reconnect to Game
            </Button>
            <Button
              size="lg"
              className="w-full text-lg py-4 bg-white/20 hover:bg-white/30 text-white font-bold border-2 border-white"
              onClick={handleStartNew}
              data-testid="button-start-new"
            >
              Start New Game
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'join') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* BeatBrawl Logo - Upper Left */}
        <div className="absolute top-8 left-8 z-20">
          <img
            src="/beatbrawl.png"
            alt="BeatBrawl Logo"
            className="h-24 w-auto"
          />
        </div>

        <Card className="w-full max-w-md p-10 bg-black border-4 border-white shadow-2xl relative z-30">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-3 text-white" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              JOIN GAME
            </h1>
            {!profile && (
              <p className="text-white/70 text-lg">Guest Mode</p>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-lg mb-2 block text-white font-bold">Your Name</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="text-lg bg-white text-black border-2 border-white h-12"
                data-testid="input-player-name"
                disabled={!!profile}
              />
              {profile && (
                <p className="text-sm text-white/60 mt-1">
                  From your saved profile
                </p>
              )}
            </div>
            <div>
              <label className="text-lg mb-2 block text-white font-bold">Game Code</label>
              <Input
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                className="text-lg font-mono bg-white text-black border-2 border-white h-12"
                data-testid="input-game-code"
              />
            </div>
            <Button
              size="lg"
              className="w-full text-xl py-6 bg-red-500 hover:bg-red-600 text-white font-black border-4 border-white"
              onClick={handleJoin}
              disabled={!playerName || !gameCode}
              data-testid="button-join"
            >
              Join
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'lobby' || !myPlayer) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* BeatBrawl Logo - Upper Left */}
        <div className="absolute top-8 left-8 z-20">
          <img
            src="/beatbrawl.png"
            alt="BeatBrawl Logo"
            className="h-24 w-auto"
          />
        </div>

        <Card className="w-full max-w-md p-10 bg-black border-4 border-white shadow-2xl relative z-30 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-4xl font-black mb-4 text-white" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              WELCOME, {playerName.toUpperCase()}!
            </h1>
            <p className="text-xl text-white/70">Waiting for game to start...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState?.phase === 'finished' && gameState.winner) {
    return (
      <WinnerScreen
        winner={gameState.winner}
        allPlayers={gameState.players}
        onNewGame={() => window.location.reload()}
      />
    );
  }

  const hiddenSong: Song = {
    id: gameState?.currentSong?.id || '?',
    title: '?',
    artist: '?',
    year: 0
  };

  const isPlayingMusic = gameState?.phase === 'playing';

  return (
    <div
      className="min-h-screen pb-80 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* BeatBrawl Logo - Upper Left */}
      <div className="absolute top-4 left-4 z-20">
        <img
          src="/beatbrawl.png"
          alt="BeatBrawl Logo"
          className="h-16 w-auto"
        />
      </div>

      <div className="pt-24 px-6 pb-6 relative z-10">
        <ScoreDisplay
          score={myPlayer.score}
          profileImage={myPlayer.profileImage}
          artistName={myPlayer.artistName}
          avatarColor={myPlayer.avatarColor}
        />
      </div>

      <div className="relative z-10">
        <Timeline
          timeline={myPlayer.timeline}
          startYear={myPlayer.startYear}
          highlightPosition={selectedPosition ?? undefined}
          confirmedPosition={confirmedPlacement ? selectedPosition ?? undefined : undefined}
          onPlaceCard={confirmedPlacement ? undefined : setSelectedPosition}
          onConfirmPlacement={confirmedPlacement ? undefined : handleConfirmPlacement}
        />
      </div>
    </div>
  );
}
