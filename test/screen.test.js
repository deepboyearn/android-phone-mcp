import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScreenUnavailableError, readScreenResult } from '../src/screen.js';
import { launchApp } from '../src/adb.js';

const png = Buffer.from('89504e470d0a1a0a00000000', 'hex');
test('idle failure returns screenshot with coordinate guidance', async () => {
  const result = await readScreenResult(async () => { throw new ScreenUnavailableError('could not get idle state'); }, async () => png);
  assert.equal(JSON.parse(result.content[0].text).mode, 'screenshot');
  assert.match(JSON.parse(result.content[0].text).guidance, /android_tap/);
  assert.equal(result.content[1].type, 'image');
  assert.deepEqual(Buffer.from(result.content[1].data, 'base64'), png);
});
test('normal screen preserves element-array contract without capturing a screenshot', async () => {
  const nodes = [{ text: 'Settings' }];
  const result = await readScreenResult(async () => nodes, async () => { throw Error('should not capture'); });
  assert.deepEqual(JSON.parse(result.content[0].text), nodes);
  assert.equal(result.content.length, 1);
});
test('empty accessible tree also returns an image', async () => {
  const result = await readScreenResult(async () => [], async () => png);
  assert.equal(JSON.parse(result.content[0].text).mode, 'screenshot');
});
test('offline errors do not become successful screenshots', async () => {
  await assert.rejects(readScreenResult(async () => { throw Error('offline'); }, async () => png), /offline/);
  await assert.rejects(readScreenResult(async () => [], async () => { throw Error('capture offline'); }), /capture offline/);
  await assert.rejects(readScreenResult(async () => [], async () => Buffer.from('invalid')), /PNG/);
});
test('launches resolved activity with deterministic current-user start and checks launch status', async () => {
  const calls = [];
  const result = await launchApp('com.example.app', async args => {
    calls.push(args);
    return calls.length === 1 ? 'priority=0\ncom.example.app/.MainActivity' : 'Starting: Intent\nStatus: ok\nActivity: com.example.app/.MainActivity';
  });
  assert.match(result, /Status: ok/);
  assert.deepEqual(calls[1], ['am','start','-W','--user','current','-n','com.example.app/.MainActivity']);
});
test('unlaunchable packages and failed activity starts report errors', async () => {
  await assert.rejects(launchApp('com.example.missing', async () => 'No activity found'), /No launchable activity/);
  let calls = 0;
  await assert.rejects(launchApp('com.example.app', async () => ++calls === 1 ? 'com.example.app/.MainActivity' : 'Error: Permission denied'), /did not confirm/);
});
