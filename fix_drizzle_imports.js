#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const FIXES = [
  // Fix direct schema-master imports
  {
    pattern: /from ['"].*\/schema-master['"];?/g,
    replacement: "from '@shared/schema';"
  },
  // Fix relative path imports to consistent pattern
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/schema['"];?/g,
    replacement: "from '@shared/schema';"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\/schema-master['"];?/g,
    replacement: "from '@shared/schema';"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\/schema['"];?/g,
    replacement: "from '@shared/schema';"
  },
  // Fix .js extensions to be consistent
  {
    pattern: /from '@shared\/schema\.js';?/g,
    replacement: "from '@shared/schema';"
  },
  {
    pattern: /from ['"].*shared\/schema\.js['"];?/g,
    replacement: "from '@shared/schema';"
  }
];

console.log('🔧 Starting systematic Drizzle import fixes...');

// Get all TypeScript files in server directory
const files = execSync('find server -name "*.ts" -type f', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

let totalFixed = 0;
let filesModified = [];

files.forEach(filePath => {
  let content = readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileModified = false;

  FIXES.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      fileModified = true;
    }
  });

  if (fileModified && content !== originalContent) {
    writeFileSync(filePath, content, 'utf8');
    filesModified.push(filePath);
    totalFixed++;
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`- Files processed: ${files.length}`);
console.log(`- Files modified: ${totalFixed}`);
console.log(`- Import patterns standardized ✅`);

if (filesModified.length > 0) {
  console.log(`\n📝 Modified files:`);
  filesModified.forEach(file => console.log(`  - ${file}`));
}

console.log('\n🎯 All Drizzle imports now use: import { ... } from "@shared/schema";');