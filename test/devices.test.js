import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DeviceManager } from '../src/devices.js';
import { resolveAdb, parseDiscovery } from '../src/adb.js';
import { join } from 'node:path';

function fixture() {
  const phones = new Map([
    ['wifi-one', { id: 'phone-one', model: 'Pixel 9', android: '16' }],
    ['mdns-one', { id: 'phone-one', model: 'Pixel 9', android: '16' }],
    ['usb-two', { id: 'phone-two', model: 'Galaxy S24', android: '15' }],
  ]);
  const manager = new DeviceManager(async () => [...phones.keys()].map(serial => ({serial, state: 'device'})), async args => {
    const phone = phones.get(args[1]);
    return ({ 'getprop ro.serialno': phone.id, 'getprop ro.product.model': phone.model, 'getprop ro.build.version.release': phone.android })[args[3]];
  }, {});
  return { manager, phones };
}

test('deduplicates aliases and requires a choice with two different phones', async () => {
  const {manager} = fixture();
  const inventory = await manager.inventory();
  assert.equal(inventory.devices.length, 2);
  assert.deepEqual(inventory.devices[0].connections, ['wifi-one', 'mdns-one']);
  await assert.rejects(manager.target(), /Multiple phones/);
});
test('selects by model, overrides per call, follows changed port, never falls back to other phone', async () => {
  const {manager, phones} = fixture();
  await manager.select('Pixel 9');
  assert.equal(await manager.target(), 'wifi-one');
  assert.equal(await manager.target('phone-two'), 'usb-two');
  assert.equal(await manager.target(), 'wifi-one');
  const phone = phones.get('wifi-one');
  phones.delete('wifi-one'); phones.delete('mdns-one');
  phones.set('new-wifi-port', phone);
  assert.equal(await manager.target(), 'new-wifi-port');
  phones.delete('new-wifi-port');
  await assert.rejects(manager.target(), /offline or unknown/);
});
test('same model is ambiguous; exact id works', async () => {
  const {manager, phones} = fixture();
  phones.get('usb-two').model = 'Pixel 9';
  await assert.rejects(manager.select('Pixel 9'), /More than one/);
  assert.equal((await manager.select('phone-two')).id, 'phone-two');
});
test('single physical phone auto-selects, even with two aliases', async () => {
  const {manager, phones} = fixture(); phones.delete('usb-two');
  assert.equal(await manager.target(), 'wifi-one');
});
test('missing phones explain connection steps', async () => {
  const {manager, phones} = fixture(); phones.clear();
  await assert.rejects(manager.target(), /No authorized phone/);
});
test('unknown hardware IDs do not merge separate devices', async () => {
  const {manager, phones} = fixture();
  for (const phone of phones.values()) phone.id = 'unknown';
  assert.equal((await manager.inventory()).devices.length, 3);
});
test('ADB discovery finds pairing and connection services only', () => {
  assert.deepEqual(parseDiscovery('List of discovered mdns services\nabc _adb-tls-pairing._tcp 192.168.1.4:1234\nabc _adb-tls-connect._tcp. 192.168.1.4:5678\nprinter _ipp._tcp 192.168.1.8:631').map(s => s.pairing), [true,false]);
});
test('ADB location supports SDK env vars, macOS, Linux and PATH', () => {
  assert.equal(resolveAdb({ ADB_PATH: '/custom/adb' }, '/home/test', 'linux', () => false), '/custom/adb');
  assert.equal(resolveAdb({ANDROID_HOME: '/sdk'}, '/home/test', 'linux', () => true), join('/sdk','platform-tools','adb'));
  const mac = join('/Users/test','Library','Android','sdk','platform-tools','adb');
  assert.equal(resolveAdb({}, '/Users/test', 'darwin', p => p === mac), mac);
  const linux = join('/home/test','Android','Sdk','platform-tools','adb');
  assert.equal(resolveAdb({}, '/home/test', 'linux', p => p === linux), linux);
  assert.equal(resolveAdb({}, '/home/test', 'linux', () => false), 'adb');
});
test('explicit and runtime selections override optional environment defaults', async () => {
  const {manager} = fixture();
  manager.env = { ANDROID_HARDWARE_SERIAL: 'phone-one' };
  assert.equal(await manager.target(), 'wifi-one');
  assert.equal(await manager.target('phone-two'), 'usb-two');
  await manager.select('phone-two');
  assert.equal(await manager.target(), 'usb-two');
});
