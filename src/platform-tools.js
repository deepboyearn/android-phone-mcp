import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname, resolve, sep } from 'node:path';
import { unzipSync } from 'fflate';

const manifest = JSON.parse(await readFile(new URL('./platform-tools.json', import.meta.url), 'utf8'));

export function verifyArchive(data, expected) {
  if (data.length !== expected.size || createHash('sha256').update(data).digest('hex') !== expected.sha256) {
    throw new Error('Official Platform Tools download failed checksum verification. Nothing was installed.');
  }
}

export function safeEntries(data) {
  let total = 0;
  return unzipSync(data, { filter: file => {
    const name = file.name;
    if (!name.startsWith('platform-tools/') || name.includes('\\') || name.includes(':') || name.split('/').some(part => part === '..' || part === '.')) {
      throw new Error('Unsafe path in Platform Tools archive.');
    }
    total += file.originalSize;
    if (total > 200 * 1024 * 1024) throw new Error('Platform Tools archive is too large.');
    return true;
  } });
}

export async function installPlatformTools({
  platform = process.platform, arch = process.arch,
  cacheRoot = process.env.ANDROID_MCP_CACHE_DIR || join(homedir(), '.cache', 'android-phone-mcp'),
  fetchImpl = fetch, releases = manifest, log = message => console.error(message),
} = {}) {
  if (!['x64', 'arm64'].includes(arch) || (platform === 'linux' && arch !== 'x64') || !releases[platform]) {
    throw new Error('Automatic ADB setup supports Windows/macOS x64 or arm64 and Linux x64. Install a compatible ADB yourself and set ADB_PATH on other systems.');
  }
  const release = releases[platform];
  const root = resolve(cacheRoot, `${release.version}-${platform}-${release.sha256.slice(0,12)}`);
  const executable = join(root, 'platform-tools', platform === 'win32' ? 'adb.exe' : 'adb');
  const ready = async () => {
    try {
      await access(executable);
      return (await readFile(join(root, '.complete'), 'utf8')) === release.sha256;
    } catch { return false; }
  };
  if (await ready()) return executable;
  if (!release.url.startsWith('https://dl.google.com/android/repository/')) throw new Error('ADB download must use the official Google repository.');
  log('Downloading official Android Platform Tools from Google (first use only)...');
  const response = await fetchImpl(release.url, { signal: AbortSignal.timeout(120000), redirect: 'error' });
  if (!response.ok) throw new Error(`Platform Tools download failed: HTTP ${response.status}. Check your internet connection.`);
  if (Number(response.headers.get('content-length') || 0) > release.size) throw new Error('Unexpected Platform Tools download size.');
  // Bound streamed input before allocating/decompressing it.
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > release.size) throw new Error('Unexpected Platform Tools download size.');
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks);
  verifyArchive(data, release);
  const entries = safeEntries(data);
  const expectedName = `platform-tools/${platform === 'win32' ? 'adb.exe' : 'adb'}`;
  if (!entries[expectedName]) throw new Error('Verified archive did not contain ADB.');
  // Unfinished downloads live only in a new random directory, never the live cache.
  const staging = `${root}.tmp-${randomUUID()}`;
  await mkdir(staging, { recursive: true });
  for (const [name, bytes] of Object.entries(entries)) {
    if (name.endsWith('/')) continue;
    const destination = resolve(staging, ...name.split('/'));
    if (!destination.startsWith(staging + sep)) throw new Error('Unsafe extraction path.');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes, { mode: 0o755 });
  }
  await writeFile(join(staging, '.complete'), release.sha256);
  try { await rename(staging, root); }
  catch (error) { if (!await ready()) throw error; }
  log('Android Platform Tools ready.');
  return executable;
}
