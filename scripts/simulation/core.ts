import { parseArgs } from 'node:util';

export class Random {
    private state: number;
    constructor(seed: string) {
        this.state =
            seed
                .split('')
                .reduce(
                    (n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619),
                    2166136261,
                ) >>> 0;
    }
    next(): number {
        let n = (this.state += 0x6d2b79f5);
        n = Math.imul(n ^ (n >>> 15), n | 1);
        n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
        return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    }
    int(min: number, max: number): number {
        return min + Math.floor(this.next() * (max - min + 1));
    }
    pick<T>(items: readonly T[]): T {
        if (!items.length) throw new Error('Cannot pick from an empty list');
        return items[this.int(0, items.length - 1)]!;
    }
    weighted<T>(items: readonly { value: T; weight: number }[]): T {
        if (
            !items.length ||
            items.some((i) => !Number.isFinite(i.weight) || i.weight <= 0)
        ) {
            throw new Error(
                'Weighted choices must have positive finite weights',
            );
        }
        let roll = this.next() * items.reduce((sum, i) => sum + i.weight, 0);
        for (const item of items) {
            roll -= item.weight;
            if (roll < 0) return item.value;
        }
        return items[items.length - 1]!.value;
    }
}

export const personas = [
    'explorer',
    'player',
    'bonus-hunter',
    'cautious',
    'frustrated',
] as const;
export type Persona = (typeof personas)[number];
export type Options = ReturnType<typeof options>;
export function options(args: string[]) {
    const { values } = parseArgs({
        args,
        options: {
            workers: { type: 'string', default: '2' },
            iterations: { type: 'string', default: '10' },
            limit: { type: 'string', default: '10' },
            url: {
                type: 'string',
                default:
                    process.env.SIMULATION_BASE_URL ??
                    process.env.E2E_BASE_URL ??
                    'http://localhost:8000',
            },
            seed: { type: 'string', default: String(Date.now()) },
            'min-steps': { type: 'string', default: '20' },
            'max-steps': { type: 'string', default: '60' },
            speed: { type: 'string', default: '1' },
            analytics: { type: 'string', default: 'required' },
            headed: { type: 'boolean', default: false },
            verify: { type: 'boolean', default: false },
            help: { type: 'boolean', default: false },
            'log-dir': { type: 'string', default: 'storage/app/simulations' },
        },
    });
    const number = (
        name:
            | 'workers'
            | 'iterations'
            | 'limit'
            | 'min-steps'
            | 'max-steps'
            | 'speed',
        integer = true,
        zero = false,
    ) => {
        const n = Number(values[name]);
        if (
            !Number.isFinite(n) ||
            (integer && !Number.isInteger(n)) ||
            (zero ? n < 0 : n <= 0)
        ) {
            throw new Error(
                `--${name} must be a ${zero ? 'non-negative' : 'positive'} ${integer ? 'integer' : 'number'}`,
            );
        }
        return n;
    };
    const workers = number('workers');
    const iterations = number('iterations');
    const limit = number('limit', false);
    const minSteps = number('min-steps');
    const maxSteps = number('max-steps');
    const speed = number('speed', false, true);
    if (minSteps > maxSteps)
        throw new Error('--min-steps must be <= --max-steps');
    if (!['required', 'optional', 'off'].includes(values.analytics!))
        throw new Error('--analytics must be required, optional, or off');
    const url = new URL(values.url!);
    if (!['http:', 'https:'].includes(url.protocol))
        throw new Error('--url must use HTTP or HTTPS');
    return {
        workers,
        iterations,
        limit,
        minSteps,
        maxSteps,
        speed,
        url: url.toString(),
        seed: values.seed!,
        analytics: values.analytics as 'required' | 'optional' | 'off',
        headed: values.headed!,
        verify: values.verify!,
        help: values.help!,
        logDir: values['log-dir']!,
    };
}

export const help = `Run user-like casino visits through the Vue UI:
  npm run simulate -- --workers 4 --iterations 100 --limit 15 --url http://localhost:8001

  --workers N         Concurrent isolated visitors (default 2)
  --iterations N      Total visits across all workers (default 10)
  --limit N           Whole simulation time budget in minutes, fractional allowed (default 10)
  --url URL           Running preview; also SIMULATION_BASE_URL or E2E_BASE_URL
  --seed TEXT         Reproduce choices; reported in summary
  --min-steps N       Minimum visit length before random departure (default 20)
  --max-steps N       Hard action cap per visit (default 60)
  --speed N           Human delay multiplier; 0 for fast verification (default 1)
  --analytics MODE    required (default), optional, or off (offline verification)
  --headed            Show Chromium
  --verify            Run comprehensive fixed feature/error paths on desktop and mobile
  --log-dir PATH      JSONL, summary, screenshots, and failure traces

Visits create unique @example.test accounts and persist demo activity.
Expected validation errors are successful simulation outcomes; unexpected failures exit 1.
The deadline interrupts in-flight visits, writes a partial summary, and exits 2.
SIGINT/SIGTERM writes a partial summary and exits 130/143.`;

export async function pool(
    total: number,
    workers: number,
    stopped: () => boolean,
    job: (index: number, worker: number) => Promise<void>,
) {
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(workers, total) }, async (_, worker) => {
            while (!stopped()) {
                const index = next++;
                if (index >= total) return;
                await job(index, worker);
            }
        }),
    );
}
