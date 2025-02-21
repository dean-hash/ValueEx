const { execSync } = require('child_process');
const path = require('path');

// Build the project
console.log('Building ValueEx MVP...');
execSync('npm run build:mvp', { stdio: 'inherit' });

// Run tests
console.log('Running tests...');
execSync('npm run test:coverage', { stdio: 'inherit' });

// Start the server
console.log('Starting ValueEx MVP...');
execSync('npm run start:mvp', { stdio: 'inherit' });
