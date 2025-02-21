const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build TypeScript (MVP only)
console.log('Compiling MVP TypeScript...');
execSync('tsc src/mvp.ts --outDir dist --esModuleInterop --skipLibCheck', { stdio: 'inherit' });

// Copy necessary files
console.log('Copying configuration files...');
const files = ['.env', 'package.json', 'package-lock.json'];
files.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

// Create minimal package.json for MVP
const mvpPackage = {
  name: 'valueex-mvp',
  version: '1.0.0',
  main: 'mvp.js',
  dependencies: {
    'express': '^4.18.2',
    '@azure/communication-calling': '^1.32.1',
    '@azure/communication-common': '^2.3.1',
    '@microsoft/microsoft-graph-client': '^3.0.7'
  }
};

fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify(mvpPackage, null, 2)
);

console.log('ValueEx MVP build complete!');
