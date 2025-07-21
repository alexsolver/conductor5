/**
 * Temporary Files Cleaner
 * Manages cleanup of temporary files and directories
 */

import * as fs from 'fs';
import * as path from 'path';
import { logInfo, logError, logWarn } from './logger';

export interface CleanupConfig {
  tempDirectory: string;
  maxAgeHours: number;
  filePatterns?: string[];
  excludePatterns?: string[];
  dryRun?: boolean;
}

export class TemporaryFilesCleaner {
  private static instance: TemporaryFilesCleaner;
  private config: CleanupConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor(config: CleanupConfig) {
    this.config = {
      tempDirectory: config.tempDirectory || '/tmp',
      maxAgeHours: config.maxAgeHours || 24,
      filePatterns: config.filePatterns || ['*'],
      excludePatterns: config.excludePatterns || [],
      dryRun: config.dryRun || false
    };
  }

  public static getInstance(config?: CleanupConfig): TemporaryFilesCleaner {
    if (!TemporaryFilesCleaner.instance) {
      if (!config) {
        throw new Error('TemporaryFilesCleaner requires initial configuration');
      }
      TemporaryFilesCleaner.instance = new TemporaryFilesCleaner(config);
    }
    return TemporaryFilesCleaner.instance;
  }

  /**
   * Start automatic cleanup with specified interval
   */
  public startAutomaticCleanup(intervalHours: number = 6): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.cleanupInterval = setInterval(() => {
      this.cleanupFiles().catch(error => {
        logError('Scheduled cleanup failed', error);
      });
    }, intervalMs);

