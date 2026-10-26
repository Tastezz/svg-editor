import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rect } from '../../src/domain/model/Rect.js';
import { Circle } from '../../src/domain/model/Circle.js';
import { Ellipse } from '../../src/domain/model/Ellipse.js';
import { Line } from '../../src/domain/model/Line.js';
import { Text } from '../../src/domain/model/Text.js';
import { Group } from '../../src/domain/model/Group.js';
import { Numeric } from '../../src/domain/model/Numeric.js';
import { Transform } from '../../src/domain/model/Transform.js';

test('all leaf shapes move and scale positions as well as sizes', () => {
  const shapes = [new Rect('r',1,2,3,4), new Circle('c',1,2,3),
    new Ellipse('e',1,2,3,4), new Line('l',1,2,3,4), new Text('t',1,2,'开始')];
  const expected = [
    {id:'r',x:'8',y:'2',width:'6',height:'8'},
    {id:'c',cx:'8',cy:'2',r:'6'},
    {id:'e',cx:'8',cy:'2',rx:'6',ry:'8'},
    {id:'l',x1:'8',y1:'2',x2:'12',y2:'6'},
    {id:'t',x:'8',y:'2'},
  ];
  shapes.forEach((shape,index) => {
    shape.move(3,-1); shape.scale(2);
    assert.deepEqual(shape.attributes, expected[index]);
    assert.deepEqual(shape.clone().toElement(), shape.toElement());
  });
  assert.equal(shapes[4]!.textContent,'开始');
});

test('whitelists belong to each shape and style omission stays omitted', () => {
  const rect = new Rect('r',0,0,10,20);
  assert.equal(rect.attributes['fill'],undefined);
  rect.set('width','0'); rect.set('fill','#4a90d9'); rect.set('stroke-width','.5');
  assert.equal(rect.attributes['width'],'0');
  assert.equal(rect.attributes['stroke-width'],'0.5');
  assert.throws(() => rect.set('width','-1'), /negative/);
  assert.throws(() => rect.set('cx','20'), /unknown attribute: cx/);
  assert.throws(() => rect.set('id','other'), /unknown attribute: id/);
  assert.throws(() => rect.set('stroke-width','Infinity'), /invalid number/);
  const text = new Text('t',0,0,'original'); text.set('text','');
  assert.equal(text.textContent,'');
  const group = new Group('g'); group.set('fill','red');
  assert.throws(() => group.set('x','1'), /unknown attribute: x/);
});

test('group move is coherent across nested transforms; scale visits every descendant once', () => {
  const outer = new Group('outer'), inner = new Group('inner'), rect = new Rect('r',1,2,3,4);
  inner.setTransform(new Transform(2,0,0,2,10,20));
  inner.insert(rect); outer.insert(inner);
  const before = rect.worldTransform().point(1,2);
  outer.move(30,-5);
  assert.deepEqual(rect.worldTransform().point(1,2),[before[0]+30,before[1]-5]);
  rect.set('stroke-width','3'); outer.scale(2);
  assert.equal(rect.attributes['x'],'2'); assert.equal(rect.attributes['width'],'6');
  assert.equal(rect.attributes['stroke-width'],'3');
  assert.deepEqual(rect.worldTransform().point(2,4),[(before[0]+30)*2,(before[1]-5)*2]);
  assert.throws(() => outer.scale(0), /scale factor must be positive/);
});

test('leaf move compensates its own transform in parent coordinates', () => {
  const rect = new Rect('r',1,2,3,4);
  rect.setTransform(new Transform(2,0,0,2,10,20));
  const before = rect.worldTransform().point(1,2);
  rect.move(4,6);
  assert.equal(rect.attributes['x'],'3'); assert.equal(rect.attributes['y'],'5');
  assert.deepEqual(rect.worldTransform().point(3,5),[before[0]+4,before[1]+6]);
});

test('encapsulation prevents mutation through returned collections and clones', () => {
  const group = new Group('g'), rect = new Rect('r',1,2,3,4);
  group.insert(rect); rect.set('fill','red');
  (group.children as unknown[]).length=0;
  const attributes = rect.attributes as Record<string,string>; attributes['x']='999';
  assert.equal(group.children.length,1); assert.equal(rect.attributes['x'],'1');
  const copy = group.clone(); copy.children[0]!.set('fill','blue');
  assert.equal(rect.attributes['fill'],'red');
  assert.equal(copy.children[0]!.parent,copy);
});

test('numeric validation rejects coercion, non-finite values and invalid dimensions', () => {
  for (const value of ['', ' ', 'NaN', 'Infinity', '0xff', '1e999']) assert.throws(() => Numeric.parse(value));
  assert.equal(Numeric.parse('-.25e2'),-25);
  assert.throws(() => new Circle('c',0,0,-1));
  assert.throws(() => new Line('l',NaN,0,0,0));
  assert.throws(() => new Text('',0,0,''), /invalid id/);
  assert.equal(Numeric.format(-0),'0');
});
