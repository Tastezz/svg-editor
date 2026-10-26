import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir, readdir, chmod, symlink, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileDocumentStore } from '../../src/infrastructure/fs/FileDocumentStore.js';
import { SvgCodec } from '../../src/infrastructure/svg/SvgCodec.js';
import { ShapeFactory } from '../../src/application/factories/ShapeFactory.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { CreateCommand } from '../../src/application/commands/CreateCommand.js';
import { MoveCommand } from '../../src/application/commands/MoveCommand.js';

test('file store replaces regular files, follows symlinks and cleans temporary files', async t => {
  const directory = await mkdtemp(join(tmpdir(),'svg-editor-store-')); t.after(()=>rm(directory,{recursive:true,force:true}));
  const store = new FileDocumentStore(), file = join(directory,'图 file.svg'), link = join(directory,'link.svg');
  await store.write(file,'original'); assert.equal(await store.read(file),'original');
  await symlink(file,link); await store.write(link,'updated');
  assert.equal(await readFile(file,'utf8'),'updated'); assert.equal((await lstat(link)).isSymbolicLink(),true);
  assert.deepEqual((await readdir(directory)).sort(),['link.svg','图 file.svg'].sort());
});

test('failed file writes preserve existing targets and leave no temporary files', async t => {
  const directory = await mkdtemp(join(tmpdir(),'svg-editor-failure-')); t.after(()=>rm(directory,{recursive:true,force:true}));
  const store = new FileDocumentStore(), file = join(directory,'keep.svg');
  await writeFile(file,'keep'); const folder = join(directory,'folder'); await mkdir(folder);
  await assert.rejects(store.write(folder,'bad')); await assert.rejects(store.write(join(directory,'missing','file.svg'),'bad'));
  if (process.platform !== 'win32' && process.getuid?.() !== 0) {
    await chmod(file,0o444); await assert.rejects(store.write(file,'bad')); await chmod(file,0o644);
  }
  assert.equal(await readFile(file,'utf8'),'keep');
  assert.deepEqual((await readdir(directory)).sort(),['folder','keep.svg']);
});

test('real IO keeps document and history atomic and enforces the save/read barrier', async t => {
  const directory = await mkdtemp(join(tmpdir(),'svg-editor-session-')); t.after(()=>rm(directory,{recursive:true,force:true}));
  const factory = new ShapeFactory(), codec = new SvgCodec(factory), store = new FileDocumentStore();
  const session = new EditorSession(store,codec), file = join(directory,'document.svg');
  session.init(); session.execute(new CreateCommand(factory,'rect','r',['1','2','3','4']));
  await session.save(file); assert.throws(()=>session.undo(),/undo not allowed after io command/);
  session.execute(new MoveCommand('r',2,3)); const before = session.document.toElement(), history = session.historyState;
  const bad = join(directory,'bad.svg'); await writeFile(bad,'<svg><rect></svg>');
  await assert.rejects(session.read(bad)); await assert.rejects(session.save(join(directory,'missing','save.svg')));
  assert.deepEqual(session.document.toElement(),before); assert.deepEqual(session.historyState,history);
  assert.equal(session.sourcePath,null); session.undo(); assert.equal(session.document.find('r').attributes['x'],'1');
  await session.read(file); assert.equal(session.sourcePath,file); assert.throws(()=>session.redo(),/undo not allowed after io command/);
  await session.save(); assert.deepEqual(codec.decode(await store.read(file)).document.toElement(),session.document.toElement());
});
