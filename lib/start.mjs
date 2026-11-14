import { spawn } from 'node:child_process';

/** `start`: run the DSH host for this profile in the foreground. */
export function start({ home, name, port }) {
  const bin = process.env.DSH_BIN || 'dsh';
  const child = spawn(
    bin,
    ['--profile', name, '--host', '127.0.0.1', '--port', String(port), '--no-open'],
    { env: { ...process.env, DSH_HOME: home }, stdio: 'inherit' },
  );
  child.on('error', (error) => {
    console.error(`could not start ${bin}: ${error.message}`);
    process.exit(1);
  });
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}
