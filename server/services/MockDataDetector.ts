export interface MockDataIssue {
  type: 'mock_data' | 'incomplete_function' | 'non_functional_ui''[,;]
  line: number;
  description: string;
  evidence: string;
}

export class MockDataDetector {
  static detectMockData(content: string, filePath: string): MockDataIssue[] {
    const issues: MockDataIssue[] = [];
    const lines = content.split('\n');

    // Mock data patterns - improved to reduce false positives
    const mockPatterns = [
      /john\.doe@example\.com/gi,
      /lorem ipsum/gi,
      /\[\{.*"id":\s*["']?(1|2|3)["']?.*\}\]/gi, // Array with simple IDs
      /Math\.random\(\)/g, // Random data generation
      /\.map\(\(\w+,\s*\w+\)\s*=>\s*\({.*\}\)\)/g, // Map with object generation
    ];

    // Detect incomplete functions - improved to avoid false positives
    const incompletePatterns = [
      /throw new Error\(['"`]Not implemented['"`]\)/gi,
      /console\.log\(['"`]TODO['"`]/gi,
      /return null;?\s*\/\/.*implement/gi,
      /\/\/ TODO:.*implement/gi,
      /\/\/ FIXME:.*implement/gi,
    ];

    // Detect disabled/non-functional buttons
    const buttonPatterns = [
      /disabled={true}/g,
      /onClick={() => {}}/g,
      /onClick={undefined}/g,
      /href="#"/g,
      /preventDefault\(\);?\s*\/\/.*TODO/gi,
    ];

    // Check for genuine incomplete patterns only - exclude legitimate implementations
    incompletePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '[,;]
        
        // Skip lines that are legitimate implementations
        if (lineContent.includes('return this.toDomainEntity') ||
            lineContent.includes('return results.map') ||
            lineContent.includes('fromPersistence') ||
            lineContent.includes('Domain') ||
            lineContent.includes('Entity') ||
            lineContent.includes('Repository') ||
            filePath.includes('Repository.ts')) {
          continue;
        }
        
        issues.push({
          type: 'incomplete_function''[,;]
          line: lineNumber,
          description: 'Incomplete functionality detected''[,;]
          evidence: lineContent
        });
      }
    });

    // Check for mock data patterns - exclude legitimate implementations
    mockPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '[,;]
        
        // Skip if it's in comments, tests, or legitimate code
        if (lineContent.includes('//') || 
            lineContent.includes('/*') ||
            lineContent.includes('console.log') ||
            lineContent.includes('describe(') ||
            lineContent.includes('test(') ||
            lineContent.includes('it(') ||
            filePath.includes('test') ||
            filePath.includes('spec') ||
            filePath.includes('example') ||
            filePath.includes('demo')) {
          continue;
        }
        
        issues.push({
          type: 'mock_data''[,;]
          line: lineNumber,
          description: 'Mock or placeholder data detected''[,;]
          evidence: lineContent
        });
      }
    });

    // Check for non-functional UI elements
    buttonPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '[,;]
        
        // Skip if it's intentionally disabled or in tests
        if (lineContent.includes('Loading') ||
            lineContent.includes('disabled') ||
            lineContent.includes('isLoading') ||
            filePath.includes('test') ||
            filePath.includes('Loading') ||
            filePath.includes('Skeleton')) {
          continue;
        }
        
        issues.push({
          type: 'non_functional_ui''[,;]
          line: lineNumber,
          description: 'Non-functional UI element detected''[,;]
          evidence: lineContent
        });
      }
    });

    return issues;
  }
}