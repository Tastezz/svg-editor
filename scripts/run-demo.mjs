import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../',import.meta.url));
mkdirSync(new URL('../.artifacts/',import.meta.url),{recursive:true});
const result = spawnSync(process.execPath,[fileURLToPath(new URL('../dist/src/main.js',import.meta.url))],{
  cwd:root,input:readFileSync(new URL('../examples/flowchart.commands',import.meta.url),'utf8'),
  stdio:['pipe','inherit','inherit'],
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
