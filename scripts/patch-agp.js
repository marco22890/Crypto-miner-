import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Patch high or invalid AGP versions
    if (content.includes('8.13.0')) {
      content = content.replaceAll('8.13.0', '8.7.3');
      modified = true;
    }
    if (/com\.android\.tools\.build:gradle:8\.13\.\d+/g.test(content)) {
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

function ensureNamespaces() {
  const cordovaGradle = path.join(process.cwd(), 'android', 'capacitor-cordova-android-plugins', 'build.gradle');
  if (fs.existsSync(cordovaGradle)) {
    let content = fs.readFileSync(cordovaGradle, 'utf8');
    if (!content.includes('namespace')) {
      content = content.replace(/android\s*\{/, 'android {\n    namespace = "capacitor.cordova.android.plugins"');
      fs.writeFileSync(cordovaGradle, content, 'utf8');
      console.log('[patch-agp] Added namespace to capacitor-cordova-android-plugins');
    }
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

function patchTermuxAapt2() {
  const possiblePaths = [
    '/data/data/com.termux/files/usr/bin/aapt2',
    process.env.PREFIX ? path.join(process.env.PREFIX, 'bin', 'aapt2') : null,
    '/usr/bin/aapt2'
  ].filter(Boolean);

  let termuxAapt2 = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      termuxAapt2 = p;
      break;
    }
  }

  if (!termuxAapt2) {
    return;
  }

  console.log(`[patch-agp] Found native Termux AAPT2 binary at: ${termuxAapt2}`);

  const homeDir = process.env.HOME || process.env.USERPROFILE || '/data/data/com.termux/files/home';
  const cachesDir = path.join(homeDir, '.gradle', 'caches');

  if (!fs.existsSync(cachesDir)) return;

  function replaceAapt2InCaches(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          replaceAapt2InCaches(fullPath);
        } else if (entry.isFile() && entry.name === 'aapt2' && fullPath !== termuxAapt2) {
          try {
            fs.unlinkSync(fullPath);
            fs.copyFileSync(termuxAapt2, fullPath);
            fs.chmodSync(fullPath, 0o755);
            console.log(`[patch-agp] Replaced x86_64 AAPT2 with native Termux AAPT2 in cache: ${fullPath}`);
          } catch (e) {
            console.error(`[patch-agp] Failed replacing AAPT2 at ${fullPath}:`, e.message);
          }
        }
      }
    } catch (err) {
      // ignore read errors
    }
  }

  replaceAapt2InCaches(cachesDir);
}

console.log('[patch-agp] Checking and patching invalid AGP versions and namespaces...');
walkDir(path.join(process.cwd(), 'android'));
walkDir(path.join(process.cwd(), 'node_modules'));
ensureNamespaces();
patchTermuxAapt2();

