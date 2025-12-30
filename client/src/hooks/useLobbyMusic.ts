import { useState, useEffect, useRef, useCallback } from 'react';

// List of lobby music tracks
const LOBBY_TRACKS = [
  '/music/Brooklyn concrete where legends are made.mp3',
  '/music/Champions rise when the beat drops hard.mp3',
  '/music/Cruising down the coast with the top lai.mp3',
  '/music/Enter the chamber where the masters dwel.mp3',
  '/music/Saturday night and the game is on.mp3',
  '/music/South Central raised where the pain is r.mp3',
  '/music/Standing in the basement where the cool .mp3',
  '/music/Step inside the studio where the magic\'s.mp3',
  '/music/Take it back to the essence, the golden .mp3',
  '/music/Yeah, we bouncing down the one-way stree.mp3',
  '/music/Yo, it\'s the doctrine from the bridge wh.mp3',
];

interface UseLobbyMusicReturn {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
}

export function useLobbyMusic(autoStart: boolean = false): UseLobbyMusicReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedTracksRef = useRef<Set<string>>(new Set());
  const isPlayingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const getRandomTrack = useCallback(() => {
    // If we've played all tracks, reset the set
    if (playedTracksRef.current.size >= LOBBY_TRACKS.length) {
      playedTracksRef.current.clear();
    }

    // Get tracks we haven't played yet
    const unplayedTracks = LOBBY_TRACKS.filter(
      track => !playedTracksRef.current.has(track)
    );

    // Pick a random unplayed track
    const randomIndex = Math.floor(Math.random() * unplayedTracks.length);
    const selectedTrack = unplayedTracks[randomIndex];
    playedTracksRef.current.add(selectedTrack);

    return selectedTrack;
  }, []);

  const playNextTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const track = getRandomTrack();
    const audio = new Audio(track);
    audio.volume = 0.5;

    audio.onended = () => {
      // When track ends, play another random track (use ref for current state)
      if (isPlayingRef.current) {
        playNextTrack();
      }
    };

    audio.onerror = (e) => {
      console.error('Lobby music error:', e);
      // Try another track on error
      setTimeout(() => {
        if (isPlayingRef.current) {
          playNextTrack();
        }
      }, 1000);
    };

    audioRef.current = audio;
    audio.play().catch(err => {
      console.error('Failed to play lobby music:', err);
      setIsPlaying(false);
    });
  }, [getRandomTrack]);

  const play = useCallback(() => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    playNextTrack();
  }, [playNextTrack]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        play();
      }
    }
  }, [isPlaying, pause, play]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    playedTracksRef.current.clear();
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !isPlaying) {
      play();
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { isPlaying, play, pause, toggle, stop };
}
