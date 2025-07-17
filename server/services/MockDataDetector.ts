
export class MockDataDetector {
  static async scanForMockData(content: string, filePath: string): Promise<Array<{
    type: 'mock_data' | 'incomplete_function' | 'disabled_button';
    line: number;
    description: string;
    evidence: string;
  }>> {
    const issues = [];
    const lines = content.split('\n');

    // Detect mock data patterns
    const mockPatterns = [
      /mock|fake|dummy|test_data|placeholder/gi,
      /lorem ipsum/gi,
      /\[\{.*"id":\s*["']?(1|2|3)["']?.*\}\]/gi, // Array with simple IDs
      /Math\.random\(\)/g, // Random data generation
      /\.map\(\(\w+,\s*\w+\)\s*=>\s*\({.*\}\)\)/g, // Map with object generation
    ];

    // Detect incomplete functions
    const incompletePatterns = [
      /TODO|FIXME|XXX|HACK/gi,
      /throw new Error\(['"`]Not implemented['"`]\)/gi,
      /console\.log\(['"`]TODO['"`]/gi,
      /return null;?\s*\/\/.*implement/gi,
    ];

    // Detect disabled/non-functional buttons
    const buttonPatterns = [
      /disabled={true}/g,
      /onClick={() => {}}/g,
      /onClick={undefined}/g,
      /href="#"/g,
      /preventDefault\(\);?\s*\/\/.*TODO/gi,
    ];

    [...mockPatterns, ...incompletePatterns, ...buttonPatterns].forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        let type: 'mock_data' | 'incomplete_function' | 'disabled_button' = 'mock_data';
        let description = 'Mock data detected';
        
        if (incompletePatterns.some(p => p.test(match[0]))) {
          type = 'incomplete_function';
          description = 'Incomplete functionality detected';
        } else if (buttonPatterns.some(p => p.test(match[0]))) {
          type = 'disabled_button';
          description = 'Non-functional button detected';
        }

        issues.push({
          type,
          line: lineNumber,
          description,
          evidence: lineContent
        });
      }
    });

    return issues;
  }
}
