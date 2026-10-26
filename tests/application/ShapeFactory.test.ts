import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShapeFactory } from '../../src/application/factories/ShapeFactory.js';
import { Transform } from '../../src/domain/model/Transform.js';

test('one factory creates all six built-ins with omitted and explicit styles', () => {
  const factory = new ShapeFactory();
  const cases: [string,string[]][] = [['rect',['1','2','3','4']],['circle',['1','2','3']],
    ['ellipse',['1','2','3','4']],['line',['1','2','3','4']],['text',['1','2','My Diagram']],['g',[]]];
  for (const [type,parameters] of cases) {
    const shape = factory.create(type,type,parameters);
    assert.equal(shape.tag,type); assert.equal(shape.attributes['fill'],undefined);
  }
  assert.equal(factory.create('rect','r',['0','0','1','1','red']).attributes['fill'],'red');
  assert.equal(factory.create('line','l',['0','0','1','1','black']).attributes['stroke'],'black');
});

test('factory enforces shape schema, numeric validity and Phase 1 type boundary', () => {
  const factory = new ShapeFactory();
  assert.throws(()=>factory.create('rect','r',['0','0','1']),/invalid shape parameters/);
  assert.throws(()=>factory.create('g','g',['extra']),/invalid shape parameters/);
  assert.throws(()=>factory.create('circle','c',['0','0','-1']),/negative/);
  assert.throws(()=>factory.create('text','t',['NaN','0','text']),/invalid number/);
  assert.throws(()=>factory.create('box','b',[]),/^Error: unknown shape type: box \(is the plugin loaded\?\)$/);
});

test('SVG reconstruction uses same factory and preserves nested types and metadata', () => {
  const factory = new ShapeFactory();
  const group = factory.fromSvg({tag:'g',attributes:{id:'g','data-kind':'box',fill:'red'},text:null,
    transform:new Transform(2,0,0,2,10,20),children:[{
      tag:'text',attributes:{id:'t',x:'3',y:'4','font-size':'16'},text:'开始 & <End>',
      transform:new Transform(),children:[],
    }]});
  assert.equal(group.tag,'g'); assert.equal(group.attributes['data-kind'],'box');
  assert.equal(group.children[0]!.textContent,'开始 & <End>');
  assert.equal(group.children[0]!.attributes['font-size'],'16');
  assert.deepEqual(group.children[0]!.worldTransform().point(3,4),[16,28]);
});
