import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = readFileSync(new URL('../doc/architecture.puml',import.meta.url));
const jar = process.env.PLANTUML_JAR ?? fileURLToPath(new URL('../.artifacts/tools/plantuml.jar',import.meta.url));
const bundledJava = fileURLToPath(new URL('../.artifacts/tools/jre/Contents/Home/bin/java',import.meta.url));
const java = process.env.JAVA_BIN ?? (existsSync(bundledJava) ? bundledJava : 'java');
if (!existsSync(jar)) throw new Error('Set PLANTUML_JAR to a local PlantUML JAR. JAVA_BIN may point to a local Java runtime.');
const result = spawnSync(java,['-Djava.awt.headless=true','-jar',jar,'-tsvg','-pipe'],{input:source,encoding:'utf8',maxBuffer:5*1024*1024});
if (result.error) throw result.error;
const svg = result.stdout;
if (result.status !== 0 || !svg.includes('<svg') || /Syntax Error|An error has occur/.test(svg)) {
  throw new Error('PlantUML renderer did not return a valid diagram');
}
writeFileSync(new URL('../doc/architecture.svg',import.meta.url),svg);
console.log('Rendered doc/architecture.svg locally with PlantUML; no source uploaded.');
