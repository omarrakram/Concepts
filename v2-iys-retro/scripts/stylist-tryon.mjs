/**
 * npm run stylist-tryon -- <command>
 *
 * DRESSUP.EXE slot assets, development time only (scripts/lib/tryon-pipeline.mjs,
 * src/features/dressup/tryon.ts, scripts/stylist/tryon/README.md). This tool
 * never generates anything and never calls an image service: it plans the
 * jobs, packs them for an offline image-editing capability, validates what
 * comes back, and records the manual review. Only approved candidates ever
 * reach production (npm run build-stylist).
 *
 *   plan                 re-plan the manifest (scripts/stylist/tryon/jobs.json)
 *   validate             the manifest + records against the catalogue (exit 1 on problems)
 *   status [--json]      every job: pending / generated / needs-review / approved / rejected
 *   export [<id>… | --next N | --all]
 *                        generation packs for pending derived jobs (.cache/stylist/tryon/outbox/)
 *   import               returned images in scripts/stylist/candidates/ → needs-review
 *   official             align the official photos (the official jobs' candidates) → needs-review
 *   sheet [<id>…]        review sheets + .cache/stylist/tryon/review/index.html
 *   approve <id> --notes "…"
 *   reject <id> --reasons a,b --notes "…"
 *
 * Behind an HTTP proxy, run node with NODE_USE_ENV_PROXY=1 (plan, export,
 * official and sheet read the official product photos from the CDN, cached).
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildOfficialCandidates,
  context,
  decide,
  exportPack,
  importCandidates,
  loadCatalogue,
  loadJobs,
  makeSheet,
  planJobs,
  statuses,
  validateManifest,
  writeIndex,
} from './lib/tryon-pipeline.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = context(root);
const C = loadCatalogue(root);
const [cmd = 'status', ...args] = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
/** Flags that take a value (the rest are switches: --all, --json). */
const VALUED = ['--notes', '--reasons', '--next'];
const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && VALUED.includes(args[i - 1])));

function counts(rows) {
  const by = {};
  for (const r of rows) {
    const k = `${r.job.model} ${r.job.method} ${r.status}`;
    by[k] = (by[k] ?? 0) + 1;
  }
  return by;
}

switch (cmd) {
  case 'plan': {
    const m = await planJobs(ctx, C);
    const by = {};
    for (const j of m.jobs) by[`${j.model} ${j.method} ${j.bucket}`] = (by[`${j.model} ${j.method} ${j.bucket}`] ?? 0) + 1;
    console.log(`${m.jobs.length} jobs → ${ctx.manifest.replace(root + '/', '')}`);
    for (const [k, v] of Object.entries(by)) console.log(`  ${k.padEnd(34)} ${v}`);
    break;
  }
  case 'validate': {
    const problems = validateManifest(ctx, C);
    for (const p of problems) console.log(`  ✗ ${p}`);
    console.log(problems.length ? `${problems.length} problems` : `manifest OK (${loadJobs(ctx).length} jobs)`);
    process.exitCode = problems.length ? 1 : 0;
    break;
  }
  case 'status': {
    const rows = statuses(ctx);
    // --json: one record per job for a batch runner (status is derived, never stored in the manifest)
    if (args.includes('--json')) {
      console.log(JSON.stringify(rows.map(({ job, status }) => ({ id: job.id, method: job.method, handle: job.handle, model: job.model, slot: job.slot, bucket: job.bucket, rank: job.rank, status })), null, 1));
      break;
    }
    for (const r of rows) console.log(`${r.status.padEnd(13)} ${r.job.method.padEnd(9)} ${r.job.slot.padEnd(7)} ${r.job.id}`);
    for (const [k, v] of Object.entries(counts(rows))) console.log(`  ${k.padEnd(34)} ${v}`);
    break;
  }
  case 'export': {
    const pending = statuses(ctx).filter((r) => r.job.method === 'derived' && r.status === 'pending').map((r) => r.job);
    const pick = ids.length ? loadJobs(ctx).filter((j) => ids.includes(j.id)) : args.includes('--all') ? pending : pending.slice(0, Number(flag('--next') ?? 5));
    for (const j of pick) console.log(`pack ${(await exportPack(ctx, C, j)).replace(root + '/', '')}`);
    console.log(`${pick.length} packs. Return each result as scripts/stylist/candidates/<job id>.png, then: npm run stylist-tryon -- import`);
    break;
  }
  case 'import': {
    const r = await importCandidates(ctx, C);
    console.log(`${r.filter((x) => x.ok).length} imported (needs-review), ${r.filter((x) => !x.ok).length} refused`);
    break;
  }
  case 'official': {
    const r = await buildOfficialCandidates(ctx, C);
    console.log(`${r.filter((x) => x.ok).length} official candidates (needs-review), ${r.filter((x) => !x.ok).length} without one`);
    break;
  }
  case 'sheet': {
    const rows = statuses(ctx);
    for (const { job, status } of rows) {
      if (ids.length && !ids.includes(job.id)) continue;
      if (status === 'pending' || status === 'generated') continue;
      const f = await makeSheet(ctx, C, job, status);
      if (f) console.log(`sheet ${status.padEnd(13)} ${f.replace(root + '/', '')}`);
    }
    console.log(`index ${writeIndex(ctx, C, rows).replace(root + '/', '')}`);
    break;
  }
  case 'approve':
  case 'reject': {
    const a = await decide(ctx, C, ids[0], cmd === 'approve' ? 'approved' : 'rejected', { notes: flag('--notes'), reasons: (flag('--reasons') ?? '').split(',').filter(Boolean) });
    console.log(`${a.decision} ${a.id} (candidate ${a.candidate.slice(0, 12)}) → ${ctx.approvals.replace(root + '/', '')}`);
    break;
  }
  default:
    throw new Error(`unknown command ${cmd}`);
}
