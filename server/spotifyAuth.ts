import SpotifyWebApi from 'spotify-web-api-node';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

function getRedirectUri(): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/auth/spotify/callback`;
  }
  return 'https://hitster-ai.replit.app/auth/spotify/callback';
}

const REDIRECT_URI = getRedirectUri();

const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state'
];

export class SpotifyAuthService {
  private spotifyApi: SpotifyWebApi;

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI
    });
  }

  getAuthorizationUrl(state: string): string {
    return this.spotifyApi.createAuthorizeURL(SCOPES, state);
  }

  async handleCallback(code: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const data = await this.spotifyApi.authorizationCodeGrant(code);
    
    return {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresIn: data.body.expires_in
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    this.spotifyApi.setRefreshToken(refreshToken);
    const data = await this.spotifyApi.refreshAccessToken();
    
    return {
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in
    };
  }

  async playTrack(accessToken: string, trackUri: string, deviceId?: string): Promise<void> {
    this.spotifyApi.setAccessToken(accessToken);
    
    await this.spotifyApi.play({
      uris: [trackUri],
      device_id: deviceId
    });
  }

  async pausePlayback(accessToken: string, deviceId?: string): Promise<void> {
    this.spotifyApi.setAccessToken(accessToken);
    await this.spotifyApi.pause({ device_id: deviceId });
  }

  async getDevices(accessToken: string): Promise<any[]> {
    this.spotifyApi.setAccessToken(accessToken);
    const data = await this.spotifyApi.getMyDevices();
    return data.body.devices || [];
  }
}

export const spotifyAuthService = new SpotifyAuthService();
