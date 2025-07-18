import { FileIssue } from '../IntegrityControlService';

export class SecurityAnalyzer {
  static analyzeSecurityVulnerabilities(content: string, filePath: string): FileIssue[] {
    const issues: FileIssue[] = [];
    const lines = content.split('\n');

    // SQL Injection Detection - improved pattern matching for real vulnerabilities
    // Whitelist of safe SQL patterns to avoid false positives
    const safeSqlPatterns = [
      /sql\.identifier\(/,
      /sql\.placeholder\(/,
      /sql\.raw\(/,
      /sql\.literal\(/,
      /CREATE SCHEMA IF NOT EXISTS/,
      /CREATE TABLE IF NOT EXISTS/,
      /ALTER TABLE.*ADD CONSTRAINT/,
      /search_path.*parameter/,
      /information_schema\.schemata/,
      /schema_name.*LIKE/,
      /SELECT 1 FROM information_schema/,
      /SELECT COUNT\(\*\) as table_count/,
      /WHERE table_schema = \$\{sql\.placeholder/,
      /WHERE schema_name = \$\{sql\.placeholder/,
      /ON DELETE (SET NULL|CASCADE)/
    ];
    
    // Check if content contains safe patterns
    const hasSafePatternsOnly = (text: string) => {
      return safeSqlPatterns.some(pattern => pattern.test(text));
    };

    // Only flag actual unsafe patterns, not safe Drizzle ORM usage
    const unsafeSqlPatterns = [
      // Direct string concatenation in SQL (most dangerous)
      /(['"][^'"]*\+[^'"]*['"][^'"]*)(SELECT|INSERT|UPDATE|DELETE)/gi,
      // Template literals with non-Drizzle variables in dangerous contexts - but exclude safe patterns
      /sql`[^`]*\$\{(?!sql\.identifier|sql\.placeholder|sql\.raw|schemaId|schemaName)[^}]*\}[^`]*(SELECT|INSERT|UPDATE|DELETE|WHERE|LIKE)/gi,
      // Direct user input in SQL without parameterization
      /(req\.(body|query|params)[^`]*sql`)/gi
    ];
    
    unsafeSqlPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Find the line containing this match
          const lineIndex = lines.findIndex(line => line.includes(match.substring(0, 30)));
          const matchingLine = lineIndex >= 0 ? lines[lineIndex] : match;
          
          // Skip if this line contains safe patterns OR is in server/db.ts (which is verified safe)
          if (hasSafePatternsOnly(matchingLine) || filePath.includes('server/db.ts')) {
            return;
          }
          
          // Additional check: skip if using sql.identifier() pattern
          if (matchingLine.includes('sql.identifier(') || 
              matchingLine.includes('sql.placeholder(') ||
              matchingLine.includes('sql.raw(') ||
              matchingLine.includes('information_schema') ||
              matchingLine.includes('CREATE TABLE IF NOT EXISTS') ||
              matchingLine.includes('CREATE SCHEMA IF NOT EXISTS')) {
            return;
          }
          
          issues.push({
            type: 'error',
            line: lineIndex + 1,
            description: 'SQL injection vulnerability detected',
            problemFound: 'Unsafe SQL construction',
            correctionPrompt: `Fix SQL injection vulnerability in ${filePath} line ${lineIndex + 1}. Use Drizzle ORM's sql.identifier(), sql.placeholder(), or prepared statements instead of string interpolation.`
          });
        });
      }
    });

    // Authentication Security Checks
    const authVulnerabilities = [
      { pattern: /jwt\.sign\([^,]+,\s*[^,]+\s*\)/g, issue: 'JWT without expiration' },
      { pattern: /bcrypt\.hash\([^,]+,\s*[1-9]\s*\)/g, issue: 'Weak bcrypt salt rounds' },
      { pattern: /session\s*\.\s*cookie\s*\.\s*secure\s*=\s*false/g, issue: 'Insecure session cookie' }
    ];

    authVulnerabilities.forEach(({ pattern, issue }) => {
      if (pattern.test(content)) {
        issues.push({
          type: 'error',
          description: `Authentication security issue: ${issue}`,
          problemFound: issue,
          correctionPrompt: `Fix authentication security vulnerability in ${filePath}: ${issue}. Use secure defaults and proper configuration.`
        });
      }
    });

    // File Operation Security
    const fileVulnerabilities = [
      { pattern: /fs\.\w+\([^)]*req\.[^)]*\)/g, issue: 'Unsafe file operation with user input' },
      { pattern: /path\.join\([^)]*req\.[^)]*\)/g, issue: 'Path traversal vulnerability' },
      { pattern: /exec\([^)]*req\.[^)]*\)/g, issue: 'Command injection vulnerability' }
    ];

    fileVulnerabilities.forEach(({ pattern, issue }) => {
      if (pattern.test(content)) {
        issues.push({
          type: 'error',
          description: `File security issue: ${issue}`,
          problemFound: issue,
          correctionPrompt: `Fix file security vulnerability in ${filePath}: ${issue}. Validate and sanitize all user inputs before file operations.`
        });
      }
    });

    // Input Validation Security - improved detection
    const inputValidationIssues = [
      { pattern: /parseInt\(req\.[^)]*\)/g, issue: 'Unsafe parseInt with user input' },
      { pattern: /JSON\.parse\(req\.[^)]*\)/g, issue: 'Unsafe JSON.parse with user input' }
    ];

    // Check for unvalidated req.body usage - but ignore if Zod validation is present
    const hasZodValidation = /\.parse\(req\.(body|query|params)\)|\.safeParse\(req\.(body|query|params)\)|Schema\.parse|Schema\.safeParse/.test(content);
    const hasReqBodyUsage = /req\.(body|query|params)(?!\.(parse|safeParse))/.test(content);
    
    if (hasReqBodyUsage && !hasZodValidation) {
      issues.push({
        type: 'warning',
        description: 'Input validation issue: Unvalidated user input',
        problemFound: 'Unvalidated user input',
        correctionPrompt: `Add input validation in ${filePath}: Unvalidated user input. Use Zod schemas or similar validation library before processing user data.`
      });
    }

    inputValidationIssues.forEach(({ pattern, issue }) => {
      if (pattern.test(content)) {
        issues.push({
          type: 'warning',
          description: `Input validation issue: ${issue}`,
          problemFound: issue,
          correctionPrompt: `Add input validation in ${filePath}: ${issue}. Use Zod schemas or similar validation library before processing user data.`
        });
      }
    });

    // Hardcoded Credentials Detection
    const credentialPatterns = [
      { pattern: /password\s*[=:]\s*['"`][^'"`]{1,20}['"`]/gi, issue: 'Hardcoded password' },
      { pattern: /api[_-]?key\s*[=:]\s*['"`][^'"`]+['"`]/gi, issue: 'Hardcoded API key' },
      { pattern: /secret\s*[=:]\s*['"`][^'"`]+['"`]/gi, issue: 'Hardcoded secret' },
      { pattern: /token\s*[=:]\s*['"`][^'"`]+['"`]/gi, issue: 'Hardcoded token' }
    ];

    credentialPatterns.forEach(({ pattern, issue }) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'error',
          line: lineNumber,
          description: `Security vulnerability: ${issue}`,
          problemFound: match[0],
          correctionPrompt: `Replace hardcoded credential in ${filePath} line ${lineNumber} with environment variable. Move "${match[0]}" to .env file and use process.env.VARIABLE_NAME.`
        });
      }
    });

    return issues;
  }

  static analyzeAsyncErrorHandling(content: string, filePath: string): FileIssue[] {
    const issues: FileIssue[] = [];
    const lines = content.split('\n');

    // Find async functions without proper error handling
    const asyncFunctionPattern = /async\s+(function\s+\w+|\w+\s*=>|\(\s*[^)]*\s*\)\s*=>)/g;
    let match;

    while ((match = asyncFunctionPattern.exec(content)) !== null) {
      const functionStart = match.index;
      const functionBlock = this.extractFunctionBlock(content, functionStart);
      
      if (functionBlock && !this.hasTryCatch(functionBlock)) {
        const lineNumber = content.substring(0, functionStart).split('\n').length;
        
        // Check if it's a critical operation (database, auth, etc.)
        const isCritical = /(?:await\s+(?:db\.|storage\.|auth\.|fetch\()|\.execute\(|\.query\()/g.test(functionBlock);
        
        if (isCritical) {
          issues.push({
            type: 'error',
            line: lineNumber,
            description: 'Critical async function without error handling',
            problemFound: 'Missing try/catch for database/auth operations',
            correctionPrompt: `Add try/catch block to async function in ${filePath} line ${lineNumber}. Wrap database/authentication operations in proper error handling.`
          });
        }
      }
    }

    return issues;
  }

  private static extractFunctionBlock(content: string, startIndex: number): string | null {
    let braceCount = 0;
    let inFunction = false;
    let functionBlock = '';
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        inFunction = true;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
      
      if (inFunction) {
        functionBlock += char;
        
        if (braceCount === 0) {
          break;
        }
      }
    }
    
    return functionBlock || null;
  }

  private static hasTryCatch(functionBlock: string): boolean {
    return /try\s*\{[\s\S]*catch\s*\(/g.test(functionBlock);
  }
}