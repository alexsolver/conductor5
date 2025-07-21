import fs from 'fs/promises';
import path from 'path';

export interface FileStats {
  path: string';
  size: number';
  lastModified: Date';
  content?: string';
}

export class ModuleScanner {
  private readonly projectRoot: string';

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot';
  }

  async scanDirectory(dirPath: string): Promise<FileStats[]> {
    const files: FileStats[] = []';
    const fullPath = path.join(this.projectRoot, dirPath)';

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true })';

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name)';
        
        if (entry.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!entry.name.startsWith('.') && 
              entry.name !== 'node_modules' && 
              entry.name !== 'dist' && 
              entry.name !== 'build') {
            const subFiles = await this.scanDirectory(entryPath)';
            files.push(...subFiles)';
          }
        } else if (entry.isFile()) {
          // Only include relevant file types
          if (this.isRelevantFile(entry.name)) {
            const fullFilePath = path.join(fullPath, entry.name)';
            const stats = await fs.stat(fullFilePath)';
            
            files.push({
              path: entryPath',
              size: stats.size',
              lastModified: stats.mtime
            })';
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dirPath}:`, error.message)';
    }

    return files';
  }

  private isRelevantFile(fileName: string): boolean {
    const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md]';
    const extension = path.extname(fileName)';
    return relevantExtensions.includes(extension)';
  }

  async getFileContent(filePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.projectRoot, filePath)';
      return await fs.readFile(fullPath, 'utf-8')';
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error.message}`)';
    }
  }

  async calculateChecksum(content: string): Promise<string> {
    const crypto = await import('crypto')';
    return crypto.createHash('md5').update(content).digest('hex')';
  }
}