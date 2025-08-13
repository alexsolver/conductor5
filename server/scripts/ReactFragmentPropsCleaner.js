
const fs = require('fs');
const path = require('path');

function cleanReactFragmentProps(dir) {
  console.log('🧹 [REACT-FRAGMENT-CLEANER] Starting cleanup process...');
  
  const files = fs.readdirSync(dir);
  let totalFixed = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalFixed += cleanReactFragmentProps(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Remove data-replit-metadata props from React.Fragment
        content = content.replace(
          /<React\.Fragment\s+data-replit-metadata="[^"]*">/g,
          '<React.Fragment>'
        );

        // Remove any other invalid props from React.Fragment
        content = content.replace(
          /<React\.Fragment\s+[^>]*(?:data-[^=]*="[^"]*"[^>]*)>/g,
          '<React.Fragment>'
        );

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Fixed React Fragment props in: ${filePath}`);
          totalFixed++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
  });

  return totalFixed;
}

// Clean client directory
const clientDir = path.join(__dirname, '../../client/src');
if (fs.existsSync(clientDir)) {
  const fixedFiles = cleanReactFragmentProps(clientDir);
  console.log(`🎉 [REACT-FRAGMENT-CLEANER] Cleanup complete! Fixed ${fixedFiles} files.`);
} else {
  console.log('❌ [REACT-FRAGMENT-CLEANER] Client directory not found');
}
