import { runScan } from './runner/scanRunner.js';

function printUsage(): void {
  console.log('TicketScout AI (MVP)');
  console.log('Usage:');
  console.log('  npm run scan       Run one scan cycle');
  console.log('  node dist/index.js scan');
}

const command = process.argv[2];

if (command === 'scan') {
  runScan().catch(error => {
    console.error('Scan failed', error);
    process.exitCode = 1;
  });
} else {
  printUsage();
}