    logInfo('Automatic cleanup started', {
      intervalHours,
      maxAgeHours: this.config.maxAgeHours,
      tempDirectory: this.config.tempDirectory
    });
  }

  /**
   * Stop automatic cleanup
   */
  public stopAutomaticCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logInfo('Automatic cleanup stopped');
    }
  }

  /**
   * Perform cleanup of temporary files
   */
  public async cleanupFiles(): Promise<{
    filesProcessed: number;
    filesDeleted: number;
    directoriesDeleted: number;
    errors: number;
    spaceFreed: number;
  }> {
    const stats = {
      filesProcessed: 0,
      filesDeleted: 0,
      directoriesDeleted: 0,
      errors: 0,
      spaceFreed: 0
    };

    try {
      logInfo('Starting temporary files cleanup', {
        directory: this.config.tempDirectory,
        maxAgeHours: this.config.maxAgeHours,
        dryRun: this.config.dryRun
      });

      if (!fs.existsSync(this.config.tempDirectory)) {
        logWarn('Temporary directory does not exist', { directory: this.config.tempDirectory });
        return stats;
      }

      await this.processDirectory(this.config.tempDirectory, stats);

      logInfo('Cleanup completed', stats);
      return stats;
    } catch (error) {
      logError('Error during cleanup', error);
      stats.errors++;
      return stats;
    }
  }

  /**
   * Process directory recursively
   */
  private async processDirectory(dirPath: string, stats: any): Promise<void> {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const cutoffTime = Date.now() - (this.config.maxAgeHours * 60 * 60 * 1000);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        stats.filesProcessed++;

        try {
          if (this.shouldExclude(entry.name)) {
            continue;
          }

          const stat = fs.statSync(fullPath);
          const isOld = stat.mtime.getTime() < cutoffTime;

          if (entry.isDirectory()) {
            // Process subdirectory first
            await this.processDirectory(fullPath, stats);
            
            // Try to remove directory if it's empty and old
            if (isOld) {
              try {
                const isEmpty = fs.readdirSync(fullPath).length === 0;
                if (isEmpty) {
                  if (!this.config.dryRun) {
                    fs.rmdirSync(fullPath);
                  }
                  stats.directoriesDeleted++;
                  logInfo('Deleted empty directory', { path: fullPath, dryRun: this.config.dryRun });
                }
              } catch (error) {
                // Directory not empty or permission error
              }
            }
          } else if (entry.isFile()) {
            if (isOld && this.shouldCleanFile(entry.name)) {
              const fileSize = stat.size;
              if (!this.config.dryRun) {
                fs.unlinkSync(fullPath);
              }
              stats.filesDeleted++;
              stats.spaceFreed += fileSize;
              logInfo('Deleted file', { 
                path: fullPath, 
                size: fileSize, 
                age: Math.round((Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60)),
                dryRun: this.config.dryRun 
              });
            }
          }
        } catch (error) {
          logError('Error processing file/directory', { path: fullPath, error });
          stats.errors++;
        }
      }
    } catch (error) {
      logError('Error reading directory', { path: dirPath, error });
      stats.errors++;
    }
  }

  /**
   * Check if file should be excluded from cleanup
   */
  private shouldExclude(filename: string): boolean {
    if (!this.config.excludePatterns) {
      return false;
    }

    return this.config.excludePatterns.some(pattern => {
      return this.matchesPattern(filename, pattern);
    });
  }

  /**
   * Check if file should be cleaned based on patterns
   */
  private shouldCleanFile(filename: string): boolean {
    if (!this.config.filePatterns) {
      return true;
    }

    return this.config.filePatterns.some(pattern => {
      return this.matchesPattern(filename, pattern);
    });
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    if (pattern === '*') {
      return true;
    }

    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filename);
  }

  /**
   * Get cleanup statistics without performing cleanup
   */
  public async getCleanupPreview(): Promise<{
    totalFiles: number;
    filesToDelete: number;
    totalSize: number;
    sizeToFree: number;
    oldestFile: { path: string; age: number } | null;
    newestFile: { path: string; age: number } | null;
  }> {
    const preview = {
      totalFiles: 0,
      filesToDelete: 0,
      totalSize: 0,
      sizeToFree: 0,
      oldestFile: null as { path: string; age: number } | null,
      newestFile: null as { path: string; age: number } | null
    };

    try {
      await this.previewDirectory(this.config.tempDirectory, preview);
    } catch (error) {
      logError('Error generating cleanup preview', error);
    }

    return preview;
  }

  /**
   * Preview directory for cleanup statistics
   */
  private async previewDirectory(dirPath: string, preview: any): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const cutoffTime = Date.now() - (this.config.maxAgeHours * 60 * 60 * 1000);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        try {
          if (this.shouldExclude(entry.name)) {
            continue;
          }

          if (entry.isDirectory()) {
            await this.previewDirectory(fullPath, preview);
          } else if (entry.isFile()) {
            const stat = fs.statSync(fullPath);
            const age = Math.round((Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60));
            
            preview.totalFiles++;
            preview.totalSize += stat.size;

            // Track oldest and newest files
            if (!preview.oldestFile || age > preview.oldestFile.age) {
              preview.oldestFile = { path: fullPath, age };
            }
            if (!preview.newestFile || age < preview.newestFile.age) {
              preview.newestFile = { path: fullPath, age };
            }

            // Check if file would be deleted
            const isOld = stat.mtime.getTime() < cutoffTime;
            if (isOld && this.shouldCleanFile(entry.name)) {
              preview.filesToDelete++;
              preview.sizeToFree += stat.size;
            }
          }
        } catch (error) {
          logError('Error previewing file', { path: fullPath, error });
        }
      }
    } catch (error) {
      logError('Error previewing directory', { path: dirPath, error });
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logInfo('Cleanup configuration updated', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): CleanupConfig {
    return { ...this.config };
  }

  /**
   * Clean up specific file or directory
   */
  public async cleanupPath(targetPath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(targetPath)) {
        logWarn('Path does not exist', { path: targetPath });
        return false;
      }

      const stat = fs.statSync(targetPath);
      
      if (stat.isFile()) {
        if (!this.config.dryRun) {
          fs.unlinkSync(targetPath);
        }
        logInfo('Deleted file', { path: targetPath, size: stat.size, dryRun: this.config.dryRun });
        return true;
      } else if (stat.isDirectory()) {
        if (!this.config.dryRun) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
        logInfo('Deleted directory', { path: targetPath, dryRun: this.config.dryRun });
        return true;
      }

      return false;
    } catch (error) {
      logError('Error cleaning up path', { path: targetPath, error });
      return false;
    }
  }
}

// Export convenience functions
export function initializeTemporaryFilesCleaner(config: CleanupConfig): TemporaryFilesCleaner {
  return TemporaryFilesCleaner.getInstance(config);
}

export function getTemporaryFilesCleaner(): TemporaryFilesCleaner | null {
  try {
    return TemporaryFilesCleaner.getInstance();
  } catch {
    return null;
  }
}