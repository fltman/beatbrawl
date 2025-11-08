import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Song } from '@/types/game.types';

interface TimelineProps {
  timeline: Song[];
  startYear: number;
  onPlaceCard?: (position: number) => void;
  highlightPosition?: number;
}

export default function Timeline({ timeline, startYear, onPlaceCard, highlightPosition }: TimelineProps) {
  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Din Tidslinje</h2>
        <p className="text-muted-foreground">Placera låten på rätt plats</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {timeline.length === 0 ? (
          <div className="min-w-full flex items-center justify-center gap-4">
            <Card
              className={`w-48 h-64 flex flex-col items-center justify-center cursor-pointer hover-elevate active-elevate-2 snap-start ${
                highlightPosition === 0 ? 'ring-4 ring-primary' : ''
              }`}
              onClick={() => onPlaceCard?.(0)}
              data-testid="slot-before-start"
            >
              <Plus className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Före {startYear}</p>
            </Card>

            <Card className="w-48 h-64 flex flex-col items-center justify-center bg-accent/20 border-2 border-dashed" data-testid="card-start-year">
              <Badge variant="outline" className="text-2xl font-mono font-bold px-4 py-2">
                {startYear}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">Startår</p>
            </Card>

            <Card
              className={`w-48 h-64 flex flex-col items-center justify-center cursor-pointer hover-elevate active-elevate-2 snap-start ${
                highlightPosition === 1 ? 'ring-4 ring-primary' : ''
              }`}
              onClick={() => onPlaceCard?.(1)}
              data-testid="slot-after-start"
            >
              <Plus className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Efter {startYear}</p>
            </Card>
          </div>
        ) : (
          <>
            <Card
              className={`min-w-[160px] h-64 flex flex-col items-center justify-center cursor-pointer hover-elevate active-elevate-2 snap-start ${
                highlightPosition === 0 ? 'ring-4 ring-primary' : ''
              }`}
              onClick={() => onPlaceCard?.(0)}
              data-testid="slot-0"
            >
              <Plus className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Före {timeline[0].year}</p>
            </Card>

            {timeline.map((song, idx) => (
              <div key={song.id} className="flex gap-4 snap-start">
                <Card className="min-w-[160px] h-64 p-3 flex flex-col">
                  {song.albumCover && (
                    <img
                      src={song.albumCover}
                      alt={song.title}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <Badge className="text-lg font-mono font-bold mb-2 self-start">
                    {song.year}
                  </Badge>
                  <h4 className="font-semibold text-sm line-clamp-2">{song.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{song.artist}</p>
                </Card>

                <Card
                  className={`min-w-[160px] h-64 flex flex-col items-center justify-center cursor-pointer hover-elevate active-elevate-2 ${
                    highlightPosition === idx + 1 ? 'ring-4 ring-primary' : ''
                  }`}
                  onClick={() => onPlaceCard?.(idx + 1)}
                  data-testid={`slot-${idx + 1}`}
                >
                  <Plus className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground text-center px-2">
                    {timeline[idx + 1] ? `Mellan ${song.year} och ${timeline[idx + 1].year}` : `Efter ${song.year}`}
                  </p>
                </Card>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
