import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorSession } from '../../src/application/EditorSession.js';
import { ShapeFactory } from '../../src/application/factories/ShapeFactory.js';
import { CreateCommand } from '../../src/application/commands/CreateCommand.js';
import { DeleteCommand } from '../../src/application/commands/DeleteCommand.js';
import { MoveCommand } from '../../src/application/commands/MoveCommand.js';
import { ScaleCommand } from '../../src/application/commands/ScaleCommand.js';
import { SetCommand } from '../../src/application/commands/SetCommand.js';
import { GroupCommand } from '../../src/application/commands/GroupCommand.js';
import { UngroupCommand } from '../../src/application/commands/UngroupCommand.js';
import { AddToCommand } from '../../src/application/commands/AddToCommand.js';
import { FrontCommand } from '../../src/application/commands/FrontCommand.js';
import { BackCommand } from '../../src/application/commands/BackCommand.js';
import { SvgDocument } from '../../src/domain/model/SvgDocument.js';
import { Rect } from '../../src/domain/model/Rect.js';
import { MemoryDocumentStore } from '../support/MemoryDocumentStore.js';
import { MemoryDocumentCodec } from '../support/MemoryDocumentCodec.js';

const context = () => {
  const store = new MemoryDocumentStore(), codec = new MemoryDocumentCodec();
  return {store,codec,session:new EditorSession(store,codec),factory:new ShapeFactory()};
};

test('every edit command is exactly one reversible unit including multi-node operations', () => {
  const {session,factory} = context(); session.init();
  session.execute(new CreateCommand(factory,'g','scene',[]));
  session.execute(new CreateCommand(factory,'rect','r',['1','2','3','4'],'scene'));
  session.execute(new CreateCommand(factory,'circle','c',['5','6','7'],'scene'));
  session.execute(new CreateCommand(factory,'text','t',['0','0','hello']));
  const commands = [new MoveCommand('r',.2,-.5),new ScaleCommand('scene',1.5),new SetCommand('t','text','开始'),
    new AddToCommand('scene','t'),new FrontCommand('r'),new BackCommand('r'),new GroupCommand('pair',['c','r']),
    new UngroupCommand('pair'),new DeleteCommand('r'),new CreateCommand(factory,'ellipse','e',['1','2','3','4'],'scene')];
  for (const command of commands) {
    const before = session.document.toElement(), count = session.historyState.undo;
    assert.ok(session.execute(command)); const after = session.document.toElement();
    assert.equal(session.historyState.undo,count+1);
    session.undo(); assert.deepEqual(session.document.toElement(),before);
    session.redo(); assert.deepEqual(session.document.toElement(),after); session.document.validate();
  }
});

test('snapshot undo avoids inverse floating arithmetic and remains reusable', () => {
  const {session,factory} = context(); session.init();
  session.execute(new CreateCommand(factory,'rect','r',['.1','.2','1','1']));
  session.execute(new MoveCommand('r',.2,.1));
  for (let i=0;i<3;i++) {
    const feedback = session.undo(); assert.equal(session.document.find('r').attributes['x'],'0.1');
    assert.match(feedback,/x=0\.1 y=0\.2/); assert.doesNotMatch(feedback,/x=0\.30000000000000004/);
    session.redo(); assert.equal(session.document.find('r').attributes['x'],String(.1+.2));
  }
});

test('failed edit and query preserve redo, while successful new edit clears the branch', () => {
  const {session,factory} = context(); session.init();
  session.execute(new CreateCommand(factory,'rect','r',['0','0','1','1']));
  session.execute(new MoveCommand('r',5,6)); session.undo();
  const state = session.historyState, document = session.document.toElement();
  assert.throws(()=>session.execute(new ScaleCommand('r',0)),/scale factor must be positive/);
  assert.equal(session.canvas(),'canvas 800x600');
  assert.deepEqual(session.historyState,state); assert.deepEqual(session.document.toElement(),document);
  session.redo(); assert.equal(session.document.find('r').attributes['x'],'5'); session.undo();
  session.execute(new SetCommand('r','fill','red'));
  assert.throws(()=>session.redo(),/nothing to redo/);
});

test('partial recursive overflow is rolled back along with the complete history state', () => {
  const {session,factory} = context(); session.init();
  session.execute(new CreateCommand(factory,'g','g',[]));
  session.execute(new CreateCommand(factory,'rect','first',['1','1','1','1'],'g'));
  session.execute(new CreateCommand(factory,'rect','huge',['1e308','0','1','1'],'g'));
  const before = session.document.toElement(), state = session.historyState;
  assert.throws(()=>session.execute(new ScaleCommand('g',2)),/finite/);
  assert.deepEqual(session.document.toElement(),before); assert.deepEqual(session.historyState,state);
});

