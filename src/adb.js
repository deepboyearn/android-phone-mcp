import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { AsyncLocalStorage } from 'node:async_hooks';
import { homedir } from 'node:os';
import { DeviceManager } from './devices.js';
import { installPlatformTools } from './platform-tools.js';

const run = promisify(execFile);
export function resolveAdb(env = process.env, home = homedir(), platform = process.platform, exists = existsSync) {
  if (env.ADB_PATH) return env.ADB_PATH;
  const executable = platform === 'win32' ? 'adb.exe' : 'adb';
  const roots = [env.ANDROID_HOME, env.ANDROID_SDK_ROOT,
    env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Android', 'Sdk'),
    join(home, 'Library', 'Android', 'sdk'), join(home, 'Android', 'Sdk')].filter(Boolean);
  return roots.map(root => join(root, 'platform-tools', executable)).find(exists) || 'adb';
}
let adbPath = resolveAdb();
let installPromise;
const context = new AsyncLocalStorage();
export const withDevice = (device, fn) => context.run(device, fn);
export const quote = value => "'" + String(value).replaceAll("'", "'\\''") + "'";

export async function adb(args, binary = false) {
  try {
    const { stdout } = await run(adbPath, args, {
      encoding: binary ? 'buffer' : 'utf8', timeout: 25000,
      maxBuffer: 24 * 1024 * 1024, windowsHide: true,
    });
    return binary ? stdout : stdout.trim();
  } catch (error) {
    if (error.code === 'ENOENT' && adbPath === 'adb' && process.env.ANDROID_MCP_AUTO_ADB !== '0') {
      installPromise ||= installPlatformTools().catch(error => { installPromise = undefined; throw error; });
      adbPath = await installPromise;
      return adb(args, binary);
    }
    if (args[0] === 'pair') throw new Error('Pairing failed. Open a fresh pairing-code dialog and use its address and current six-digit code.');
    if (error.code === 'ENOENT') throw new Error('ADB not found. Install Android SDK Platform Tools, add it to PATH, or set ADB_PATH.');
    const detail = String(error.stderr || error.message).trim();
    throw new Error(`ADB failed: ${detail}. Check Wireless debugging and the Wi-Fi connection.`);
  }
}

export async function devices() {
  const output = await adb(['devices', '-l']);
  return output.split(/\r?\n/).slice(1).filter(Boolean).map(line => {
    const [serial, state, ...details] = line.trim().split(/\s+/);
    return { serial, state, details: details.join(' ') };
  });
}

export const manager = new DeviceManager(devices, adb);
export const target = () => manager.target(context.getStore());

export function parseDiscovery(output) {
  return output.split(/\r?\n/).map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length >= 3 && /^_adb(?:-tls-(?:connect|pairing))?\._tcp\.?$/.test(parts[1]))
    .map(([name, service, address]) => ({ name, service, address, pairing: service.includes('pairing') }));
}
export const discover = async () => parseDiscovery(await adb(['mdns', 'services']));

export async function shell(args) {
  return adb(['-s', await target(), 'shell', args.map(quote).join(' ')]);
}

export function parseScreen(xml) {
  const root = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', parseAttributeValue: false }).parse(xml);
  const nodes = [];
  function visit(node) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const bounds = /^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/.exec(node.bounds || '');
    if (bounds) {
      const [x1,y1,x2,y2] = bounds.slice(1).map(Number);
      nodes.push({
        text: node.text || '', description: node['content-desc'] || '',
        resourceId: node['resource-id'] || '', class: node.class || '',
        clickable: node.clickable === 'true', enabled: node.enabled === 'true',
        bounds: [x1,y1,x2,y2], center: { x: Math.floor((x1+x2)/2), y: Math.floor((y1+y2)/2) },
      });
    }
    visit(node.node);
  }
  visit(root.hierarchy?.node);
  return nodes;
}

export async function screenNodes() {
  const serial = await target();
  // exec-out avoids writing the private UI dump to the phone's shared storage.
  const output = await adb(['-s', serial, 'exec-out', 'uiautomator dump /dev/tty']);
  const start = output.indexOf('<?xml');
  const end = output.lastIndexOf('</hierarchy>');
  if (start < 0 || end < 0) throw new Error('Android could not read this screen. Try a screenshot or unlock the phone.');
  return parseScreen(output.slice(start, end + '</hierarchy>'.length));
}
