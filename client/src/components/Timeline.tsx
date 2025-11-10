import { Plus, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Song } from '@/types/game.types';

interface TimelineProps {
  timeline: Song[];
  startYear: number;
  onPlaceCard?: (position: number) => void;
  onConfirmPlacement?: () => void;
  highlightPosition?: number;
  confirmedPosition?: number;
}

export default function Timeline({ timeline, startYear, onPlaceCard, onConfirmPlacement, highlightPosition, confirmedPosition }: TimelineProps) {
  return (
    <div className="p-6">

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {timeline.length === 0 ? (
          <div className="min-w-full flex items-center justify-center gap-4">
            <Card
              className={`w-48 h-64 flex flex-col items-center justify-center snap-start bg-black border-4 border-white shadow-xl ${
                confirmedPosition === 0 ? 'border-green-500' : highlightPosition === 0 ? 'ring-4 ring-red-500 cursor-pointer hover-elevate active-elevate-2' : 'cursor-pointer hover-elevate active-elevate-2'
              }`}
              onClick={() => confirmedPosition === undefined && onPlaceCard?.(0)}
              data-testid="slot-before-start"
            >
              {confirmedPosition === 0 ? (
                <>
                  <Lock className="w-12 h-12 text-green-500 mb-2" />
                  <p className="text-sm text-white font-bold">Before {startYear}</p>
                  <p className="text-xs text-white/60 mt-2">Locked</p>
                </>
              ) : highlightPosition === 0 ? (
                <Button
                  size="lg"
                  className="w-full text-lg py-6 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-white mx-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmPlacement?.();
                  }}
                >
                  <span className="text-center">Confirm<br/>Before {startYear}</span>
                </Button>
              ) : (
                <>
                  <Plus className="w-12 h-12 text-white mb-2" />
                  <p className="text-sm text-white/70 font-bold">Before {startYear}</p>
                </>
              )}
            </Card>

            <Card className="w-48 h-64 flex flex-col items-center justify-center bg-red-500/20 border-4 border-white border-dashed shadow-xl" data-testid="card-start-year">
              <Badge className="text-2xl font-mono font-black px-6 py-3 bg-red-500 text-white border-2 border-white">
                {startYear}
              </Badge>
              <p className="text-sm text-white font-bold mt-3">Start Year</p>
            </Card>

            <Card
              className={`w-48 h-64 flex flex-col items-center justify-center snap-start bg-black border-4 border-white shadow-xl ${
                confirmedPosition === 1 ? 'border-green-500' : highlightPosition === 1 ? 'ring-4 ring-red-500 cursor-pointer hover-elevate active-elevate-2' : 'cursor-pointer hover-elevate active-elevate-2'
              }`}
              onClick={() => confirmedPosition === undefined && onPlaceCard?.(1)}
              data-testid="slot-after-start"
            >
              {confirmedPosition === 1 ? (
                <>
                  <Lock className="w-12 h-12 text-green-500 mb-2" />
                  <p className="text-sm text-white font-bold">After {startYear}</p>
                  <p className="text-xs text-white/60 mt-2">Locked</p>
                </>
              ) : highlightPosition === 1 ? (
                <Button
                  size="lg"
                  className="w-full text-lg py-6 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-white mx-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmPlacement?.();
                  }}
                >
                  <span className="text-center">Confirm<br/>After {startYear}</span>
                </Button>
              ) : (
                <>
                  <Plus className="w-12 h-12 text-white mb-2" />
                  <p className="text-sm text-white/70 font-bold">After {startYear}</p>
                </>
              )}
            </Card>
          </div>
        ) : (
          <>
            <Card
              className={`min-w-[160px] h-64 flex flex-col items-center justify-center snap-start bg-black border-4 border-white shadow-xl ${
                confirmedPosition === 0 ? 'border-green-500' : highlightPosition === 0 ? 'ring-4 ring-red-500 cursor-pointer hover-elevate active-elevate-2' : 'cursor-pointer hover-elevate active-elevate-2'
              }`}
              onClick={() => confirmedPosition === undefined && onPlaceCard?.(0)}
              data-testid="slot-0"
            >
              {confirmedPosition === 0 ? (
                <>
                  <Lock className="w-10 h-10 text-green-500 mb-2" />
                  <p className="text-xs text-white font-bold">Before {timeline[0].year}</p>
                  <p className="text-xs text-white/60 mt-1">Locked</p>
                </>
              ) : highlightPosition === 0 ? (
                <Button
                  size="lg"
                  className="w-full text-sm py-6 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-white mx-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmPlacement?.();
                  }}
                >
                  <span className="text-center leading-tight">Confirm<br/>Before {timeline[0].year}</span>
                </Button>
              ) : (
                <>
                  <Plus className="w-10 h-10 text-white mb-2" />
                  <p className="text-xs text-white/70 font-bold">Before {timeline[0].year}</p>
                </>
              )}
            </Card>

            {timeline.map((song, idx) => {
              const nextSong = timeline[idx + 1];
              const showPlaceholder = !nextSong || song.year !== nextSong.year;

              return (
                <div key={song.id} className="flex gap-4 snap-start">
                  <Card className="min-w-[160px] h-64 p-3 flex flex-col bg-black border-4 border-white shadow-xl">
                    {song.albumCover && (
                      <img
                        src={song.albumCover}
                        alt={song.title}
                        className="w-full h-32 object-cover rounded-xl mb-2 border-2 border-white"
                      />
                    )}
                    <Badge className="text-lg font-mono font-black mb-2 self-start bg-red-500 text-white border-2 border-white">
                      {song.year}
                    </Badge>
                    <h4 className="font-bold text-sm line-clamp-2 text-white">{song.title}</h4>
                    <p className="text-xs text-white/60 line-clamp-1">{song.artist}</p>
                  </Card>

                  {showPlaceholder && (
                    <Card
                      className={`min-w-[160px] h-64 flex flex-col items-center justify-center bg-black border-4 border-white shadow-xl ${
                        confirmedPosition === idx + 1 ? 'border-green-500' : highlightPosition === idx + 1 ? 'ring-4 ring-red-500 cursor-pointer hover-elevate active-elevate-2' : 'cursor-pointer hover-elevate active-elevate-2'
                      }`}
                      onClick={() => confirmedPosition === undefined && onPlaceCard?.(idx + 1)}
                      data-testid={`slot-${idx + 1}`}
                    >
                      {confirmedPosition === idx + 1 ? (
                        <>
                          <Lock className="w-10 h-10 text-green-500 mb-2" />
                          <p className="text-xs text-white font-bold text-center px-2">
                            {nextSong ? `Between ${song.year} and ${nextSong.year}` : `After ${song.year}`}
                          </p>
                          <p className="text-xs text-white/60 mt-1">Locked</p>
                        </>
                      ) : highlightPosition === idx + 1 ? (
                        <Button
                          size="lg"
                          className="w-full text-sm py-6 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-white mx-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfirmPlacement?.();
                          }}
                        >
                          <span className="text-center leading-tight">
                            Confirm<br/>
                            {nextSong ? `Between ${song.year} and ${nextSong.year}` : `After ${song.year}`}
                          </span>
                        </Button>
                      ) : (
                        <>
                          <Plus className="w-10 h-10 text-white mb-2" />
                          <p className="text-xs text-white/70 font-bold text-center px-2">
                            {nextSong ? `Between ${song.year} and ${nextSong.year}` : `After ${song.year}`}
                          </p>
                        </>
                      )}
                    </Card>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
