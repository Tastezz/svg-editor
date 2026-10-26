import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorSession } from '../../src/application/EditorSession.js';
import { ShapeFactory } from '../../src/application/factories/ShapeFactory.js';
import { CreateCommand } from '../../src/application/commands/CreateCommand.js';
import { DeleteCommand } from '../../src/application/commands/DeleteCommand.js';
import { MoveCommand } from '../../src/application/commands/MoveCommand.js';
import { ScaleCommand } from '../../src/application/commands/ScaleCommand.js';
import { GroupCommand } from '../../src/application/commands/GroupCommand.js';
import { AddToCommand } from '../../src/application/commands/AddToCommand.js';
import { SetCommand } from '../../src/application/commands/SetCommand.js';
import { FrontCommand } from '../../src/application/commands/FrontCommand.js';
import type { Shape } from '../../src/domain/model/Shape.js';
import { SvgCodec } from '../../src/infrastructure/svg/SvgCodec.js';
import { MemoryDocumentStore } from '../support/MemoryDocumentStore.js';

test('deterministic mixed edits preserve invariants, SVG semantics and complete undo/redo history', () => {
  const factory = new ShapeFactory(), codec = new SvgCodec(factory), session = new EditorSession(new MemoryDocumentStore(),codec);
  session.init(); const states = [session.document.toElement()]; let seed = 92341, successful = 0, rejected = 0;
  const random = (maximum: number) => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%maximum;};
  const walk = (shape: Shape): Shape[] => [shape,...shape.children.flatMap(walk)];
  for (let index=0;index<180;index++) {
    const shapes = session.document.root.children.flatMap(walk), chosen = shapes[random(shapes.length)];
    const groups = shapes.filter(shape=>shape.children.length || shape.tag==='g');
    const command = !chosen || index%7===0 ? new CreateCommand(factory,index%2 ? 'rect':'g',`n${index}`,index%2 ? ['1','2','3','4'] : []) :
      [()=>new MoveCommand(chosen.id,.25,-.5),()=>new ScaleCommand(chosen.id,1.25),
        ()=>new SetCommand(chosen.id,'fill',index%2?'red':'blue'),()=>new DeleteCommand(chosen.id),
        ()=>new GroupCommand(`pair${index}`,[chosen.id,shapes[random(shapes.length)]!.id]),
        ()=>groups.length ? new AddToCommand(groups[random(groups.length)]!.id,chosen.id) : new FrontCommand(chosen.id),
      ][random(6)]!();
    const before = session.document.toElement(), history = session.historyState;
    try {
      session.execute(command); successful++; states.push(session.document.toElement());
      session.document.validate();
      assert.deepEqual(codec.decode(codec.encode(session.document)).document.toElement(),session.document.toElement());
    } catch (error) {
      if (error instanceof assert.AssertionError) throw error;
      assert.ok(error instanceof Error);
      assert.match(error.message,/cannot group the same shape twice|cannot group a container into its own descendant|cannot move a container into its own descendant/);
      rejected++; assert.deepEqual(session.document.toElement(),before); assert.deepEqual(session.historyState,history);
    }
  }
  assert.ok(successful>100); assert.ok(rejected>0);
  for (let index=states.length-2;index>=0;index--) { session.undo(); assert.deepEqual(session.document.toElement(),states[index]); }
  for (let index=1;index<states.length;index++) { session.redo(); assert.deepEqual(session.document.toElement(),states[index]); }
});
