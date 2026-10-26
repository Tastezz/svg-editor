import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

test('XML candidate preserves order, text, escaping and absent attributes', () => {
  const xml = '<svg xmlns="http://www.w3.org/2000/svg"><g id="g"><rect id="r"/><text id="t">开始 &amp; &lt;End&gt;</text></g></svg>';
  const parser = new DOMParser({ onError: (_level, message) => { throw new Error(message); } });
  const document = parser.parseFromString(xml, 'image/svg+xml');
  const group = document.documentElement!.firstChild!;
  assert.equal(group.firstChild!.nodeName, 'rect');
  assert.equal(group.lastChild!.textContent, '开始 & <End>');
  assert.equal(document.getElementsByTagName('rect')[0]!.hasAttribute('fill'), false);
  const restored = parser.parseFromString(new XMLSerializer().serializeToString(document), 'image/svg+xml');
  assert.equal(restored.getElementsByTagName('text')[0]!.textContent, '开始 & <End>');
});

test('bad XML fails instead of silently repairing input', () => {
  const parser = new DOMParser({ onError: (_level, message) => { throw new Error(message); } });
  assert.throws(() => parser.parseFromString('<svg><g></svg>', 'image/svg+xml'));
  assert.throws(() => parser.parseFromString('<svg><rect id="a" id="b"/></svg>', 'image/svg+xml'));
});
