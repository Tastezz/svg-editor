import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tokenizer } from '../../src/cli/Tokenizer.js';

test('tokenizer preserves quotes, empty arguments, colors and text containing in', () => {
  const tokenizer = new Tokenizer();
  const tokens = tokenizer.tokenize('create text t 1 2 "hello in world" in g');
  assert.deepEqual(tokens.map(t=>t.value),['create','text','t','1','2','hello in world','in','g']);
  assert.equal(tokens[5]!.quoted,true); assert.equal(tokens[6]!.quoted,false);
  assert.deepEqual(tokenizer.tokenize('set t text ""').map(t=>t.value),['set','t','text','']);
  assert.deepEqual(tokenizer.tokenize('set r fill #4a90d9').map(t=>t.value),['set','r','fill','#4a90d9']);
  assert.deepEqual(tokenizer.tokenize('  # full line comment'),[]);
  assert.deepEqual(tokenizer.tokenize(' \t '),[]);
});

test('quoted paths and JSON escapes work; malformed quotes fail', () => {
  const tokenizer = new Tokenizer();
  assert.equal(tokenizer.tokenize('read "my files/图.svg"')[1]!.value,'my files/图.svg');
  assert.equal(tokenizer.tokenize('set t text "say \\"hi\\""')[3]!.value,'say "hi"');
  assert.throws(()=>tokenizer.tokenize('set t text "unfinished'),/unterminated/);
  assert.throws(()=>tokenizer.tokenize('set t text "a"b'),/separated/);
  assert.throws(()=>tokenizer.tokenize('set t text a"b"'),/quote must start/);
});
