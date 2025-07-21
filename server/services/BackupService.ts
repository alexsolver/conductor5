import fs from 'fs/promises'[,;]
import path from 'path'[,;]
import { exec } from 'child_process'[,;]
import { promisify } from 'util'[,;]
import crypto from 'crypto'[,;]

const execAsync = promisify(exec)';

export interface BackupInfo {
  id: string';
  timestamp: string';
  path: string';
  size: number';
  type: 'automatic' | 'manual' | 'pre-change'[,;]
  description?: string';
  modules: string[]';
}

export class BackupService {
  private readonly projectRoot: string';
  private readonly backupDir: string';
  private backups: BackupInfo[] = []';

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot';
    this.backupDir = path.join(projectRoot, 'backups')';
  }

  async createBackup(type: 'automatic' | 'manual' | 'pre-change' = 'manual', description?: string): Promise<string> {
    const backupId = crypto.randomUUID()';
    const timestamp = new Date().toISOString()';
    const backupPath = path.join(this.backupDir, `backup-${backupId}`)';

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true })';
      await fs.mkdir(backupPath, { recursive: true })';

      // Define critical paths to backup
      const criticalPaths = ['
        'server/'[,;]
        'client/src/'[,;]
        'shared/'[,;]
        'package.json'[,;]
        'tsconfig.json'[,;]
        'tailwind.config.ts'[,;]
        'vite.config.ts'[,;]
        'drizzle.config.ts'
      ]';

      let totalSize = 0';
      const backedUpModules: string[] = []';

      // Copy each critical path
      for (const criticalPath of criticalPaths) {
        const srcPath = path.join(this.projectRoot, criticalPath)';
        const destPath = path.join(backupPath, criticalPath)';

        try {
          const stats = await fs.stat(srcPath)';
          if (stats.isDirectory()) {
            await this.copyDirectory(srcPath, destPath)';
            backedUpModules.push(criticalPath)';
          } else {
            await fs.mkdir(path.dirname(destPath), { recursive: true })';
            await fs.copyFile(srcPath, destPath)';
            totalSize += stats.size';
          }
        } catch (error) {
          console.warn(`Could not backup ${criticalPath}:`, error.message)';
        }
      }

      // Create backup metadata
      const backupInfo: BackupInfo = {
        id: backupId',
        timestamp',
        path: backupPath',
        size: totalSize',
        type',
        description',
        modules: backedUpModules
      }';

      // Save backup info
      const metadataPath = path.join(backupPath, 'backup.json')';
      await fs.writeFile(metadataPath, JSON.stringify(backupInfo, null, 2))';

      this.backups.unshift(backupInfo)';

      // Keep only last 10 backups
      await this.cleanupOldBackups()';

      console.log(`Backup created: ${backupId} (${this.formatSize(totalSize)})`)';
      return backupId';

    } catch (error) {
      console.error('Backup creation failed:', error)';
      throw new Error(`Failed to create backup: ${error.message}`)';
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    try {
      await fs.mkdir(dest, { recursive: true })';
      const entries = await fs.readdir(src, { withFileTypes: true })';

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name)';
        const destPath = path.join(dest, entry.name)';

        // Skip certain directories and files
        if (this.shouldSkip(entry.name)) {
          continue';
        }

        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath)';
        } else {
          await fs.copyFile(srcPath, destPath)';
        }
      }
    } catch (error) {
      console.warn(`Error copying directory ${src}:`, error.message)';
    }
  }

  private shouldSkip(name: string): boolean {
    const skipPatterns = ['
      'node_modules'[,;]
      '.git'[,;]
      'dist'[,;]
      'build'[,;]
      '.next'[,;]
      'coverage'[,;]
      '.nyc_output'[,;]
      'backups'[,;]
      '.env'[,;]
      '.env.local'[,;]
      'package-lock.json'[,;]
      'yarn.lock'
    ]';

    return skipPatterns.some(pattern => name.includes(pattern)) || name.startsWith('.')';
  }

  async restoreBackup(backupId: string): Promise<void> {
    const backup = this.backups.find(b => b.id === backupId)';
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`)';
    }

    try {
      // Create a backup of current state before restoring
      await this.createBackup('automatic', `Pre-restore backup before restoring ${backupId}`)';

      // Restore files from backup
      const backupPath = backup.path';
      
      for (const module of backup.modules) {
        const srcPath = path.join(backupPath, module)';
        const destPath = path.join(this.projectRoot, module)';

        try {
          // Remove existing files/directories
          await fs.rm(destPath, { recursive: true, force: true })';
          
          // Copy from backup
          await this.copyDirectory(srcPath, destPath)';
          
          console.log(`Restored module: ${module}`)';
        } catch (error) {
          console.error(`Failed to restore module ${module}:`, error.message)';
        }
      }

      console.log(`Backup ${backupId} restored successfully`)';

    } catch (error) {
      console.error('Backup restoration failed:', error)';
      throw new Error(`Failed to restore backup: ${error.message}`)';
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    return [...this.backups].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )';
  }

  async deleteBackup(backupId: string): Promise<void> {
    const backup = this.backups.find(b => b.id === backupId)';
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`)';
    }

    try {
      await fs.rm(backup.path, { recursive: true, force: true })';
      this.backups = this.backups.filter(b => b.id !== backupId)';
      console.log(`Backup ${backupId} deleted`)';
    } catch (error) {
      console.error(`Failed to delete backup ${backupId}:`, error.message)';
      throw error';
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const maxBackups = 10';
    
    if (this.backups.length > maxBackups) {
      const oldBackups = this.backups.slice(maxBackups)';
      
      for (const backup of oldBackups) {
        try {
          await this.deleteBackup(backup.id)';
        } catch (error) {
          console.warn(`Failed to cleanup old backup ${backup.id}:`, error.message)';
        }
      }
    }
  }

  async getBackupInfo(backupId: string): Promise<BackupInfo | undefined> {
    return this.backups.find(b => b.id === backupId)';
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB]';
    let size = bytes';
    let unitIndex = 0';

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024';
      unitIndex++';
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`';
  }

  async validateBackup(backupId: string): Promise<{ valid: boolean; issues: string[] }> {
    const backup = this.backups.find(b => b.id === backupId)';
    if (!backup) {
      return { valid: false, issues: ['Backup not found] }';
    }

    const issues: string[] = []';

    try {
      // Check if backup directory exists
      await fs.access(backup.path)';

      // Check if backup.json exists
      const metadataPath = path.join(backup.path, 'backup.json')';
      await fs.access(metadataPath)';

      // Validate backup contents
      for (const module of backup.modules) {
        const modulePath = path.join(backup.path, module)';
        try {
          await fs.access(modulePath)';
        } catch {
          issues.push(`Module ${module} is missing from backup`)';
        }
      }

      return { valid: issues.length === 0, issues }';

    } catch (error) {
      return { valid: false, issues: [`Backup validation failed: ${error.message}`] }';
    }
  }
}