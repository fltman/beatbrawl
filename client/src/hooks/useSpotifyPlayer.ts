import { useState, useEffect, useRef } from 'react';

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  addListener: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<any>;
  setName: (name: string) => void;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

export function useSpotifyPlayer() {
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    fetch('/api/spotify/status')
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          fetch('/api/spotify/token')
            .then(res => res.json())
            .then(tokenData => setAccessToken(tokenData.accessToken))
            .catch(console.error);
        }
      })
      .catch(console.error);
  }, []);

  const refreshTokenIfNeeded = async (): Promise<string | null> => {
    try {
      const tokenRes = await fetch('/api/spotify/token');
      if (tokenRes.ok) {
        const data = await tokenRes.json();
        setAccessToken(data.accessToken);
        return data.accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!accessToken || scriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    scriptLoaded.current = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'HITSTER AI Master Device',
        getOAuthToken: async (cb) => {
          const token = await refreshTokenIfNeeded();
          cb(token || accessToken);
        },
        volume: 0.6
      });

      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify player ready with device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline:', device_id);
        setIsReady(false);
      });

      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (state) {
          setIsPlaying(!state.paused);
        }
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  const playTrack = async (trackUri: string) => {
    if (!deviceId) {
      console.error('Cannot play: no device ID');
      return;
    }

    let token = accessToken || (await refreshTokenIfNeeded());
    if (!token) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });

      if (response.status === 401 || response.status === 403) {
        console.log('Token expired, refreshing...');
        token = await refreshTokenIfNeeded();
        if (token) {
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uris: [trackUri]
            })
          });
        }
      }

      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const pausePlayback = async () => {
    if (!accessToken || !deviceId) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  };

  return {
    isReady,
    isPlaying,
    deviceId,
    playTrack,
    pausePlayback,
    isConnected: !!accessToken
  };
}
