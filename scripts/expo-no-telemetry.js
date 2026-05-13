const { spawn } = require('node:child_process');

const command = process.execPath;
const args = [require.resolve('expo/bin/cli'), ...process.argv.slice(2)];

const child = spawn(command, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_NO_TELEMETRY: '1',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
