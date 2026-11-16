import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const client = new Client({ name: 'phone-smoke-test', version: '1.0.0' });
const transport = new StdioClientTransport({
  command: process.env.MCP_COMMAND || process.env.MCP_NODE_PATH || process.execPath,
  args: process.env.MCP_COMMAND ? [] : [fileURLToPath(new URL('../src/cli.js', import.meta.url))],
  cwd: process.env.MCP_TEST_CWD,
  env: { ...process.env },
});
try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 15);
  console.log(`PASS: MCP handshake and ${tools.length} tools`);
  const inventory = await client.callTool({ name: 'android_devices', arguments: {} });
  assert.ok(!inventory.isError);
  const phone = JSON.parse(inventory.content[0].text).devices[0];
  assert.ok(phone, 'Connect a phone before running the live smoke test.');
  const selection = await client.callTool({ name: 'android_select_device', arguments: { selector: phone.id } });
  assert.ok(!selection.isError);
  console.log('PASS: select phone from inventory without preset serial');
  const discovery = await client.callTool({ name: 'android_discover', arguments: {} });
  assert.ok(!discovery.isError);
  assert.ok(Array.isArray(JSON.parse(discovery.content[0].text)));
  console.log('PASS: wireless service discovery');
  const connection = phone.connections.find(s => /^(?:\d{1,3}\.){3}\d{1,3}:\d+$/.test(s));
  if (connection) {
    const connected = await client.callTool({ name: 'android_connect', arguments: { address: connection } });
    assert.ok(!connected.isError, JSON.stringify(connected));
    console.log('PASS: connect paired phone using discovered connection address');
  }
  const invalidCode = await client.callTool({ name: 'android_pair', arguments: { address: 'localhost:12345', code: 'bad-code' } });
  assert.ok(invalidCode.isError);
  console.log('PASS: malformed pairing code rejected before ADB');
  const invalidAddress = await client.callTool({ name: 'android_connect', arguments: { address: 'localhost:99999' } });
  assert.ok(invalidAddress.isError);
  console.log('PASS: invalid connection port rejected');
  for (const name of ['android_devices','android_info','android_screenshot','android_screen']) {
    const result = await client.callTool({ name, arguments: {} });
    assert.ok(!result.isError, `${name}: ${JSON.stringify(result)}`);
    if (name === 'android_screenshot') assert.equal(result.content[0].mimeType, 'image/png');
    if (name === 'android_screen') assert.ok(JSON.parse(result.content[0].text).length > 0);
    console.log(`PASS: ${name}`);
  }
  const rejected = await client.callTool({ name: 'android_tap', arguments: { x: -1, y: 0 } });
  assert.ok(rejected.isError);
  console.log('PASS: invalid coordinate rejected');
  const unicode = await client.callTool({ name: 'android_type', arguments: { text: 'नमस्ते' } });
  assert.ok(unicode.isError);
  console.log('PASS: unsupported text rejected');
  const missing = await client.callTool({ name: 'android_info', arguments: { device: 'nonexistent-test-phone' } });
  assert.ok(missing.isError);
  const explicit = await client.callTool({ name: 'android_info', arguments: { device: phone.id } });
  assert.ok(!explicit.isError);
  console.log('PASS: explicit device routing and missing-device protection');
  if (process.argv.includes('--actions')) {
    for (const [name, args] of [
      ['android_open_app', { packageName: 'com.android.settings' }],
      ['android_key', { key: 'BACK' }],
    ]) {
      const result = await client.callTool({ name, arguments: args });
      assert.ok(!result.isError, JSON.stringify(result));
      console.log(`PASS: ${name}`);
    }
  }
} finally { await client.close(); }
