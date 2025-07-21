// Emergency fix script for CodeQualityAnalyzer.ts
const fs = require('fs');

try {
  let content = fs.readFileSync('server/services/integrity/CodeQualityAnalyzer.ts', 'utf8');
  
  // Fix unterminated string on line 74
  content = content.replace(/NODE_ENV === 'development'\) \|\|/, "NODE_ENV === 'development') ||");
  content = content.replace(/\|\| ';/g, "|| '';");
  content = content.replace(/= ';/g, "= '';");
  content = content.replace(/: ';/g, ": '';");
  
  fs.writeFileSync('server/services/integrity/CodeQualityAnalyzer.ts', content);
  console.log('✅ Fixed CodeQualityAnalyzer.ts syntax errors');
} catch (error) {
  console.error('❌ Error fixing file:', error);
}