test('successful save creates a barrier, failed edit does not unlock it, next edit cannot cross it', async () => {
  const {session,factory} = context(); session.init();
  session.execute(new CreateCommand(factory,'rect','r',['0','0','1','1']));
  await session.save('demo.svg');
  assert.throws(()=>session.undo(),/undo not allowed after io command/);
  assert.throws(()=>session.redo(),/undo not allowed after io command/);
  assert.throws(()=>session.execute(new DeleteCommand('missing')),/no such shape/);
  assert.throws(()=>session.undo(),/undo not allowed after io command/);
  session.execute(new MoveCommand('r',1,2)); session.undo();
  assert.equal(session.document.find('r').attributes['x'],'0');
  assert.throws(()=>session.undo(),/nothing to undo/);
});

test('failed read, decode, write, init and resize leave document, path and history untouched', async () => {
  const {session,factory,store,codec} = context(); const imported = new SvgDocument(10,20);
  imported.add(new Rect('r',0,0,1,1)); codec.seed('valid',imported); store.seed('original.svg','valid');
  await session.read('original.svg'); session.execute(new MoveCommand('r',2,3));
  const before = session.document.toElement(), history = session.historyState;
  await assert.rejects(session.read('missing.svg'),/cannot read file: missing.svg/);
  store.seed('bad.svg','bad'); await assert.rejects(session.read('bad.svg'),/invalid SVG/);
  store.failWrites(true); await assert.rejects(session.save('other.svg'),/cannot write file: other.svg/);
  assert.throws(()=>session.init(-1,2)); assert.throws(()=>session.canvas(20,-1));
  assert.throws(()=>session.canvas(20),/usage/);
  assert.deepEqual(session.document.toElement(),before); assert.deepEqual(session.historyState,history);
  assert.equal(session.sourcePath,'original.svg'); session.undo();
  assert.equal(session.document.find('r').attributes['x'],'0');
});

test('read warnings appear only on successful replacement; no-argument save retains read path', async () => {
  const {session,factory,store,codec} = context(); const document = new SvgDocument(10,20);
  document.add(new Rect('rect1',0,0,1,1));
  codec.seed('import',document,['warning: assigned id rect1 to unnamed <rect>']); store.seed('input.svg','import');
  const message = await session.read('input.svg');
  assert.equal(message,'warning: assigned id rect1 to unnamed <rect>\nread input.svg (1 elements)');
  session.execute(new SetCommand('rect1','fill','red')); await session.save('copy.svg');
  assert.equal(session.sourcePath,'input.svg'); await session.save();
  assert.equal(codec.decode(await store.read('input.svg')).document.find('rect1').attributes['fill'],'red');
  session.init(); await assert.rejects(session.save(),/no file path/);
  session.execute(new CreateCommand(factory,'g','g',[])); session.undo();
});

test('canvas query preserves history, while resize, read and init lock both stacks', async () => {
  const {session,factory,store,codec} = context(); session.init();
  session.execute(new CreateCommand(factory,'rect','r',['0','0','1','1']));
  session.execute(new MoveCommand('r',1,2)); session.undo();
  const history = session.historyState; session.canvas(); assert.deepEqual(session.historyState,history);
  session.canvas(300,200); assert.throws(()=>session.redo(),/undo not allowed after io command/);
  assert.deepEqual(session.document.viewBox,[0,0,300,200]);
  session.execute(new DeleteCommand('r')); session.init(); assert.equal(session.document.size,0);
  assert.throws(()=>session.undo(),/undo not allowed after io command/);
  codec.seed('empty',new SvgDocument()); store.seed('empty.svg','empty'); await session.read('empty.svg');
  assert.throws(()=>session.undo(),/undo not allowed after io command/);
});

test('no-document errors precede history and file-path checks', async () => {
  const {session} = context();
  assert.throws(()=>session.document,/no document\. use 'init' or 'read' first/);
  assert.throws(()=>session.execute(new DeleteCommand('r')),/no document/);
  assert.throws(()=>session.undo(),/no document/); assert.throws(()=>session.redo(),/no document/);
  assert.throws(()=>session.canvas(),/no document/); await assert.rejects(session.save(),/no document/);
});

test('command arguments are owned copies and reusing an executed command is rejected atomically', () => {
  const {session,factory} = context(); session.init();
  const parameters = ['1','2','3','4'], command = new CreateCommand(factory,'rect','r',parameters);
  parameters[0]='999'; session.execute(command); assert.equal(session.document.find('r').attributes['x'],'1');
  const history = session.historyState; assert.throws(()=>session.execute(command),/command already executed/);
  assert.deepEqual(session.historyState,history);
  session.execute(new CreateCommand(factory,'circle','c',['0','0','1']));
  const ids = ['r','c'], grouping = new GroupCommand('g',ids); ids[0]='missing';
  session.execute(grouping); assert.equal(session.document.find('g').children.length,2);
  session.execute(new DeleteCommand('g')); session.undo(); assert.equal(session.document.size,3);
});
