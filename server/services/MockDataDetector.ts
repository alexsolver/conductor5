
export class MockDataDetector {
  static async scanForMockData(content: string, filePath: string): Promise<Array<{
    type: 'mock_data' | 'incomplete_function' | 'disabled_button';
    line: number;
    description: string;
    evidence: string;
  }>> {
    const issues = [];
    const lines = content.split('\n');

    // Detect mock data patterns - Enhanced detection
    const mockPatterns = [
      /mock|fake|dummy|test_data|placeholder/gi,
      /lorem ipsum/gi,
      /\[\{.*"id":\s*["']?(1|2|3|mock-)["']?.*\}\]/gi, // Array with simple IDs or mock prefix
      /Math\.random\(\)/g, // Random data generation
      /\.map\(\(\w+,\s*\w+\)\s*=>\s*\({.*\}\)\)/g, // Map with object generation
      /mockItems|mockData|fakeData|testData/gi, // Variable names
      /hardcoded.*array|static.*data/gi, // Hardcoded arrays
      /temporary.*data|temp.*data/gi, // Temporary data
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
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
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
          type: 'incomplete_function',
          line: lineNumber,
          description: 'Incomplete functionality detected',
          evidence: lineContent
        });
      }
    });

    // Check for mock data patterns - exclude legitimate implementations
    mockPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        // Skip if it's in comments, tests, or legitimate code
        if (lineContent.includes('//') || 
            lineContent.includes('/*') ||
            filePath.includes('test') ||
            lineContent.includes('fromPersistence') ||
            lineContent.includes('toDomainEntity') ||
            lineContent.includes('Domain') ||
            lineContent.includes('Entity')) {
          continue;
        }
        
        issues.push({
          type: 'mock_data',
          line: lineNumber,
          description: 'Mock data detected',
          evidence: lineContent
        });
      }
    });

    // Check for disabled buttons
    buttonPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        issues.push({
          type: 'disabled_button',
          line: lineNumber,
          description: 'Non-functional button detected',
          evidence: lineContent
        });
      }
    });

    return issues;
  }
}
