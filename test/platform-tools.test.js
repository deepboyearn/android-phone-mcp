import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { verifyArchive, safeEntries, installPlatformTools } from '../src/platform-tools.js';

const archive = zipSync({ 'platform-tools/adb': strToU8('test binary'), 'platform-tools/NOTICE.txt': strToU8('license') });
const release = { version: 'test', url: 'https://dl.google.com/android/repository/test.zip', size: archive.length, sha256: createHash('sha256').update(archive).digest('hex') };

test('modified archives are rejected before decompression', () => {
  assert.doesNotThrow(() => verifyArchive(archive, release));
  assert.throws(() => verifyArchive(Buffer.from('corrupt'), release), /checksum/);
});
test('archive paths cannot escape platform-tools', () => {
  for (const name of ['../escape', 'platform-tools/../../escape', 'platform-tools/C:evil', 'platform-tools/..\\escape']) {
    const zip = zipSync({ [name]: strToU8('bad') });
    assert.throws(() => safeEntries(zip), /Unsafe path/);
  }
});
test('install downloads once, preserves notices, and reuses complete verified cache', async t => {
  const cacheRoot = await mkdtemp(join(tmpdir(), 'android-mcp-test-'));
  t.after(async () => {
    assert.ok(resolve(cacheRoot).startsWith(resolve(tmpdir(), 'android-mcp-test-')));
    await rm(cacheRoot, { recursive: true, force: true });
  });
  let downloads = 0;
  const options = { platform: 'linux', arch: 'x64', cacheRoot, releases: {linux: release}, log() {}, fetchImpl: async () => { downloads++; return new Response(archive); } };
  const executable = await installPlatformTools(options);
  assert.equal(await readFile(executable, 'utf8'), 'test binary');
  assert.equal(await readFile(join(executable, '..', 'NOTICE.txt'), 'utf8'), 'license');
  assert.equal(await installPlatformTools(options), executable);
  assert.equal(downloads, 1);
});
test('unsupported platform and excessive download size fail clearly', async () => {
  await assert.rejects(installPlatformTools({ platform: 'linux', arch: 'arm64' }), /compatible ADB/);
  await assert.rejects(installPlatformTools({ platform: 'linux', arch: 'x64', releases: { linux: { ...release, version: 'oversize-test', size: 1 } }, fetchImpl: async () => new Response(archive), log() {} }), /download size/);
});
