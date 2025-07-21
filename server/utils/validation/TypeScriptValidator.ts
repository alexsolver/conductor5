/**
 * TypeScript Validation Service
 * Validates TypeScript syntax and imports/exports
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  filePath: string;
}

export interface ProjectValidationResult {
  isValid: boolean;
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  results: ValidationResult[];
}

export class TypeScriptValidator {
  private projectRoot: string;
  private tsConfigPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  }

  /**
   * Validate TypeScript syntax for a single file
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Run TypeScript compiler on specific file
      const command = `npx tsc --noEmit --skipLibCheck ${filePath}`;
      const { stdout, stderr } = await execAsync(command, { cwd: this.projectRoot });
      
      const errors = this.parseTypescriptOutput(stderr);
      const warnings = this.parseTypescriptWarnings(stdout);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        filePath
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        filePath
      };
    }
  }

  /**
   * Validate all TypeScript files in project
   */
  async validateProject(): Promise<ProjectValidationResult> {
    try {
      const files = await this.findTypeScriptFiles();
      const results: ValidationResult[] = [];
      
      for (const file of files) {
        const result = await this.validateFile(file);
        results.push(result);
      }
      
      const validFiles = results.filter(r => r.isValid).length;
      const invalidFiles = results.filter(r => !r.isValid).length;
      
      return {
        isValid: invalidFiles === 0,
        totalFiles: files.length,
        validFiles,
        invalidFiles,
        results
      };
    } catch (error) {
      return {
        isValid: false,
        totalFiles: 0,
        validFiles: 0,
        invalidFiles: 0,
        results: []
      };
    }
  }

  /**
   * Check for broken imports/exports
   */
  async validateImports(): Promise<ValidationResult[]> {
    try {
      const command = `npx tsc --noEmit --skipLibCheck`;
      const { stderr } = await execAsync(command, { cwd: this.projectRoot });
      
      const importErrors = this.parseImportErrors(stderr);
      
      return importErrors.map(error => ({
        isValid: false,
        errors: [error.message],
        warnings: [],
        filePath: error.filePath
      }));
    } catch (error) {
      return [{
        isValid: false,
        errors: [`Import validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        filePath: 'unknown'
      }];
    }
  }

  /**
   * Scan critical files for issues
   */
  async scanCriticalFiles(): Promise<ValidationResult[]> {
    const criticalFiles = [
      'server/index.ts',
      'server/routes.ts',
      'server/storage.ts',
      'server/db.ts',
      'client/src/App.tsx',
      'client/src/main.tsx',
      'shared/schema.ts'
    ];
    
    const results: ValidationResult[] = [];
    
    for (const file of criticalFiles) {
      const fullPath = path.join(this.projectRoot, file);
      try {
        await fs.access(fullPath);
        const result = await this.validateFile(fullPath);
        results.push(result);
      } catch (error) {
        results.push({
          isValid: false,
          errors: [`Critical file missing: ${file}`],
          warnings: [],
          filePath: file
        });
      }
    }
    
    return results;
  }

  /**
   * Find all TypeScript files in project
   */
  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const searchDirs = [
      path.join(this.projectRoot, 'server'),
      path.join(this.projectRoot, 'client/src'),
      path.join(this.projectRoot, 'shared')
    ];
    
    for (const dir of searchDirs) {
      try {
        const dirFiles = await this.findFilesRecursive(dir, /\.(ts|tsx)$/);
        files.push(...dirFiles);
      } catch (error) {
        // Directory doesn't exist or is not accessible
      }
    }
    
    return files;
  }

  /**
   * Find files recursively
   */
  private async findFilesRecursive(dir: string, pattern: RegExp): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findFilesRecursive(fullPath, pattern);
          files.push(...subFiles);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory not accessible
    }
    
    return files;
  }

  /**
   * Parse TypeScript compiler output for errors
   */
  private parseTypescriptOutput(output: string): string[] {
    if (!output || output.trim() === ') return [];
    
    const lines = output.split('\n');
    const errors: string[] = [];
    
    for (const line of lines) {
      if (line.includes('error TS')) {
        errors.push(line.trim());
      }
    }
    
    return errors;
  }

  /**
   * Parse TypeScript compiler output for warnings
   */
  private parseTypescriptWarnings(output: string): string[] {
    if (!output || output.trim() === ') return [];
    
    const lines = output.split('\n');
    const warnings: string[] = [];
    
    for (const line of lines) {
      if (line.includes('warning') || line.includes('deprecated')) {
        warnings.push(line.trim());
      }
    }
    
    return warnings;
  }

  /**
   * Parse import/export errors
   */
  private parseImportErrors(output: string): { filePath: string; message: string }[] {
    if (!output || output.trim() === ') return [];
    
    const lines = output.split('\n');
    const errors: { filePath: string; message: string }[] = [];
    
    for (const line of lines) {
      if (line.includes("Cannot find module") || line.includes("Module not found")) {
        const match = line.match(/^(.+?)\(\d+,\d+\): (.+)$/);
        if (match) {
          errors.push({
            filePath: match[1],
            message: match[2]
          });
        }
      }
    }
    
    return errors;
  }
}

export const typescriptValidator = new TypeScriptValidator();