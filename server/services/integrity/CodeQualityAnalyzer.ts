import { FileIssue } from '../IntegrityControlService';

export class CodeQualityAnalyzer {
  static analyzeCodeQuality(content: string, filePath: string): FileIssue[] {
    const issues: FileIssue[] = [];
    const lines = content.split('\n');

    // TODO/FIXME Comments - exclude documentation and planned improvements
    const todoMatches = content.match(/\/\/\s*(TODO|FIXME).*/gi);
    if (todoMatches) {
      todoMatches.forEach(match => {
        const lineIndex = lines.findIndex(line => line.includes(match));
        const matchingLine = lineIndex >= 0 ? lines[lineIndex] : '';
        
        // Skip documentation TODOs and planned improvements that are not critical
        if (matchingLine.includes('// TODO: Future enhancement') ||
            matchingLine.includes('// TODO: Consider') ||
            matchingLine.includes('// TODO: Optimization') ||
            matchingLine.includes('// TODO: Documentation') ||
            matchingLine.includes('when') ||
            matchingLine.includes('Future') ||
            matchingLine.includes('Enhancement') ||
            filePath.includes('README') ||
            filePath.includes('docs/')) {
          return;
        }
        
        issues.push({
          type: 'warning',
          line: lineIndex + 1,
          description: 'Pending implementation or known issue',
          problemFound: match.trim(),
          correctionPrompt: `Complete a implementação pendente no arquivo ${filePath} linha ${lineIndex + 1}: "${match.trim()}". Implemente a funcionalidade necessária e remova o comentário TODO/FIXME.`
        });
      });
    }

    // Excessive 'any' type usage - with improved filtering to exclude safe patterns
    const anyMatches = content.match(/:\s*any(?!\w)/g);
    const filteredAnyMatches = anyMatches?.filter(match => {
      const matchIndex = content.indexOf(match);
      const context = content.substring(matchIndex - 50, matchIndex + 50);
      
      // Skip safe patterns: error handling, third-party types, test files
      return !context.includes('error: unknown') && 
             !context.includes('catch (error:') &&
             !context.includes('params: any[]') &&
             !context.includes('args: any[]') &&
             !context.includes('Record<string, unknown>') &&
             !context.includes('// Legacy') &&
             !context.includes('// Third-party') &&
             !filePath.includes('test') &&
             !filePath.includes('.d.ts');
    });
    
    // Only report if there are significant 'any' usage (more than 5 occurrences)
    if (filteredAnyMatches && filteredAnyMatches.length > 5) {
      issues.push({
        type: 'warning',
        description: `Excessive use of 'any' type (${filteredAnyMatches.length} occurrences)`,
        problemFound: 'Type safety compromised',
        correctionPrompt: `Replace 'any' types with specific TypeScript types in ${filePath}. Use proper interfaces, union types, or generic constraints instead of 'any'.`
      });
    }

    // Console.log in production code - exclude legitimate development logs and structured logging
    const consoleMatches = content.match(/console\.(log|debug|info|warn|error)/g);
    if (consoleMatches) {
      consoleMatches.forEach(match => {
        const lineIndex = lines.findIndex(line => line.includes(match));
        const matchingLine = lineIndex >= 0 ? lines[lineIndex] : '';
        
        // Skip legitimate console usage: development checks, error handling, structured logging
        if (matchingLine.includes('NODE_ENV === \'development\'') ||
            matchingLine.includes('process.env.NODE_ENV') ||
            matchingLine.includes('DEBUG') ||
            matchingLine.includes('console.info(') ||
            matchingLine.includes('console.error(') ||
            filePath.includes('logger') ||
            filePath.includes('development') ||
            filePath.includes('test')) {
          return;
        }
        
        issues.push({
          type: 'warning',
          line: lineIndex + 1,
          description: 'Console statement in production code',
          problemFound: match,
          correctionPrompt: `Replace console.${match.split('.')[1]} with proper logging system in ${filePath} linha ${lineIndex + 1}. Use winston, pino, or remove if not needed.`
        });
      });
    }

    // Large file warning
    if (lines.length > 500) {
      issues.push({
        type: 'warning',
        description: `Large file (${lines.length} lines)`,
        problemFound: 'File too large for maintainability',
        correctionPrompt: `Break down large file ${filePath} (${lines.length} lines) into smaller, focused modules. Extract classes, functions, or create separate files for different concerns.`
      });
    }

    // Hardcoded values detection
    const hardcodedPatterns = [
      { pattern: /https?:\/\/[^'"`\s]+/g, issue: 'Hardcoded URL' },
      { pattern: /:\s*\d{4,5}(?!\d)/g, issue: 'Hardcoded port' },
      { pattern: /localhost|127\.0\.0\.1/g, issue: 'Hardcoded localhost' }
    ];

    hardcodedPatterns.forEach(({ pattern, issue }) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'warning',
          line: lineNumber,
          description: `Hardcoded value: ${issue}`,
          problemFound: match[0],
          correctionPrompt: `Move hardcoded value to environment variable in ${filePath} line ${lineNumber}. Replace "${match[0]}" with process.env.VARIABLE_NAME.`
        });
      }
    });

    return issues;
  }

  static analyzeCleanArchitecture(content: string, filePath: string): FileIssue[] {
    const issues: FileIssue[] = [];

    // Check for dependency rule violations
    const violations = [
      { 
        pattern: /import.*from.*drizzle/g,
        context: 'domain/entities',
        issue: 'Domain entity importing infrastructure dependency'
      },
      {
        pattern: /import.*bcrypt/g,
        context: 'domain/entities',
        issue: 'Domain entity importing external crypto library'
      },
      {
        pattern: /import.*express/g,
        context: 'domain/',
        issue: 'Domain layer importing web framework'
      }
    ];

    violations.forEach(({ pattern, context, issue }) => {
      if (filePath.includes(context) && pattern.test(content)) {
        const lines = content.split('\n');
        const violationLine = lines.findIndex(line => pattern.test(line)) + 1;
        issues.push({
          type: 'error',
          line: violationLine,
          description: `Clean Architecture violation: ${issue}`,
          problemFound: issue,
          correctionPrompt: `Fix dependency rule violation in ${filePath} line ${violationLine}. ${issue}. Use dependency injection or move logic to appropriate layer.`
        });
      }
    });

    return issues;
  }
}