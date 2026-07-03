import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { randomBytes } from "crypto";
import { setupSocketHandlers } from "./socketHandlers";
import { spotifyAuthService } from "./spotifyAuth";
import { storage } from "./storage";
import { insertPlayerProfileSchema, updatePlayerProfileSchema } from "@shared/schema";
import { aiProfileGenerator } from "./aiProfileGenerator";
import { imageStorage } from "./imageStorage";

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

      // Persist to DB so non-browser masters (Apple TV) can get tokens via socket
      storage.saveSpotifyCredentials(refreshToken, accessToken, Date.now() + expiresIn * 1000)
        .catch(err => console.error('Failed to persist Spotify credentials:', err));

      res.redirect('/?spotify_connected=true');
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

  // AI Chat endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message, conversationHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'AI service not configured' });
      }

      const messages = [
        {
          role: 'system' as const,
          content: `You are an enthusiastic and helpful AI game master for the music game HITSTER. Your job is to help players formulate their music preferences through a friendly conversation.

IMPORTANT: You should NEVER mention or reveal which songs will be played in your chat response. You only help the user describe what they want.

Behavior:
- Be friendly, brief, and enthusiastic
- Ask follow-up questions if the user is unsure
- Give concrete suggestions based on their answers
- Keep responses short (2-3 sentences max)
- Speak natural English
- Focus on helping them DESCRIBE what they want, not what they will GET

Examples of good interactions:
- If they say "80s" → "Cool! Do you want rock, pop, or disco from the 80s?"
- If they say "Swedish music" → "Nice! Which period or genre? 90s pop or maybe modern hits?"

When they seem satisfied with the choice, say something like "Perfect! Click Confirm and I'll handle the rest!"

You should return JSON in this exact format:
{
  "message": "Your chat response here (what the user sees)",
  "songs": [
    {
      "title": "Song Name",
      "artist": "Artist Name",
      "year": 1985,
      "movie": "Film Title (if film music)",
      "trivia": "An interesting fact about the song that fits the music theme"
    },
    ...
  ],
  "startYearRange": {"min": 1980, "max": 1989}
}

In the "songs" array, based on the conversation, choose 20 popular songs that match what the user seems to want.
In "startYearRange", choose an appropriate year range for players' start years based on the music choice (e.g., if they want 80s music: min: 1980, max: 1989).

IMPORTANT:
- ONLY add songs and startYearRange when the user has given enough context. On the first response, you can have an empty array and null for startYearRange if the user hasn't been specific enough yet.
- All songs must be UNIQUE - no song can appear twice in the list. Check that each combination of title and artist is unique.
- If it's film music or soundtracks: add the "movie" field with the film's title (e.g., "movie": "The Greatest Showman"). This is OPTIONAL and should only be included for film music.
- For EVERY song: add a "trivia" field with a short (10-20 words) interesting fact/trivia about the song that takes the user's context into account. For example: if they want film music, focus on the film; if they want 80s, mention 80s context; if Swedish music, mention Swedish pop culture etc. Be specific and relevant for that particular song.`
        },
        ...(conversationHistory || []),
        { role: 'user' as const, content: message }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hitster-ai.replit.app',
          'X-Title': 'HITSTER AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-3.5-flash',
          messages,
          temperature: 0.8,
          reasoning: { effort: 'low' }
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status);
        return res.status(500).json({ error: 'AI service error' });
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content;

      if (!aiContent) {
        return res.status(500).json({ error: 'No response from AI' });
      }

      // Parse JSON response - remove markdown code blocks if present
      try {
        // Remove markdown code blocks (```json and ```)
        let cleanedContent = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          // Fallback if no JSON
          return res.json({ 
            response: aiContent,
            songs: []
          });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        res.json({ 
          response: parsed.message || aiContent,
          songs: parsed.songs || [],
          startYearRange: parsed.startYearRange || null
        });
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.error('Failed to parse AI JSON:', parseError);
        res.json({ 
          response: aiContent,
          songs: []
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Player Profile endpoints
  app.get('/api/profiles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const profile = await storage.getPlayerProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/profiles', async (req: Request, res: Response) => {
    try {
      const validated = insertPlayerProfileSchema.parse(req.body);
      const profile = await storage.createPlayerProfile(validated);
      
      res.status(201).json(profile);
    } catch (error: any) {
      console.error('Create profile error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid profile data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/profiles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = updatePlayerProfileSchema.parse(req.body);
      const profile = await storage.updatePlayerProfile(id, validated);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json(profile);
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid profile data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/profiles/:id/mark-used', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.updateLastUsed(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark profile used error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Profile Generation endpoint
  app.post('/api/profiles/generate-ai', async (req: Request, res: Response) => {
    try {
      const { name, photoBase64 } = req.body;

      if (!name || !photoBase64) {
        return res.status(400).json({ error: 'Name and photo are required' });
      }

      console.log(`Generating AI profile for: ${name}`);

      const result = await aiProfileGenerator.generateProfile(name, photoBase64);

      res.json(result);
    } catch (error: any) {
      console.error('AI profile generation error:', error);
      res.status(500).json({
        error: 'Failed to generate AI profile',
        details: error.message
      });
    }
  });

  // Serve profile images (thumbnails) with filesystem cache
  app.get('/api/profiles/images/:imageId', async (req: Request, res: Response) => {
    try {
      const { imageId } = req.params;
      const size = req.query.size as string; // 'full' or undefined (default: thumbnail)

      // Validate imageId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(imageId)) {
        return res.status(400).json({ error: 'Invalid image ID' });
      }

      // Get thumbnail (cached) or full image
      const image = size === 'full'
        ? await imageStorage.getImage(imageId)
        : await imageStorage.getThumbnail(imageId);

      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Convert base64 to buffer and send
      const buffer = Buffer.from(image.data, 'base64');
      res.setHeader('Content-Type', image.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(buffer);
    } catch (error) {
      console.error('Serve image error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
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
