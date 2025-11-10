import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const IMAGES_DIR = path.join(process.cwd(), 'profile-images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('Created profile-images directory');
}

export class ImageStorage {
  /**
   * Save a base64 image to disk and return the filename
   */
  saveImage(base64Data: string, extension: string = 'png'): string {
    const filename = `${randomBytes(16).toString('hex')}.${extension}`;
    const filepath = path.join(IMAGES_DIR, filename);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filepath, buffer);

    console.log(`Saved profile image: ${filename} (${buffer.length} bytes)`);
    return filename;
  }

  /**
   * Get the full path to an image file
   */
  getImagePath(filename: string): string {
    return path.join(IMAGES_DIR, filename);
  }

  /**
   * Check if an image file exists
   */
  imageExists(filename: string): boolean {
    return fs.existsSync(this.getImagePath(filename));
  }

  /**
   * Delete an image file
   */
  deleteImage(filename: string): void {
    const filepath = this.getImagePath(filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Deleted profile image: ${filename}`);
    }
  }

  /**
   * Clean up old images (older than specified days)
   */
  cleanupOldImages(daysOld: number = 7): void {
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    const files = fs.readdirSync(IMAGES_DIR);
    let deletedCount = 0;

    for (const file of files) {
      const filepath = path.join(IMAGES_DIR, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old profile images`);
    }
  }
}

export const imageStorage = new ImageStorage();

// Run cleanup on startup
imageStorage.cleanupOldImages(7);
