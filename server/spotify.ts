import SpotifyWebApi from 'spotify-web-api-node';
import type { Song } from '../shared/types';

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

    try {
      const response = await this.spotifyApi.searchTracks(query, { limit: 50 });
      const tracks = response.body.tracks?.items || [];

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

      console.log(`Spotify: Found ${songs.length} songs for query "${query}"`);
      return songs;
    } catch (error) {
      console.error('Spotify search failed:', error);
      throw new Error('Failed to search songs on Spotify');
    }
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
