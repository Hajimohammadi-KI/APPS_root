import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const apiRoot = resolve(import.meta.dirname, '..');
const entry = resolve(apiRoot, 'dist', 'main.js');

if (!existsSync(entry)) {
  // Starter App launches the compiled API. Build it here when a fresh source
  // checkout has no dist folder, so the learner UI cannot start without its API.
  const build = Bun.spawnSync({
    cmd: ['bun', 'run', 'build'],
    cwd: apiRoot,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (!build.success) process.exit(build.exitCode || 1);
}

await import('../dist/main.js');
