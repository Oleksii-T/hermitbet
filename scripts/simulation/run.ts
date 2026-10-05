import { options, help } from './core.js';
import { run } from './runner.js';

try {
    const parsed = options(process.argv.slice(2));
    if (parsed.help) console.log(help);
    else await run(parsed);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
