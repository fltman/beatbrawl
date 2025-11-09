import { useEffect, useState } from 'react';

interface MusicEqualizerProps {
  isPlaying: boolean;
  barCount?: number;
  color?: string;
}

export default function MusicEqualizer({ isPlaying, barCount = 5, color = 'hsl(var(--primary))' }: MusicEqualizerProps) {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setHeights(Array(barCount).fill(0).map(() => 
        Math.random() * 80 + 20
      ));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div className="flex items-end gap-1 h-12" data-testid="music-equalizer">
      {heights.map((height, i) => (
        <div
          key={i}
          className="w-2 rounded-full transition-all duration-150 ease-in-out"
          style={{
            height: `${height}%`,
            backgroundColor: color,
            opacity: isPlaying ? 1 : 0.3
          }}
          data-testid={`equalizer-bar-${i}`}
        />
      ))}
    </div>
  );
}
