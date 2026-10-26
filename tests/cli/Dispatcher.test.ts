import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { EditorSession } from '../../src/application/EditorSession.js';
import { ShapeFactory } from '../../src/application/factories/ShapeFactory.js';
import { CommandDispatcher } from '../../src/cli/CommandDispatcher.js';
import { Repl } from '../../src/cli/Repl.js';
import { MemoryDocumentStore } from '../support/MemoryDocumentStore.js';
import { MemoryDocumentCodec } from '../support/MemoryDocumentCodec.js';

const context = () => {
  const session = new EditorSession(new MemoryDocumentStore(),new MemoryDocumentCodec());
  return {session,dispatcher:new CommandDispatcher(session,new ShapeFactory())};
};

test('CLI create supports all types in containers without mistaking quoted in or colors', async () => {
  const {session,dispatcher:d} = context();
  await d.dispatch('init'); await d.dispatch('create g scene');
  await d.dispatch('create g node in scene'); await d.dispatch('create rect r 1 2 3 4 #4a90d9 in node');
  await d.dispatch('create text t 2 3 "in" in node'); await d.dispatch('create circle c 1 2 3 red in node');
  await d.dispatch('create ellipse e 1 2 3 4 in scene'); await d.dispatch('create line l 1 2 3 4 black in scene');
  assert.equal(session.document.size,7); assert.equal(session.document.find('t').textContent,'in');
  assert.equal(session.document.find('r').attributes['fill'],'#4a90d9');
  await d.dispatch('set t text ""'); assert.equal(session.document.find('t').textContent,'');
  const tree = await d.dispatch('tree'); assert.match(tree!,/svg \(800x600\)/);
  assert.match(tree!,/├── g#node/); assert.match(tree!,/rect#r  x=1 y=2 w=3 h=4/);
  assert.match((await d.dispatch('tree node'))!,/^g#node/);
  assert.match((await d.dispatch('show t'))!,/parent=g#node/);
});

test('all command names and argument checks are registered; help is available before init', async () => {
  const {dispatcher:d} = context(); const help = await d.dispatch('help');
  for (const name of ['init','read','save','canvas','create','delete','move','scale','set','group','ungroup','addto','front','back','tree','show','help','undo','redo']) {
    assert.ok(help!.split('\n').some(line=>line===name || line.startsWith(`${name} `)),name);
  }
  await assert.rejects(d.dispatch('tree'),/no document/); await assert.rejects(d.dispatch('unknown'),/unknown command: unknown/);
  assert.equal(await d.dispatch(' # ignored'),null); await d.dispatch('init 400');
  assert.equal(await d.dispatch('canvas'),'canvas 400x600');
  await assert.rejects(d.dispatch('canvas 10'),/usage/); await assert.rejects(d.dispatch('move r NaN 2'),/invalid number/);
  await assert.rejects(d.dispatch('create box b 1 2 3 4 "title"'),/unknown shape type: box/);
});

test('display commands do not clear redo and editing commands execute through history', async () => {
  const {session,dispatcher:d} = context(); await d.dispatch('init');
  await d.dispatch('create rect r 0 0 1 1'); await d.dispatch('move r 3 4'); await d.dispatch('undo');
  const state = session.historyState;
  await d.dispatch('help'); await d.dispatch('tree'); await d.dispatch('show r'); await d.dispatch('canvas');
  assert.deepEqual(session.historyState,state); await d.dispatch('redo');
  assert.equal(session.document.find('r').attributes['x'],'3');
});

test('REPL continues after errors, sanitizes multi-line errors, supports scripts and EOF', async () => {
  const {dispatcher} = context(); let output='',errors='';
  const out = new Writable({write(chunk,_encoding,done){output+=chunk.toString();done();}});
  const err = new Writable({write(chunk,_encoding,done){errors+=chunk.toString();done();}});
  const input = Readable.from(['# comment\ninit\ncreate rect r 0 0 1 1\nscale r 0\n"bad\\nname"\nmove r 1 2\nshow r\n']);
  await new Repl(dispatcher,input,out,err,false).run();
  assert.equal(errors,'error: scale factor must be positive\nerror: unknown command: bad name\n');
  assert.match(output,/rect#r moved/); assert.match(output,/x="1"/); assert.doesNotMatch(output,/svg> /);
  let prompts=''; const interactiveOut = new Writable({write(chunk,_encoding,done){prompts+=chunk.toString();done();}});
  await new Repl(dispatcher,Readable.from(['canvas\n']),interactiveOut,err,true).run();
  assert.equal(prompts.match(/svg> /g)?.length,2);
});
