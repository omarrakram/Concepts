/**
 * Environment A for the film: the WEBSITE SOURCE, kept apart from the film
 * tools. Builds `v2-iys-retro/` from a detached worktree of the exact source
 * commit (never from the film branch), with a clean install and every
 * build-time VITE_* variable removed, so each feature switch takes the
 * default documented in src/config/features.ts and live commerce stays off.
 *
 *   node scripts/showcase-30/source-build.mjs [--sha=<full sha>] [--dir=<worktree>]
 *
 * Then serve that build (and nothing else) for filming:
 *   cd <worktree>/v2-iys-retro && npx vite preview --host 127.0.0.1 --port 4317 --strictPort
 *
 * Writes out/source/source-build.json: repository, branch, SHA, worktree,
 * build command, Node/npm versions, flag values and a sha256 manifest of dist/.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const BRANCH = 'feature/iys-retro-conversion-upgrade';
const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const repo = git(['rev-parse', '--show-toplevel'], process.cwd());

// 1. The branch head on the remote, unless a SHA is pinned.
const remoteHead = git(['ls-remote', 'origin', `refs/heads/${BRANCH}`], repo).split(/\s+/)[0];
const sha = arg('sha', remoteHead);
if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`source: need a full 40-character SHA, got ${sha}`);
if (sha !== remoteHead) console.warn(`[source] note: ${BRANCH} is at ${remoteHead} on the remote; building the pinned ${sha}`);
git(['fetch', 'origin', BRANCH], repo);

// 2. A detached worktree at exactly that commit, clean.
const dir = resolve(arg('dir', resolve(repo, '..', 'film-source', `v2-source-${sha.slice(0, 7)}`)));
if (!existsSync(dir)) git(['worktree', 'add', '--detach', dir, sha], repo);
const head = git(['rev-parse', 'HEAD'], dir);
if (head !== sha) throw new Error(`source: ${dir} is at ${head}, not ${sha}`);
const dirty = git(['status', '--porcelain', '--untracked-files=no'], dir);
if (dirty) throw new Error(`source: ${dir} has local changes:\n${dirty}`);
if (existsSync(join(dir, 'v2-iys-retro', 'scripts', 'showcase-30'))) throw new Error('source: this checkout contains the film tools; it is not the website source');
const app = join(dir, 'v2-iys-retro');

// 3. Build-time switches: read them from the source itself, then remove every VITE_* from the build env.
const features = readFileSync(join(app, 'src/config/features.ts'), 'utf8');
const flags = Object.fromEntries([...features.matchAll(/flag\('(VITE_FEATURE_[A-Z_]+)',\s*(true|false)\)/g)].map((m) => [m[1], { value: 'unset', effective: m[2] === 'true' }]));
const used = new Set(execFileSync('git', ['grep', '-ohE', 'VITE_[A-Z0-9_]+', sha, '--', 'v2-iys-retro/src'], { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean));
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('VITE_')));
const others = Object.fromEntries([...used].filter((k) => !flags[k]).sort().map((k) => [k, { value: 'unset', effective: k === 'VITE_COMMERCE_MODE' ? 'snapshot (live Shopify off)' : 'off / placeholder' }]));
for (const f of ['.env', '.env.local', '.env.production', '.env.production.local']) if (existsSync(join(app, f))) throw new Error(`source: ${f} exists in the source checkout; refusing to build with it`);

const run = (cmd, args) => execFileSync(cmd, args, { cwd: app, env, stdio: 'inherit' });
run('npm', ['ci', '--no-audit', '--no-fund']);
run('npm', ['run', 'build']);

// 4. Record exactly what was built.
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push([relative(join(app, 'dist'), p), createHash('sha256').update(readFileSync(p)).digest('hex')]);
  }
};
walk(join(app, 'dist'));
files.sort((a, b) => a[0].localeCompare(b[0]));
const manifest = files.map(([f, h]) => `${h}  ${f}`).join('\n');
const record = {
  repository: 'omarrakram/Concepts',
  project: 'v2-iys-retro/',
  branch: BRANCH,
  sha,
  remoteHeadAtBuild: remoteHead,
  subject: git(['log', '-1', '--format=%s', sha], dir),
  worktree: dir,
  buildDir: join(app, 'dist'),
  buildCommand: 'npm ci && npm run build (every VITE_* removed from the environment)',
  node: process.version,
  npm: execFileSync('npm', ['-v'], { encoding: 'utf8' }).trim(),
  builtAt: new Date().toISOString(),
  featureFlags: flags,
  otherBuildVariables: others,
  indexHtmlMd5: createHash('md5').update(readFileSync(join(app, 'dist/index.html'))).digest('hex'),
  distFiles: files.length,
  distManifestSha256: createHash('sha256').update(manifest).digest('hex'),
  serve: `cd ${app} && npx vite preview --host 127.0.0.1 --port 4317 --strictPort`,
};
const out = resolve(process.cwd(), 'out/source');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'source-build.json'), JSON.stringify(record, null, 1));
writeFileSync(join(out, 'dist-manifest.sha256'), manifest + '\n');
console.log(`[source] ✓ ${sha.slice(0, 12)} built in ${record.buildDir} (${files.length} files, manifest ${record.distManifestSha256.slice(0, 12)})`);
