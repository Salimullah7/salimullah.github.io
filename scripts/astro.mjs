import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageUrl = new URL('../node_modules/astro/package.json', import.meta.url);
const metadata = JSON.parse(readFileSync(packageUrl, 'utf8'));
const relativeBin = typeof metadata.bin === 'string' ? metadata.bin : metadata.bin.astro;
const entrypoint = fileURLToPath(new URL(relativeBin, packageUrl));
const result = spawnSync(process.execPath, [entrypoint, ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
