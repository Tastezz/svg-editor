import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/',import.meta.url));
const walk = directory => readdirSync(directory,{withFileTypes:true}).flatMap(entry=>
  entry.isDirectory() ? walk(join(directory,entry.name)) : entry.name.endsWith('.ts') ? [join(directory,entry.name)] : []);
const files = walk(root), all = new Set(files), graph = new Map(), errors = [];
const allowed = {
  domain:new Set(['domain']), application:new Set(['application','domain']),
  cli:new Set(['cli','application','domain']), infrastructure:new Set(['infrastructure','application','domain']),
  'main.ts':new Set(['cli','application','infrastructure','domain']),
};
for (const file of files) {
  const name = relative(root,file).split(sep).join('/'), layer = name.split('/')[0];
  const source = readFileSync(file,'utf8'), runtime = [];
  const classes = [...source.matchAll(/^export\s+(?:abstract\s+)?class\s+(\w+)/gm)].map(match=>match[1]);
  if (classes.length>1 || (classes.length===1 && classes[0]!==basename(file,'.ts'))) errors.push(`${name}: one class per matching file required`);
  for (const match of source.matchAll(/^import\s+(type\s+)?[^;]*?\bfrom\s*['"]([^'"]+)['"]/gm)) {
    const [,typeOnly,specifier] = match;
    if (!specifier.startsWith('.')) {
      if (layer==='domain' || layer==='application') errors.push(`${name}: external dependency ${specifier}`);
      if (layer==='cli' && !['node:readline','node:stream'].includes(specifier)) errors.push(`${name}: CLI IO is not isolated: ${specifier}`);
      continue;
    }
    const target = resolve(dirname(file),specifier.replace(/\.js$/,'.ts'));
    if (!all.has(target)) { errors.push(`${name}: unresolved import ${specifier}`); continue; }
    const targetName = relative(root,target).split(sep).join('/'), targetLayer = targetName.split('/')[0];
    if (!allowed[layer]?.has(targetLayer)) errors.push(`${name}: forbidden dependency ${targetName}`);
    if (layer==='infrastructure' && targetLayer==='application' && !targetName.startsWith('application/ports/')) {
      errors.push(`${name}: adapters may depend on application/ports only`);
    }
    if (!typeOnly) runtime.push(target);
  }
  if (/\bswitch\s*\(\s*(?:\w+\.)?(?:tag|type)\b/.test(source)) errors.push(`${name}: tag/type switch is prohibited`);
  graph.set(file,runtime);
}
const visiting = new Set(), done = new Set();
const visit = file => {
  if (visiting.has(file)) { errors.push(`runtime import cycle at ${relative(root,file)}`); return; }
  if (done.has(file)) return;
  visiting.add(file); for (const target of graph.get(file) ?? []) visit(target);
  visiting.delete(file); done.add(file);
};
files.forEach(visit);
if (errors.length) { process.stderr.write(errors.join('\n')+'\n'); process.exitCode=1; }
else console.log(`Architecture check passed: ${files.length} source files; layer directions, port boundary, runtime cycles, class filenames and tag/type switches.`);
