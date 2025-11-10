import { db } from "./db";
import { profileImages } from "@shared/schema";
import { eq, lt } from "drizzle-orm";

export class ImageStorage {
  /**
   * Save a base64 image to database and return the image ID
   */
  async saveImage(base64Data: string, mimeType: string = 'image/png'): Promise<string> {
    const result = await db
      .insert(profileImages)
      .values({
        imageData: base64Data,
        mimeType: mimeType,
      })
      .returning({ id: profileImages.id });

    const imageId = result[0].id;
    const dataSize = Buffer.from(base64Data, 'base64').length;
    console.log(`Saved profile image to DB: ${imageId} (${dataSize} bytes)`);

    return imageId;
  }

  /**
   * Get image data from database
   */
  async getImage(imageId: string): Promise<{ data: string; mimeType: string } | null> {
    const result = await db
      .select({
        imageData: profileImages.imageData,
        mimeType: profileImages.mimeType,
      })
      .from(profileImages)
      .where(eq(profileImages.id, imageId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      data: result[0].imageData,
      mimeType: result[0].mimeType,
    };
  }

  /**
   * Check if an image exists in database
   */
  async imageExists(imageId: string): Promise<boolean> {
    const result = await db
      .select({ id: profileImages.id })
      .from(profileImages)
      .where(eq(profileImages.id, imageId))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Delete an image from database
   */
  async deleteImage(imageId: string): Promise<void> {
    await db
      .delete(profileImages)
      .where(eq(profileImages.id, imageId));

    console.log(`Deleted profile image from DB: ${imageId}`);
  }

  /**
   * Clean up old images from database (older than specified days)
   */
  async cleanupOldImages(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db
      .delete(profileImages)
      .where(lt(profileImages.createdAt, cutoffDate))
      .returning({ id: profileImages.id });

    if (result.length > 0) {
      console.log(`Cleaned up ${result.length} old profile images from DB`);
    }
  }
}

export const imageStorage = new ImageStorage();

// Run cleanup on startup (async)
imageStorage.cleanupOldImages(7).catch(err =>
  console.error('Failed to cleanup old images:', err)
);
