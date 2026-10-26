import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Transform } from '../../src/domain/model/Transform.js';

test('SVG translate then scale keeps the translation outside the scale', () => {
  const outer = new Transform(1,0,0,1,60,40);
  const inner = new Transform(1,0,0,1,200,0).multiply(new Transform(.8,0,0,.8));
  assert.deepEqual(outer.multiply(inner).point(60,38), [308,70.4]);
});

test('reparenting compensates for transformed ancestors without a visual jump', () => {
  const oldParent = new Transform(2,0,0,2,10,20);
  const newParent = new Transform(.5,0,0,.5,100,200);
  const local = new Transform(1,0,0,1,3,4);
  const compensated = newParent.inverse().multiply(oldParent).multiply(local);
  assert.deepEqual(newParent.multiply(compensated).point(7,9), oldParent.multiply(local).point(7,9));
});

test('inverse works for a rotated and translated matrix; invalid matrices fail', () => {
  const transform = new Transform(0,1,-1,0,30,40);
  assert.deepEqual(transform.inverse().point(...transform.point(3,8)), [3,8]);
  assert.throws(() => new Transform(0,0,0,0).inverse(), /singular/);
  assert.throws(() => new Transform(Infinity), /finite/);
});
