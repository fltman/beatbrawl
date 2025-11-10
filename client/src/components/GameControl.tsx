import { useEffect } from 'react';
import { Play, SkipForward, Trophy, Disc3, AlertCircle, Radio, WifiOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import MusicEqualizer from './MusicEqualizer';
import type { Player, Song, RoundResult } from '@/types/game.types';

interface GameControlProps {
  currentSong: Song | null;
  roundNumber: number;
  players: Player[];
  onNextRound?: () => void;
  phase: 'playing' | 'reveal' | 'finished';
  spotifyConnected?: boolean;
  isDJPlaying?: boolean;
  results?: RoundResult[];
}

export default function GameControl({ currentSong, roundNumber, players, onNextRound, phase, isDJPlaying = false, results = [] }: GameControlProps) {
  const spotify = useSpotifyPlayer();

  useEffect(() => {
    if (isDJPlaying && spotify.isPlaying) {
      spotify.pausePlayback();
      return;
    }

    if (phase !== 'playing' || !currentSong) {
      if (spotify.isPlaying) {
        spotify.pausePlayback();
      }
      return;
    }

    if (spotify.isConnected && spotify.isReady && currentSong.id && !spotify.isPlaying && !isDJPlaying) {
      const trackUri = `spotify:track:${currentSong.id}`;
      spotify.playTrack(trackUri);
    }
  }, [currentSong, phase, spotify.isConnected, spotify.isReady, isDJPlaying]);

  const togglePlayback = () => {
    if (!spotify.isConnected || !spotify.isReady) return;

    if (spotify.isPlaying) {
      spotify.pausePlayback();
    } else if (currentSong) {
      spotify.playTrack(`spotify:track:${currentSong.id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      {/* LEFT COLUMN: Players */}
      <Card className="p-8 h-fit bg-black border-4 border-white shadow-2xl">
        <div className="space-y-4">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                  idx === 0 ? 'border-red-500 bg-red-500/10' : 'border-white/20 bg-white/5'
                } ${!player.connected ? 'opacity-60' : ''} hover:bg-white/10 transition-colors`}
                data-testid={`player-score-${idx}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {player.profileImage ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={player.profileImage}
                        alt={player.name}
                        className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg"
                        style={{ backgroundColor: player.avatarColor || '#8B5CF6' }}
                      />
                      {idx === 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white">
                          1
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-xl border-3 border-white shadow-lg ${
                        idx === 0 ? 'ring-2 ring-red-500' : ''
                      }`}
                      style={{ backgroundColor: player.avatarColor || '#8B5CF6' }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-black text-xl truncate text-white">{player.name}</span>
                    {player.artistName && (
                      <span className="text-sm text-white/70 italic truncate">
                        "{player.artistName}"
                      </span>
                    )}
                    <div className="flex gap-2 mt-1">
                      {!player.connected && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <WifiOff className="w-3 h-3" />
                          Disconnected
                        </Badge>
                      )}
                      {player.connected && player.isReady && (
                        <Badge className="text-sm bg-green-500 text-white border-2 border-white font-black px-3 py-1">✓ Ready</Badge>
                      )}
                      {player.connected && !player.isReady && (
                        <Badge className="text-sm bg-yellow-400 text-black border-2 border-white font-black px-3 py-1">Waiting...</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-4xl font-mono font-black flex-shrink-0 ml-2 text-white">
                  {player.score}
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* RIGHT COLUMN: Game card and controls */}
      <div className="space-y-6">
        <Card className="p-8 bg-black border-4 border-white shadow-2xl">
          <div className="flex items-center justify-end mb-6">
            <Badge className="text-2xl font-mono font-black px-8 py-4 bg-red-500 text-white border-4 border-white">
              {players.filter(p => p.connected && p.isReady).length}/{players.filter(p => p.connected).length} ready
            </Badge>
          </div>

        {currentSong && (
          <div className="bg-black/80 border-4 border-white rounded-3xl p-10 mb-6 shadow-2xl">
            {isDJPlaying ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-6 relative">
                  {/* Red sound wave behind text */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 scale-150">
                    <MusicEqualizer isPlaying={true} barCount={15} color="#ef4444" />
                  </div>
                  <Radio className="w-20 h-20 text-red-500 mb-4 animate-pulse relative z-10" />
                  <p className="text-4xl font-black text-red-500 mb-2 relative z-10">DJ ON AIR</p>
                </div>
                <div className="flex items-center gap-6 bg-white/10 rounded-2xl p-6 border-2 border-white/20">
                  {currentSong.albumCover && (
                    <img
                      src={currentSong.albumCover}
                      alt={currentSong.title}
                      className="w-32 h-32 rounded-2xl shadow-lg border-4 border-white"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-2">{currentSong.title}</h3>
                    <p className="text-xl text-white/70 mb-3">{currentSong.artist}</p>
                    <div className="flex items-center gap-4">
                      <Badge className="text-2xl font-mono font-black px-6 py-2 bg-red-500 text-white border-4 border-white">
                        {currentSong.year}
                      </Badge>
                      {results.length > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                          <span className="text-xl font-black text-white">
                            {results.filter(r => r.correct).length}/{results.length} correct
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : phase === 'playing' ? (
              <div className="relative overflow-hidden">
                {spotify.isPlaying && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/10 to-red-500/10 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 bg-red-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 bg-red-500/10 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                    </div>
                  </>
                )}
                <div className="relative flex flex-col items-center justify-center py-12">
                  <div className={`text-9xl font-bold mb-6 ${spotify.isPlaying ? 'text-red-500 animate-pulse' : 'text-red-500/50'}`}>?</div>
                  {spotify.isConnected && spotify.isReady ? (
                    <>
                      <div className="mb-6 scale-150">
                        <MusicEqualizer isPlaying={spotify.isPlaying} barCount={7} color="#ef4444" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-8 h-8 text-white/70" />
                        <p className="text-2xl font-bold text-white">
                          Connect Spotify to play music
                        </p>
                      </div>
                      <p className="text-lg text-white/60">
                        Click "Connect Spotify Premium" at the top
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {currentSong.albumCover && (
                  <img
                    src={currentSong.albumCover}
                    alt={currentSong.title}
                    className="w-32 h-32 rounded-2xl shadow-lg border-4 border-white"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-white mb-2">{currentSong.title}</h3>
                  <p className="text-xl text-white/70 mb-3">{currentSong.artist}</p>
                  <Badge className="text-2xl font-mono font-black px-6 py-2 bg-red-500 text-white border-4 border-white">
                    {currentSong.year}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        </Card>
      </div>
    </div>
  );
}
