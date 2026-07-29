import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    if (content.includes('8.13.0')) {
      content = content.replaceAll('8.13.0', '8.7.3');
      modified = true;
    }
    if (content.includes('com.android.tools.build:gradle:8.13')) {
      content = content.replaceAll(/com\.android\.tools\.build:gradle:8\.13\.\d+/g, 'com.android.tools.build:gradle:8.7.3');
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-agp] Patched AGP version in ${filePath}`);
    }
  } catch (err) {
    // ignore
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'build' && entry.name !== '.gradle' && entry.name !== '.git') {
          walkDir(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.gradle')) {
        replaceInFile(fullPath);
      }
    }
  } catch (err) {
    // ignore
  }
}

console.log('[patch-agp] Checking and patching invalid AGP versions...');
walkDir(path.join(process.cwd(), 'android'));
walkDir(path.join(process.cwd(), 'node_modules'));

