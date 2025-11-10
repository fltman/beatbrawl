import { useEffect, useRef } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import WinnerConfetti from './WinnerConfetti';
import type { Player } from '@/types/game.types';

interface WinnerScreenProps {
  winner: Player;
  allPlayers: Player[];
  onNewGame?: () => void;
}

export default function WinnerScreen({ winner, allPlayers, onNewGame }: WinnerScreenProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if content overflows
    const hasOverflow = container.scrollHeight > container.clientHeight;
    if (!hasOverflow) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    const pauseAtEdges = 2000; // ms to pause at top/bottom
    let isPaused = true;
    let pauseTimeout: NodeJS.Timeout;

    const scroll = () => {
      if (isPaused) return;

      scrollPosition += scrollSpeed;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (scrollPosition >= maxScroll) {
        // Reached bottom, pause and reset
        container.scrollTop = maxScroll;
        isPaused = true;
        pauseTimeout = setTimeout(() => {
          scrollPosition = 0;
          container.scrollTop = 0;
          isPaused = true;
          pauseTimeout = setTimeout(() => {
            isPaused = false;
          }, pauseAtEdges);
        }, pauseAtEdges);
      } else {
        container.scrollTop = scrollPosition;
      }
    };

    // Start after initial pause
    pauseTimeout = setTimeout(() => {
      isPaused = false;
    }, pauseAtEdges);

    const intervalId = setInterval(scroll, 16); // ~60fps

    return () => {
      clearInterval(intervalId);
      clearTimeout(pauseTimeout);
    };
  }, [allPlayers]);
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      <WinnerConfetti trigger={true} />

      {/* BeatBrawl Logo - Upper Left */}
      <div className="absolute top-8 left-8 z-50">
        <img
          src="/beatbrawl.png"
          alt="BeatBrawl Logo"
          className="h-24 w-auto"
        />
      </div>

      <div className="w-full max-w-7xl relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT COLUMN: Winner */}
          <Card className="p-10 bg-black border-4 border-white shadow-2xl flex flex-col items-center justify-center">
            {winner.profileImage ? (
              <div className="inline-block mb-6 relative">
                <img
                  src={winner.profileImage}
                  alt={winner.name}
                  className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-2xl"
                  style={{ backgroundColor: winner.avatarColor || '#8B5CF6' }}
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-red-500 border-4 border-white mb-6 shadow-2xl">
                <Trophy className="w-20 h-20 text-white" />
              </div>
            )}
            <h1 className="text-7xl font-black mb-4 text-white text-center" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>CONGRATS!</h1>
            <div className="inline-flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-red-500" />
              <h2 className="text-5xl font-black text-white text-center" data-testid="text-winner-name">{winner.name}</h2>
              <Sparkles className="w-8 h-8 text-red-500" />
            </div>
            {winner.artistName && (
              <p className="text-3xl text-white/80 italic mb-3 text-center">
                "{winner.artistName}"
              </p>
            )}
            <p className="text-2xl text-white/70 font-bold text-center">won the game!</p>
          </Card>

          {/* RIGHT COLUMN: Final Standings */}
          <Card className="p-10 bg-black border-4 border-white shadow-2xl">
            <h3 className="text-3xl font-black mb-6 text-white">Final Standings</h3>
            <div ref={scrollContainerRef} className="space-y-4 max-h-[500px] overflow-y-auto scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {allPlayers
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                      idx === 0 ? 'border-red-500 bg-red-500/10' : 'border-white/20 bg-white/5'
                    }`}
                    data-testid={`final-score-${idx}`}
                  >
                    <div className="flex items-center gap-4">
                      {player.profileImage ? (
                        <div className="relative">
                          <img
                            src={player.profileImage}
                            alt={player.name}
                            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                            style={{ backgroundColor: player.avatarColor || '#8B5CF6' }}
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4 border-white shadow-lg ${
                            idx === 0 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                          }`}
                          style={!player.profileImage && player.avatarColor && idx !== 0 ? { backgroundColor: player.avatarColor } : {}}
                        >
                          {idx === 0 ? '🏆' : idx + 1}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-black text-2xl text-white">{player.name}</span>
                        {player.artistName && (
                          <span className="text-sm text-white/70 italic">
                            "{player.artistName}"
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-5xl font-mono font-black text-white">
                      {player.score}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <Button
          size="lg"
          className="w-full text-2xl py-8 mt-8 bg-red-500 hover:bg-red-600 text-white font-black border-4 border-white shadow-2xl"
          onClick={onNewGame}
          data-testid="button-new-game"
        >
          New Game
        </Button>
      </div>
    </div>
  );
}
