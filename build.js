const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const wwwDir = path.join(rootDir, 'www');

// Clean and recreate www directory
if (fs.existsSync(wwwDir)) {
  fs.rmSync(wwwDir, { recursive: true, force: true });
}
fs.mkdirSync(wwwDir, { recursive: true });

// Copy files
const filesToCopy = [
  'index.html',
  'style.css',
  'app.js',
  'audio.js',
  'manifest.json',
  'sw.js'
];

filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(wwwDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> www/${file}`);
  }
});

// Copy assets folder
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied asset: ${entry.name}`);
    }
  }
}

const assetsSrc = path.join(rootDir, 'assets');
const assetsDest = path.join(wwwDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  copyDir(assetsSrc, assetsDest);
}

// Create .nojekyll to disable Jekyll processing on GitHub Pages
fs.writeFileSync(path.join(wwwDir, '.nojekyll'), '');

console.log('Build complete! www/ folder is ready for GitHub Pages & Capacitor.');
