#!/usr/bin/env ts-node

import * as readline from 'readline';

// Import the demand identification functionality from the core analysis module
// Adjust the path if 'identifyDemand' is located elsewhere.
import { identifyDemand } from '../services/analysis/demandInference';

async function main(): Promise<void> {
  // Get input from command line argument or prompt the user
  const input = process.argv[2] || await promptUser("Enter input for demand identification (e.g., a keyword or phrase): ");
  console.log(`Input: ${input}`);
  try {
    const result = await identifyDemand(input);
    console.log("Demand Identification Result:", result);
  } catch (error) {
    console.error("Error during demand identification:", error);
  }
  process.exit(0);
}

function promptUser(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

main();
