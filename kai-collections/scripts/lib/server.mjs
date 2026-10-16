// Starts `vite preview` on a free port (building first if dist/ is missing) and resolves its base URL.
import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const ROOT = resolve(new URL('../..', import.meta.url).pathname);

export async function startServer({ port = 4317, build = false } = {}) {
  if (build || !existsSync(resolve(ROOT, 'dist/index.html'))) {
    console.log('[server] building…');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  }
  // own process group, so stop() takes down npx *and* the vite server it spawned
  const proc = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: true,
  });
  const kill = () => {
    try {
      process.kill(-proc.pid, 'SIGTERM');
    } catch {}
  };
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base + '/');
      if (r.ok) return { base, stop: kill };
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  kill();
  throw new Error('preview server did not start');
}

export const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : process.argv.includes(`--${k}`) ? true : d;
};
