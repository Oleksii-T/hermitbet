import { spawnSync } from 'node:child_process';

// Include TypeScript compilation in --limit without requiring tsx or a new
// runtime dependency. The runner reuses this timestamp for its deadline.
process.env.SIMULATION_STARTED_AT = String(Date.now());
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const limitText =
    args.find((arg) => arg.startsWith('--limit='))?.slice(8) ??
    (limitIndex < 0 ? '10' : args[limitIndex + 1]);
const limit = Number(limitText);
if (!Number.isFinite(limit) || limit <= 0) {
    console.error('--limit must be a positive number');
    process.exit(1);
}
const build = spawnSync(
    process.execPath,
    [
        'node_modules/typescript/bin/tsc',
        '-p',
        'scripts/simulation/tsconfig.json',
    ],
    { stdio: 'inherit', timeout: Math.max(1, Math.floor(limit * 60000)) },
);
if (build.error || build.status !== 0) {
    console.error(build.error?.message ?? 'Simulation compilation failed');
    process.exit(build.error?.code === 'ETIMEDOUT' ? 2 : 1);
}
await import('../../.simulation-build/run.js');
