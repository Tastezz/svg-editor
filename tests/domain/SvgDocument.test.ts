import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../../src/domain/model/SvgDocument.js';
import { Rect } from '../../src/domain/model/Rect.js';
import { Circle } from '../../src/domain/model/Circle.js';
import { Text } from '../../src/domain/model/Text.js';
import { Group } from '../../src/domain/model/Group.js';
import { Transform } from '../../src/domain/model/Transform.js';
import { DocumentSnapshot } from '../../src/domain/model/DocumentSnapshot.js';

test('document has global case-sensitive ids, root insertion and container-specific errors', () => {
  const doc = new SvgDocument();
  doc.add(new Group('g')); doc.add(new Rect('r',0,0,1,1),'g'); doc.add(new Circle('R',0,0,1));
  assert.equal(doc.size,3); assert.equal(doc.find('r').parent!.id,'g');
  assert.throws(() => doc.add(new Text('r',0,0,'')), /id already exists: r/);
  assert.throws(() => doc.container('missing'), /no such container: missing/);
  assert.throws(() => doc.container('r'), /not a container: r/);
  assert.throws(() => doc.find('missing'), /no such shape: missing/);
  doc.delete('g'); assert.equal(doc.has('r'),false); assert.equal(doc.size,1);
  doc.add(new Text('r',0,0,'')); doc.validate();
});

test('grouping preserves original sibling order and earliest selected position', () => {
  const doc = new SvgDocument();
  for (const id of ['a','b','c','d']) doc.add(new Rect(id,0,0,1,1));
  doc.group('g',['d','b']);
  assert.deepEqual(doc.root.children.map(s => s.id),['a','g','c']);
  assert.deepEqual(doc.find('g').children.map(s => s.id),['b','d']);
  assert.throws(() => doc.ungroup('g'), /cannot ungroup top-level container: g/);
});

test('cross-parent grouping uses LCA, original traversal order and world-transform compensation', () => {
  const doc = new SvgDocument(); const left = new Group('left'), right = new Group('right');
  left.setTransform(new Transform(2,0,0,2,10,20)); right.setTransform(new Transform(.5,0,0,.5,100,200));
  doc.add(left); doc.add(right); doc.add(new Rect('a',1,2,3,4),'left'); doc.add(new Rect('b',5,6,7,8),'right');
  const a = doc.find('a'), b = doc.find('b');
  const beforeA = a.worldTransform().point(1,2), beforeB = b.worldTransform().point(5,6);
  const group = doc.group('combined',['b','a']);
  assert.equal(group.parent,doc.root);
  assert.deepEqual(group.children.map(s => s.id),['a','b']);
  assert.deepEqual(a.worldTransform().point(1,2),beforeA);
  assert.deepEqual(b.worldTransform().point(5,6),beforeB);
});

test('illegal grouping and cycles are rejected before tree mutation', () => {
  const doc = new SvgDocument(); doc.add(new Group('outer')); doc.add(new Group('inner'),'outer');
  doc.add(new Rect('r',0,0,1,1),'inner');
  const before = doc.toElement();
  assert.throws(() => doc.group('bad',['r','outer']), /cannot group a container into its own descendant: outer/);
  assert.throws(() => doc.addTo('inner','outer'), /own descendant/);
  assert.throws(() => doc.addTo('inner','inner'), /own descendant/);
  assert.throws(() => doc.group('bad',['r','r']), /same shape twice/);
  assert.deepEqual(doc.toElement(),before); doc.validate();
});

test('ungroup promotes children at original position, preserving transform and inherited style', () => {
  const doc = new SvgDocument(); doc.add(new Group('outer'));
  doc.add(new Rect('before',0,0,1,1),'outer');
  const group = new Group('inner'); group.move(20,30); group.set('fill','red'); doc.add(group,'outer');
  doc.add(new Rect('a',1,2,3,4),'inner'); doc.add(new Text('b',3,4,'B'),'inner');
  doc.find('b').set('fill','blue'); doc.add(new Rect('after',0,0,1,1),'outer');
  const before = doc.find('a').worldTransform().point(1,2);
  doc.ungroup('inner');
  assert.deepEqual(doc.find('outer').children.map(s => s.id),['before','a','b','after']);
  assert.deepEqual(doc.find('a').worldTransform().point(1,2),before);
  assert.equal(doc.find('a').attributes['fill'],'red'); assert.equal(doc.find('b').attributes['fill'],'blue');
  assert.equal(doc.has('inner'),false); doc.validate();
});

test('addto appends, reorders within one parent and preserves transformed location', () => {
  const doc = new SvgDocument(); doc.add(new Group('g')); doc.find('g').move(100,200);
  doc.add(new Rect('a',1,2,3,4)); doc.add(new Rect('b',0,0,1,1),'g');
  const before = doc.find('a').worldTransform().point(1,2); doc.addTo('g','a');
  assert.deepEqual(doc.find('g').children.map(s=>s.id),['b','a']);
  assert.deepEqual(doc.find('a').worldTransform().point(1,2),before);
  doc.addTo('g','b'); assert.deepEqual(doc.find('g').children.map(s=>s.id),['a','b']);
  doc.back('b'); assert.deepEqual(doc.find('g').children.map(s=>s.id),['b','a']);
  doc.front('b'); assert.deepEqual(doc.find('g').children.map(s=>s.id),['a','b']);
});

test('snapshot restores independent class instances, parent links, id index and viewBox', () => {
  const doc = new SvgDocument(400,300); doc.setViewBox([-10,-20,200,150]);
  doc.add(new Group('g')); doc.add(new Circle('c',1,2,3),'g');
  const snapshot = new DocumentSnapshot(doc); doc.delete('g'); doc.resize(50,60);
  const restored = snapshot.restore();
  assert.equal(restored.width,400); assert.deepEqual(restored.viewBox,[-10,-20,200,150]);
  restored.find('c').move(3,4); assert.equal(restored.find('c').attributes['cx'],'4');
  assert.equal(restored.find('c').parent,restored.find('g'));
  assert.equal(snapshot.restore().find('c').attributes['cx'],'1');
});

test('batch insertion preflights descendant duplicates and canvas validation is atomic', () => {
  const doc = new SvgDocument(); doc.add(new Rect('existing',0,0,1,1));
  const group = new Group('new'); group.insert(new Rect('existing',0,0,1,1));
  assert.throws(()=>doc.add(group),/id already exists/); assert.equal(doc.has('new'),false);
  assert.throws(()=>doc.resize(100,-1)); assert.equal(doc.width,800); assert.equal(doc.height,600);
  assert.throws(()=>doc.setViewBox([0,0,0,100])); assert.deepEqual(doc.viewBox,[0,0,800,600]);
});

test('shared singular ancestor does not unnecessarily prevent grouping or reparenting', () => {
  const doc = new SvgDocument(), common = new Group('common'), left = new Group('left'), right = new Group('right');
  common.setTransform(new Transform(0,0,0,0,10,20)); left.move(20,30); right.move(100,200);
  doc.add(common); doc.add(left,'common'); doc.add(right,'common');
  doc.add(new Rect('a',1,2,3,4),'left'); doc.add(new Rect('b',3,4,5,6),'left');
  doc.addTo('right','a'); assert.deepEqual(doc.find('a').worldTransform().point(1,2),[10,20]);
  doc.group('pair',['b','a']); assert.equal(doc.find('pair').parent!.id,'common');
  doc.ungroup('pair'); assert.equal(doc.find('a').parent!.id,'common'); doc.validate();
});
