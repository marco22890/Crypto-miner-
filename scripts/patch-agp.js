import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('8.13.0')) {
    content = content.replaceAll('8.13.0', '8.7.3');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-agp] Patched AGP version in ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'build' && entry.name !== '.gradle') {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.gradle')) {
      replaceInFile(fullPath);
    }
  }
}

console.log('[patch-agp] Checking and patching invalid AGP versions...');
walkDir(path.join(process.cwd(), 'android'));
walkDir(path.join(process.cwd(), 'node_modules', '@capacitor'));
