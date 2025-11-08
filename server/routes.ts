import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { randomBytes } from "crypto";
import { setupSocketHandlers } from "./socketHandlers";
import { spotifyAuthService } from "./spotifyAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Spotify OAuth endpoints
  app.get('/auth/spotify', (req: Request, res: Response) => {
    const state = randomBytes(32).toString('hex');
    req.session.spotifyOAuthState = state;
    const authUrl = spotifyAuthService.getAuthorizationUrl(state);
    res.redirect(authUrl);
  });

  app.get('/auth/spotify/callback', async (req: Request, res: Response) => {
    const { code, error, state } = req.query;

    if (error || !code) {
      return res.redirect('/?error=spotify_auth_failed');
    }

    if (!state || state !== req.session.spotifyOAuthState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      return res.redirect('/?error=spotify_csrf_detected');
    }

    delete req.session.spotifyOAuthState;

    try {
      const { accessToken, refreshToken, expiresIn } = await spotifyAuthService.handleCallback(code as string);
      
      req.session.spotifyAccessToken = accessToken;
      req.session.spotifyRefreshToken = refreshToken;
      req.session.spotifyTokenExpiry = Date.now() + expiresIn * 1000;

      res.redirect('/master?spotify_connected=true');
    } catch (error) {
      console.error('Spotify OAuth callback error:', error);
      res.redirect('/?error=spotify_token_failed');
    }
  });

  app.get('/api/spotify/status', (req: Request, res: Response) => {
    const isConnected = !!(req.session.spotifyAccessToken && 
                          req.session.spotifyTokenExpiry && 
                          req.session.spotifyTokenExpiry > Date.now());
    
    res.json({ connected: isConnected });
  });

  app.get('/api/spotify/token', async (req: Request, res: Response) => {
    if (!req.session.spotifyAccessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.spotifyTokenExpiry && req.session.spotifyTokenExpiry < Date.now()) {
      if (req.session.spotifyRefreshToken) {
        try {
          const { accessToken, expiresIn } = await spotifyAuthService.refreshAccessToken(req.session.spotifyRefreshToken);
          req.session.spotifyAccessToken = accessToken;
          req.session.spotifyTokenExpiry = Date.now() + expiresIn * 1000;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return res.status(401).json({ error: 'Token refresh failed' });
        }
      } else {
        return res.status(401).json({ error: 'Token expired' });
      }
    }

    res.json({ accessToken: req.session.spotifyAccessToken });
  });

  app.post('/api/spotify/disconnect', (req: Request, res: Response) => {
    req.session.spotifyAccessToken = undefined;
    req.session.spotifyRefreshToken = undefined;
    req.session.spotifyTokenExpiry = undefined;
    
    res.json({ success: true });
  });

  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? false 
        : ["http://localhost:5000", "http://localhost:5173"],
      credentials: true
    }
  });

  setupSocketHandlers(io);

  return httpServer;
}
