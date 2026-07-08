import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appscriptJson = path.join(rootDir, 'appsscript.json');
const sourceDir = path.join(rootDir, 'src');
const runtimeExtensions = new Set(['.js', '.gs', '.json', '.html']);

mkdirSync(distDir, { recursive: true });
copyFileSync(appscriptJson, path.join(distDir, 'appsscript.json'));

function shouldCopyFile(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.d.ts')) return false;

  return runtimeExtensions.has(path.extname(filePath));
}

function copyRecursive(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (shouldCopyFile(srcPath)) {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(sourceDir, distDir);

console.log(`Build completed: ${distDir}`);
