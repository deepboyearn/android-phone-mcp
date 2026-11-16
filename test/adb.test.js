import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote, parseScreen } from '../src/adb.js';

test('remote-shell values stay one literal argument', () => {
  assert.equal(quote("a'b; $(id)"), "'a'\\''b; $(id)'");
  assert.equal(quote('a b & c'), "'a b & c'");
});
test('extract nested UI nodes and preserve text as strings', () => {
  const nodes = parseScreen('<?xml version="1.0"?><hierarchy><node text="0012" enabled="true" bounds="[0,0][100,200]"><node text="A &amp; B" clickable="true" enabled="true" bounds="[10,20][30,40]"/></node></hierarchy>');
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].text, '0012');
  assert.equal(nodes[1].text, 'A & B');
  assert.deepEqual(nodes[1].center, { x: 20, y: 30 });
});
