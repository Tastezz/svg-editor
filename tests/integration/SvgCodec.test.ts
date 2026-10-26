import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SvgCodec } from '../../src/infrastructure/svg/SvgCodec.js';
import { SvgTransformParser } from '../../src/infrastructure/svg/SvgTransformParser.js';
import { ShapeFactory } from '../../src/application/factories/ShapeFactory.js';
import { Rect } from '../../src/domain/model/Rect.js';
import { Text } from '../../src/domain/model/Text.js';
import { SvgDocument } from '../../src/domain/model/SvgDocument.js';

const svg = (content: string, attributes = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" ${attributes}>${content}</svg>`;

test('assignment SVG with six shape types and unnamed element survives semantic round-trip', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const result = codec.decode(readFileSync('tests/fixtures/other.svg','utf8'));
  assert.equal(result.document.size,7);
  assert.deepEqual(result.warnings,['warning: assigned id rect1 to unnamed <rect>']);
  const serialized = codec.encode(result.document);
  assert.match(serialized,/^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.deepEqual(codec.decode(serialized).document.toElement(),result.document.toElement());
  assert.equal(codec.decode(serialized).warnings.length,0);
});

test('missing ids skip every explicit id, including later elements and SVG root', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const result = codec.decode(svg('<rect/><g><rect/><text>开始</text></g><rect id="rect1"/>','id="rect2"'));
  assert.deepEqual(result.warnings,[
    'warning: assigned id rect3 to unnamed <rect>', 'warning: assigned id g1 to unnamed <g>',
    'warning: assigned id rect4 to unnamed <rect>', 'warning: assigned id text1 to unnamed <text>',
  ]);
  assert.throws(()=>result.document.add(new Rect('rect2',0,0,1,1)),/id already exists: rect2/);
  assert.throws(()=>codec.decode(svg('<rect id="r"/><circle id="r"/>')),/id already exists: r/);
  assert.throws(()=>codec.decode(svg('<rect id="root"/>','id="root"')),/id already exists: root/);
});

test('text, CDATA, escaping, empty text and absent default styles are preserved', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const result = codec.decode(svg('<text id="t" x="1" y="2"><![CDATA[开始 & <End> "ok"]]></text><text id="empty"/><rect id="r"/>'));
  const encoded = codec.encode(result.document), restored = codec.decode(encoded).document;
  assert.equal(restored.find('t').textContent,'开始 & <End> "ok"');
  assert.equal(restored.find('empty').textContent,'');
  assert.equal(restored.find('r').attributes['fill'],undefined);
  assert.equal(restored.find('r').attributes['stroke'],undefined);
  assert.match(encoded,/&amp; &lt;End/);
});

test('nested transforms, font attributes, root metadata and custom viewBox round-trip', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const document = codec.decode(readFileSync('examples/transforms.svg','utf8')).document;
  const label = document.find('text1'); assert.deepEqual(label.worldTransform().point(60,38),[308,70.4]);
  const restored = codec.decode(codec.encode(document)).document;
  assert.deepEqual(restored.toElement(),document.toElement());
  assert.equal(restored.find('text1').attributes['font-size'],'16');
  const metadata = codec.decode(svg('<rect id="r" x="-2px" width="10px"/>','version="1.1" preserveAspectRatio="xMidYMid meet" viewBox="-10 -20 200 150"')).document;
  assert.deepEqual(metadata.viewBox,[-10,-20,200,150]);
  assert.equal(metadata.find('r').attributes['x'],'-2');
  assert.equal(codec.decode(codec.encode(metadata)).document.toElement().attributes['version'],'1.1');
});

test('inline presentation styles override attributes and normalize supported px lengths', () => {
  const codec = new SvgCodec(new ShapeFactory());
  const document = codec.decode(svg('<rect id="r" width="10" fill="red" style="fill: blue; stroke-width: 2px"/>')).document;
  assert.equal(document.find('r').attributes['fill'],'blue');
  assert.equal(document.find('r').attributes['stroke-width'],'2');
  document.find('r').set('fill','green');
  assert.equal(codec.decode(codec.encode(document)).document.find('r').attributes['fill'],'green');
});

test('malformed or unsupported SVG fails explicitly instead of losing content', () => {
  const codec = new SvgCodec(new ShapeFactory());
  for (const source of [
    '<svg><g></svg>', '<not-svg/>', svg('<path id="p" d="M0 0"/>'),
    svg('<rect id="r" onclick="alert(1)"/>'), svg('<text id="t"><tspan>mixed</tspan></text>'),
    svg('<rect id="r" class="external-style"/>'), svg('<rect id="r" x="NaN"/>'),
    '<!DOCTYPE svg><svg/>', '<?xml-stylesheet href="x.css"?><svg/>',
    '<svg xmlns="https://example.invalid/not-svg"/>', svg('<rect xmlns="" id="r"/>'),
    svg('<rect id="r"/>','viewBox="0 0 0 20"'),
    svg('<rect id="r"/>','width="100%"'), svg('<rect id="r" __proto__="unsupported"/>'),
  ]) assert.throws(()=>codec.decode(source),source);
});

test('transform parser supports SVG mathematical grammar, including rotation centers and skew', () => {
  const parser = new SvgTransformParser();
  assert.deepEqual(parser.parse('translate(60 40) scale(.8)').point(60,38),[108,70.4]);
  const rotated = parser.parse('rotate(90 10 20)').point(11,20);
  assert.ok(Math.abs(rotated[0]-10)<1e-12); assert.ok(Math.abs(rotated[1]-21)<1e-12);
  assert.deepEqual(parser.parse('matrix(1,0,0,1,3,4)').point(1,2),[4,6]);
  assert.ok(Math.abs(parser.parse('skewX(45)').point(1,2)[0]-3)<1e-12);
  assert.ok(Math.abs(parser.parse('skewY(45)').point(1,2)[1]-3)<1e-12);
  for (const value of ['rotate(1 2)','scale()','translate(1,,2)','matrix(1 2)','scale(1),','bogus(1)','translate(1)garbage']) {
    assert.throws(()=>parser.parse(value),value);
  }
});

test('XML character validity and CR references are handled beyond parser defaults', () => {
  const codec = new SvgCodec(new ShapeFactory()), document = new SvgDocument();
  for (const value of ['\0','\u0007','\uFFFF','\uD800']) {
    assert.throws(()=>new Text('bad',0,0,value),/invalid XML character/);
    assert.throws(()=>codec.decode(svg(`<text id="t">${value}</text>`)),/invalid XML character/);
  }
  assert.throws(()=>codec.decode(svg('<text id="t">&#0;</text>')),/invalid XML character/);
  document.add(new Text('valid',0,0,'中文 😀\r\nline\tend'));
  const encoded = codec.encode(document); assert.match(encoded,/&#13;/);
  assert.equal(codec.decode(encoded).document.find('valid').textContent,'中文 😀\r\nline\tend');
});
