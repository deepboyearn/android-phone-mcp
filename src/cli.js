#!/usr/bin/env node
const option = process.argv[2];
const { readFile } = await import('node:fs/promises');
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
if (option === '--help' || option === '-h') {
  console.log(`Android Phone MCP ${version}

android-phone-mcp           Start MCP over stdio (normally launched by your AI app)
android-phone-mcp --doctor  Check ADB and list device connections
android-phone-mcp --config  Print portable MCP client configuration
android-phone-mcp --version Print version

Install Node.js 20+ first. Missing ADB is downloaded from Google on first use.
Enable USB or Wireless debugging and authorize your own phone.
Use android_discover / android_pair / android_connect in your AI client.
Use android_devices / android_select_device to choose among phones.`);
} else if (option === '--version') {
  console.log(version);
} else if (option === '--config') {
  console.log(JSON.stringify({ mcpServers: { 'android-phone': { command: 'npx', args: ['--yes', 'deepboyearn-android-mcp'] } } }, null, 2));
} else if (option === '--doctor') {
  const { adb, manager } = await import('./adb.js');
  try {
    console.log(await adb(['version']));
    console.log(JSON.stringify(await manager.inventory(), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
} else if (option) {
  console.error('Unknown option. Use android-phone-mcp --help.');
  process.exitCode = 1;
} else {
  await import('./server.js');
}
