const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/api/bookmarks/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix logger calls with error objects
content = content.replace(/logger\.warn\('Favicon extraction failed', \{ error: result\.error \}\);/g, 
  `logger.warn('Favicon extraction failed', new Error(result.error || 'Unknown error'));`);

content = content.replace(/logger\.error\('Favicon extraction error', \{ error \}\);/g,
  `logger.error('Favicon extraction error', error as Error);`);

content = content.replace(/logger\.warn\('AI analysis failed, using fallbacks', \{ error \}\);/g,
  `logger.warn('AI analysis failed, using fallbacks', error as Error);`);

content = content.replace(/logger\.warn\('Category upsert exception', \{ error \}\);/g,
  `logger.warn('Category upsert exception', error as Error);`);

// Fix .catch() calls
content = content.replace(/\.catch\(\(\) => \{\}\);/g, '.then(() => {}).catch(() => {});');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed type issues in bookmarks route');
