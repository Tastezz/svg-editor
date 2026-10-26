import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { SvgCodec } from '../../src/infrastructure/svg/SvgCodec.js';
import { ShapeFactory } from '../../src/application/factories/ShapeFactory.js';

const root = fileURLToPath(new URL('../../../',import.meta.url));
const entry = join(root,'dist/src/main.js');

test('actual CLI replays assignment section 6, including intentional errors and external SVG', async t => {
  const directory = await mkdtemp(join(tmpdir(),'svg-editor-transcript-')); t.after(()=>rm(directory,{recursive:true,force:true}));
  await writeFile(join(directory,'other.svg'),await readFile(join(root,'tests/fixtures/other.svg')));
  const result = spawnSync(process.execPath,[entry],{cwd:directory,input:await readFile(join(root,'examples/assignment-session.commands'),'utf8'),encoding:'utf8'});
  assert.equal(result.status,0); assert.equal(result.error,undefined);
  assert.equal(result.stderr,'error: cannot group a container into its own descendant: markers\nerror: undo not allowed after io command\n');
  assert.match(result.stdout,/warning: assigned id rect1 to unnamed <rect>/);
  assert.match(result.stdout,/read other.svg \(7 elements\)/); assert.match(result.stdout,/svg \(400x300\)/);
  assert.match(result.stdout,/circle#c1.*cx=130 cy=100/);
  const saved = new SvgCodec(new ShapeFactory()).decode(await readFile(join(directory,'demo.svg'),'utf8')).document;
  assert.equal(saved.size,5); assert.equal(saved.find('title').textContent,'My Diagram');
  assert.equal(saved.find('c1').attributes['cx'],'130'); assert.equal(saved.find('box').parent!.id,'markers');
});

test('actual CLI builds section 6.1 version A and preserves node content after move/undo', async t => {
  const directory = await mkdtemp(join(tmpdir(),'svg-editor-flowchart-')); t.after(()=>rm(directory,{recursive:true,force:true}));
  await mkdir(join(directory,'.artifacts'));
  const result = spawnSync(process.execPath,[entry],{cwd:directory,input:await readFile(join(root,'examples/flowchart.commands'),'utf8'),encoding:'utf8'});
  assert.equal(result.status,0); assert.equal(result.stderr,'');
  const document = new SvgCodec(new ShapeFactory()).decode(await readFile(join(directory,'.artifacts/flowchart.svg'),'utf8')).document;
  assert.equal(document.size,8); assert.equal(document.find('process-label').textContent,'处理数据 v2');
  assert.equal(document.find('process').attributes['y'],'100'); assert.equal(document.find('node2').transform.isIdentity,true);
  assert.deepEqual(document.find('flowchart').children.map(s=>s.id),['node1','node2','arrow1']);
});

test('actual CLI handles quoted file paths and survives invalid import without losing redo', async t => {
  const directory = await mkdtemp(join(tmpdir(),'svg-editor-errors-')); t.after(()=>rm(directory,{recursive:true,force:true}));
  await mkdir(join(directory,'my files')); await writeFile(join(directory,'my files','bad.svg'),'<svg><rect></svg>');
  const input = 'init\ncreate rect r 1 2 3 4\nmove r 2 3\nundo\nread "my files/bad.svg"\nredo\nshow r\n';
  const result = spawnSync(process.execPath,[entry],{cwd:directory,input,encoding:'utf8'});
  assert.equal(result.status,0); assert.equal(result.stderr.trim().split('\n').length,1);
  assert.match(result.stderr,/^error:/); assert.match(result.stdout,/redone: rect#r moved/);
  assert.match(result.stdout,/x="3"/);
});
