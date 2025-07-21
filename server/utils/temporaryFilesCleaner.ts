/**
 * CRITICAL FIX: Temporary Files Cleaner
 * Removes temporary files that can cause watch instability
 */

import fs from 'fs';
import path from 'path';

const TEMP_FILE_PATTERNS = [
  /\.tmp$/,
  /\.temp$/,
  /~$/,
  /\.swp$/,
  /\.swo$/,
  /\.log$/,
  /\.cache$/,
  /node_modules\/\.cache/,
  /\.vite/,
  /dist\//,
];

const TEMP_DIRECTORIES = [
  'node_modules/.cache',
  'node_modules/.vite',
  'dist',
  '.cache',
  'temp',
  'tmp'
];

/**
 * CRITICAL: Clean temporary files that cause watch instability
 */
export async function cleanTemporaryFiles(): Promise<number> {
  let cleanedCount = 0;
  const rootDir = process.cwd();

  try {
    // Clean temporary directories
    for (const dirName of TEMP_DIRECTORIES) {
      const dirPath = path.join(rootDir, dirName);
      if (fs.existsSync(dirPath)) {
        try {
          await fs.promises.rm(dirPath, { recursive: true, force: true });
          cleanedCount++;
        } catch (error) {
          // Silent ignore - directory might be in use
        }
      }
    }

    // Clean temporary files in root directory
    const files = await fs.promises.readdir(rootDir);
    for (const file of files) {
      const filePath = path.join(rootDir, file);
      const stats = await fs.promises.stat(filePath).catch(() => null);
      
      if (stats?.isFile()) {
        const shouldDelete = TEMP_FILE_PATTERNS.some(pattern => pattern.test(file));
        if (shouldDelete) {
          try {
            await fs.promises.unlink(filePath);
            cleanedCount++;
          } catch (error) {
            // Silent ignore - file might be in use
          }
        }
      }
    }

    return cleanedCount;
  } catch (error) {
    console.warn('[Cleanup Warning]', error);
    return cleanedCount;
  }
}

/**
 * CRITICAL: Initialize cleanup on startup
 */
export async function initializeCleanup(): Promise<void> {
  try {
    const cleaned = await cleanTemporaryFiles();
    if (cleaned > 0) {
      console.log(`[Cleanup] Removed ${cleaned} temporary files for stability`);
    }
  } catch (error) {
    console.warn('[Cleanup Warning]', error);
  }
}