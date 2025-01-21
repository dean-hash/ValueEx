import { BugFixer } from '../core/qa/bugFixer';
import { ResonanceField } from '../core/unified/intelligenceField';
import path from 'path';

async function main() {
  console.log('Starting autonomous bug fixing process...');

  const resonanceField = ResonanceField.getInstance();
  await resonanceField.initialize();

  const bugFixer = BugFixer.getInstance();

  // Event handlers for monitoring progress
  bugFixer.on('fix-applied', (data) => {
    console.log(
      `✅ Fixed ${path.basename(data.file)} (${data.type}) with ${data.confidence * 100}% confidence`
    );
  });

  bugFixer.on('fix-failed', (data) => {
    console.log(`❌ Failed to fix ${path.basename(data.file)}: ${data.error}`);
  });

  // Start fixing bugs in the src directory
  const srcDir = path.join(process.cwd(), 'src');
  await bugFixer.startFixing(srcDir);

  // Regular status updates
  const statusInterval = setInterval(() => {
    const status = bugFixer.getFixStatus();
    console.log('\nCurrent Status:');
    console.log(`Pending fixes: ${status.pendingFixes}`);
    console.log(`Fixed files: ${status.fixedFiles}`);
    console.log(`Total fixes applied: ${status.totalFixes}`);
  }, 5000);

  // Handle process termination
  process.on('SIGINT', () => {
    clearInterval(statusInterval);
    console.log('\nGracefully shutting down...');
    process.exit(0);
  });
}

main().catch(console.error);
