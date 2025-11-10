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
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      <WinnerConfetti trigger={true} />

      {/* BeatBrawl Logo - Upper Left */}
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/beatbrawl.png"
          alt="BeatBrawl Logo"
          className="h-24 w-auto"
        />
      </div>

      <div className="w-full max-w-4xl relative z-30">
        <div className="text-center mb-8">
          {winner.profileImage ? (
            <div className="inline-block mb-6 relative">
              <img
                src={winner.profileImage}
                alt={winner.name}
                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-2xl"
                style={{ backgroundColor: winner.avatarColor || '#8B5CF6' }}
              />
              <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center border-4 border-white shadow-xl">
                <Trophy className="w-8 h-8" />
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-500 border-4 border-white mb-6 shadow-2xl">
              <Trophy className="w-16 h-16 text-white" />
            </div>
          )}
          <h1 className="text-8xl font-black mb-4 text-white" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>GRATTIS!</h1>
          <div className="inline-flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-red-500" />
            <h2 className="text-5xl font-black text-white" data-testid="text-winner-name">{winner.name}</h2>
            <Sparkles className="w-8 h-8 text-red-500" />
          </div>
          {winner.artistName && (
            <p className="text-3xl text-white/80 italic mb-3">
              "{winner.artistName}"
            </p>
          )}
          <p className="text-2xl text-white/70 font-bold">vann spelet!</p>
        </div>

        <Card className="p-8 mb-6 bg-black border-4 border-white shadow-2xl">
          <h3 className="text-3xl font-black mb-6 text-white">Slutställning</h3>
          <div className="space-y-4">
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
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm border-2 border-white font-bold">
                            🏆
                          </div>
                        )}
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

        <Button
          size="lg"
          className="w-full text-2xl py-8 bg-red-500 hover:bg-red-600 text-white font-black border-4 border-white shadow-2xl"
          onClick={onNewGame}
          data-testid="button-new-game"
        >
          Nytt Spel
        </Button>
      </div>
    </div>
  );
}
