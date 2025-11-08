import SpotifyWebApi from 'spotify-web-api-node';
import type { Song } from '../shared/types';

interface SongSuggestion {
  title: string;
  artist: string;
  year: number;
}

class SpotifyService {
  private spotifyApi: SpotifyWebApi;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  private async ensureAuthenticated(): Promise<void> {
    const now = Date.now();
    
    if (this.tokenExpiresAt > now) {
      return;
    }

    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);
      this.tokenExpiresAt = now + (data.body.expires_in - 60) * 1000;
      console.log('Spotify: Access token obtained');
    } catch (error) {
      console.error('Spotify authentication failed:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async searchSongs(query: string, limit: number = 15): Promise<Song[]> {
    await this.ensureAuthenticated();

    if (!query || query.trim().length === 0) {
      console.log('Empty search query provided');
      return [];
    }

    const cleanQuery = query.trim();
    console.log(`Spotify: Searching for "${cleanQuery}"`);

    try {
      const response = await this.spotifyApi.searchTracks(cleanQuery, { limit: 50 });
      const tracks = response.body.tracks?.items || [];
      console.log(`Spotify: Got ${tracks.length} raw tracks from API`);

      let filteredCount = 0;
      let noPreviewCount = 0;
      let invalidYearCount = 0;

      const songs: Song[] = tracks
        .filter((track: any) => {
          const releaseDate = track.album.release_date;
          const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;
          const hasValidYear = year && year >= 1950 && year <= 2024;
          const hasPreview = !!track.preview_url;
          
          if (!hasValidYear) invalidYearCount++;
          if (!hasPreview) noPreviewCount++;
          
          const keep = hasValidYear && hasPreview;
          if (keep) filteredCount++;
          
          return keep;
        })
        .slice(0, limit)
        .map((track: any) => {
          const releaseDate = track.album.release_date;
          const year = parseInt(releaseDate.split('-')[0]);

          return {
            id: track.id,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            year,
            albumCover: track.album.images[0]?.url || '',
            previewUrl: track.preview_url || undefined
          };
        });

      console.log(`Spotify: Filtered - ${filteredCount} valid, ${noPreviewCount} no preview, ${invalidYearCount} bad year`);
      console.log(`Spotify: Returning ${songs.length} songs for query "${cleanQuery}"`);
      return songs;
    } catch (error) {
      console.error('Spotify search failed:', error);
      throw new Error('Failed to search songs on Spotify');
    }
  }

  async searchSpecificSong(title: string, artist: string): Promise<Song | null> {
    await this.ensureAuthenticated();

    const query = `track:"${title}" artist:"${artist}"`;
    
    try {
      const response = await this.spotifyApi.searchTracks(query, { limit: 5 });
      const tracks = response.body.tracks?.items || [];

      const validTrack = tracks.find((track: any) => {
        const releaseDate = track.album.release_date;
        const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;
        return year && year >= 1950 && year <= 2024 && track.preview_url;
      });

      if (!validTrack) {
        return null;
      }

      const releaseDate = validTrack.album.release_date;
      const year = parseInt(releaseDate.split('-')[0]);

      return {
        id: validTrack.id,
        title: validTrack.name,
        artist: validTrack.artists.map((a: any) => a.name).join(', '),
        year,
        albumCover: validTrack.album.images[0]?.url || '',
        previewUrl: validTrack.preview_url
      };
    } catch (error) {
      console.error(`Failed to find "${title}" by ${artist}:`, error);
      return null;
    }
  }

  async searchFromSuggestions(suggestions: SongSuggestion[], targetCount: number = 15): Promise<Song[]> {
    console.log(`Spotify: Searching for ${suggestions.length} AI-suggested songs`);
    
    const songs: Song[] = [];
    
    for (const suggestion of suggestions) {
      if (songs.length >= targetCount) break;
      
      const song = await this.searchSpecificSong(suggestion.title, suggestion.artist);
      if (song) {
        console.log(`  ✓ Found: "${song.title}" by ${song.artist}`);
        songs.push(song);
      } else {
        console.log(`  ✗ Not found: "${suggestion.title}" by ${suggestion.artist}`);
      }
    }

    console.log(`Spotify: Successfully found ${songs.length}/${targetCount} songs`);
    return songs;
  }

  async getRecommendations(genre: string, limit: number = 15): Promise<Song[]> {
    await this.ensureAuthenticated();

    try {
      const seedGenres = [genre.toLowerCase().replace(/\s+/g, '-')];
      
      const response = await this.spotifyApi.getRecommendations({
        seed_genres: seedGenres,
        limit: 50,
        min_popularity: 30
      });

      const tracks = response.body.tracks || [];

      const songs: Song[] = tracks
        .filter((track: any) => {
          const releaseDate = track.album.release_date;
          const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;
          return year && year >= 1950 && year <= 2024 && track.preview_url;
        })
        .slice(0, limit)
        .map((track: any) => {
          const releaseDate = track.album.release_date;
          const year = parseInt(releaseDate.split('-')[0]);

          return {
            id: track.id,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            year,
            albumCover: track.album.images[0]?.url || '',
            previewUrl: track.preview_url || undefined
          };
        });

      console.log(`Spotify: Found ${songs.length} recommendations for genre "${genre}"`);
      return songs;
    } catch (error) {
      console.error('Spotify recommendations failed:', error);
      return this.searchSongs(genre, limit);
    }
  }
}

export const spotifyService = new SpotifyService();
