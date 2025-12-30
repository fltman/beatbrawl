import SpotifyWebApi from 'spotify-web-api-node';
import type { Song, SongSuggestion } from '../shared/types';
import type { SpotifySearchQuery } from './ai';

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
      const response = await this.spotifyApi.searchTracks(cleanQuery, { 
        limit: 50,
        market: 'SE'
      });
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
          
          if (hasValidYear) filteredCount++;
          
          return hasValidYear;
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

  async searchSpecificSong(suggestion: SongSuggestion): Promise<Song | null> {
    await this.ensureAuthenticated();

    const simpleQuery = `${suggestion.title} ${suggestion.artist}`;
    console.log(`  Searching: "${simpleQuery}" (target year: ${suggestion.year})`);
    
    try {
      const response = await this.spotifyApi.searchTracks(simpleQuery, { 
        limit: 15,
        market: 'SE'
      });
      const tracks = response.body.tracks?.items || [];
      console.log(`  Got ${tracks.length} results`);

      const validTracks = tracks.filter((track: any) => {
        const releaseDate = track.album.release_date;
        const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;
        return year && year >= 1950 && year <= 2024;
      });

      const exactYearMatches = validTracks.filter((track: any) => {
        const year = parseInt(track.album.release_date.split('-')[0]);
        return Math.abs(year - suggestion.year) <= 2;
      });

      const tracksToConsider = exactYearMatches.length > 0 ? exactYearMatches : validTracks;
      const tracksWithPreview = tracksToConsider.filter((t: any) => !!t.preview_url);
      
      console.log(`  ${exactYearMatches.length} tracks matching year ${suggestion.year} (±2 years)`);
      console.log(`  ${tracksWithPreview.length} with preview URLs`);

      if (tracksToConsider.length === 0) {
        return null;
      }

      const bestMatch = tracksWithPreview.length > 0 ? tracksWithPreview[0] : tracksToConsider[0];
      const releaseDate = bestMatch.album.release_date;
      const year = parseInt(releaseDate.split('-')[0]);

      return {
        id: bestMatch.id,
        title: bestMatch.name,
        artist: bestMatch.artists.map((a: any) => a.name).join(', '),
        year,
        albumCover: bestMatch.album.images[0]?.url || '',
        previewUrl: bestMatch.preview_url || undefined,
        movie: suggestion.movie,
        trivia: suggestion.trivia
      };
    } catch (error: any) {
      console.error(`  Error searching "${suggestion.title}" by ${suggestion.artist}:`, error.message);
      return null;
    }
  }

  async searchFromSuggestions(suggestions: SongSuggestion[], targetCount: number = 15): Promise<Song[]> {
    console.log(`Spotify: Searching for ${suggestions.length} AI-suggested songs`);
    
    const songs: Song[] = [];
    
    for (const suggestion of suggestions) {
      if (songs.length >= targetCount) break;
      
      const song = await this.searchSpecificSong(suggestion);
      if (song) {
        const movieInfo = song.movie ? ` från ${song.movie}` : '';
        console.log(`  ✓ Found: "${song.title}" by ${song.artist} (${song.year})${movieInfo}`);
        songs.push(song);
      } else {
        console.log(`  ✗ Not found: "${suggestion.title}" by ${suggestion.artist} (${suggestion.year})`);
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
        min_popularity: 30,
        market: 'SE'
      });

      const tracks = response.body.tracks || [];

      const songs: Song[] = tracks
        .filter((track: any) => {
          const releaseDate = track.album.release_date;
          const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;
          return year && year >= 1950 && year <= 2024;
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

  async searchFromQueries(queries: SpotifySearchQuery[], targetCount: number = 20): Promise<Song[]> {
    await this.ensureAuthenticated();

    console.log(`Spotify: Searching with ${queries.length} queries, target: ${targetCount} songs`);

    const allSongs: Song[] = [];
    const seenTrackIds = new Set<string>();
    const seenSongKeys = new Set<string>(); // Track title+artist to catch same song on different albums
    const songsPerQuery = Math.ceil(targetCount / queries.length) + 2; // Get extra for filtering duplicates

    // Shuffle queries for variety
    const shuffledQueries = [...queries].sort(() => Math.random() - 0.5);

    for (const queryObj of shuffledQueries) {
      if (allSongs.length >= targetCount) break;

      try {
        console.log(`  Searching: "${queryObj.query}"`);

        const response = await this.spotifyApi.searchTracks(queryObj.query, {
          limit: 50,
          market: 'SE'
        });

        const tracks = response.body.tracks?.items || [];
        console.log(`    Got ${tracks.length} results`);

        // Shuffle tracks to avoid always getting the same top results
        const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);

        let addedFromQuery = 0;
        for (const track of shuffledTracks) {
          if (allSongs.length >= targetCount) break;
          if (addedFromQuery >= songsPerQuery) break;
          if (seenTrackIds.has(track.id)) continue;

          // Check for same song on different albums (normalize title + artist)
          const artistName = track.artists.map((a: any) => a.name).join(', ');
          const songKey = `${track.name.toLowerCase().trim()}|${artistName.toLowerCase().trim()}`;
          if (seenSongKeys.has(songKey)) continue;

          const releaseDate = track.album.release_date;
          const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;

          // Check year validity
          if (!year || year < 1950 || year > 2024) continue;

          // Check year range filter if specified
          if (queryObj.yearMin && year < queryObj.yearMin) continue;
          if (queryObj.yearMax && year > queryObj.yearMax) continue;

          seenTrackIds.add(track.id);
          seenSongKeys.add(songKey);
          addedFromQuery++;

          allSongs.push({
            id: track.id,
            title: track.name,
            artist: artistName,
            year,
            albumCover: track.album.images[0]?.url || '',
            previewUrl: track.preview_url || undefined
          });
        }

        console.log(`    Added ${addedFromQuery} songs (total: ${allSongs.length})`);

      } catch (error: any) {
        console.error(`  Error searching "${queryObj.query}":`, error.message);
      }
    }

    // Shuffle final results to mix songs from different queries
    const shuffledSongs = allSongs.sort(() => Math.random() - 0.5);

    // Ensure good year distribution - sort by year and spread them out
    const sortedByYear = [...shuffledSongs].sort((a, b) => a.year - b.year);
    const finalSongs: Song[] = [];
    const used = new Set<number>();

    // Interleave songs from different decades for variety
    while (finalSongs.length < targetCount && used.size < sortedByYear.length) {
      for (let i = 0; i < sortedByYear.length && finalSongs.length < targetCount; i++) {
        if (!used.has(i)) {
          // Skip every other song to spread decades
          if (finalSongs.length % 2 === 0 || used.size > sortedByYear.length - 5) {
            finalSongs.push(sortedByYear[i]);
            used.add(i);
          }
        }
      }
      // On second pass, add remaining
      for (let i = 0; i < sortedByYear.length && finalSongs.length < targetCount; i++) {
        if (!used.has(i)) {
          finalSongs.push(sortedByYear[i]);
          used.add(i);
        }
      }
    }

    // Final shuffle for game randomness
    const result = finalSongs.sort(() => Math.random() - 0.5).slice(0, targetCount);

    console.log(`Spotify: Returning ${result.length} diverse songs`);
    console.log(`  Year range: ${Math.min(...result.map(s => s.year))} - ${Math.max(...result.map(s => s.year))}`);

    return result;
  }
}

export const spotifyService = new SpotifyService();
