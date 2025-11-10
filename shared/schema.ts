import { sql } from "drizzle-orm";
import { pgTable, text, varchar, bigint, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const playerProfiles = pgTable("player_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayName: text("display_name").notNull(),
  avatarColor: varchar("avatar_color", { length: 7 }).notNull().default('#8B5CF6'),
  artistName: text("artist_name"),
  musicStyle: text("music_style"),
  profileImage: text("profile_image"), // Base64 encoded Pixar-style generated image
  originalPhoto: text("original_photo"), // Base64 encoded uploaded photo
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
});

export const insertPlayerProfileSchema = createInsertSchema(playerProfiles).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export const updatePlayerProfileSchema = createInsertSchema(playerProfiles).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type UpdatePlayerProfile = z.infer<typeof updatePlayerProfileSchema>;
export type PlayerProfile = typeof playerProfiles.$inferSelect;

export const spotifyCredentials = pgTable("spotify_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"),
  expiresAt: bigint("expires_at", { mode: "number" }),
});

export const insertSpotifyCredentialsSchema = createInsertSchema(spotifyCredentials).omit({
  id: true,
});

export type InsertSpotifyCredentials = z.infer<typeof insertSpotifyCredentialsSchema>;
export type SpotifyCredentials = typeof spotifyCredentials.$inferSelect;

export const profileImages = pgTable("profile_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageData: text("image_data").notNull(), // Base64 encoded image
  mimeType: varchar("mime_type", { length: 50 }).notNull().default('image/png'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfileImageSchema = createInsertSchema(profileImages).omit({
  id: true,
  createdAt: true,
});

export type InsertProfileImage = z.infer<typeof insertProfileImageSchema>;
export type ProfileImage = typeof profileImages.$inferSelect;
