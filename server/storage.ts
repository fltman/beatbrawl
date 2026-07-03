import {
  type User,
  type InsertUser,
  type PlayerProfile,
  type InsertPlayerProfile,
  type UpdatePlayerProfile,
  type SpotifyCredentials,
  playerProfiles,
  spotifyCredentials
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player profile methods
  getPlayerProfile(id: string): Promise<PlayerProfile | undefined>;
  createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile>;
  updatePlayerProfile(id: string, profile: UpdatePlayerProfile): Promise<PlayerProfile | undefined>;
  updateLastUsed(id: string): Promise<void>;

  // Spotify credentials (single row - the household's Spotify account)
  getSpotifyCredentials(): Promise<SpotifyCredentials | undefined>;
  saveSpotifyCredentials(refreshToken: string, accessToken?: string, expiresAt?: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPlayerProfile(id: string): Promise<PlayerProfile | undefined> {
    const result = await db.select().from(playerProfiles).where(eq(playerProfiles.id, id)).limit(1);
    return result[0];
  }

  async createPlayerProfile(profile: InsertPlayerProfile): Promise<PlayerProfile> {
    const result = await db.insert(playerProfiles).values(profile).returning();
    return result[0];
  }

  async updatePlayerProfile(id: string, profile: UpdatePlayerProfile): Promise<PlayerProfile | undefined> {
    const result = await db.update(playerProfiles)
      .set(profile)
      .where(eq(playerProfiles.id, id))
      .returning();
    return result[0];
  }

  async updateLastUsed(id: string): Promise<void> {
    await db.update(playerProfiles)
      .set({ lastUsedAt: new Date() })
      .where(eq(playerProfiles.id, id));
  }

  async getSpotifyCredentials(): Promise<SpotifyCredentials | undefined> {
    const result = await db.select().from(spotifyCredentials).limit(1);
    return result[0];
  }

  async saveSpotifyCredentials(refreshToken: string, accessToken?: string, expiresAt?: number): Promise<void> {
    const existing = await this.getSpotifyCredentials();
    if (existing) {
      await db.update(spotifyCredentials)
        .set({ refreshToken, accessToken: accessToken ?? null, expiresAt: expiresAt ?? null })
        .where(eq(spotifyCredentials.id, existing.id));
    } else {
      await db.insert(spotifyCredentials)
        .values({ refreshToken, accessToken: accessToken ?? null, expiresAt: expiresAt ?? null });
    }
  }
}

export const storage = new MemStorage();
