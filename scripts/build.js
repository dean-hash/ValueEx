const { execSync } = require('child_process');
const path = require('path');

// Compile TypeScript files
console.log('Compiling TypeScript files...');
execSync('tsc', { stdio: 'inherit' });

// Run the compiled JavaScript
const scriptPath = process.argv[2];
if (scriptPath) {
    const compiledPath = path.join('dist', scriptPath.replace('.ts', '.js'));
    console.log(`Running ${compiledPath}...`);
    execSync(`node ${compiledPath} ${process.argv.slice(3).join(' ')}`, { stdio: 'inherit' });
}
