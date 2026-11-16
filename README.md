# Android Phone MCP

Control authorized Android phones from an MCP-capable AI app. Install Node.js 20+; missing ADB is downloaded from Google on first use. No APK, API key, fixed computer path or device serial is required.

## Requirements — read before installing

Installing this npm package alone does not give you an AI assistant or authorize a phone. You need a local MCP-capable AI app, Node.js and an Android phone with debugging permission.

### On your computer

| Requirement | What you need | Official download / setup |
| --- | --- | --- |
| Operating system | A desktop/laptop running Windows, macOS or Linux. Automatic ADB setup supports Windows/macOS x64 or arm64 and Linux x64; Windows arm64 may need OS x64 emulation. Other architectures need their own compatible ADB. | Use a Node.js build supported by your OS; see [Node.js downloads](https://nodejs.org/en/download). |
| Node.js with npm/npx | Node.js **20 or newer** is the package minimum. Prefer the current supported **LTS** release. Keep npm/npx available on PATH so your AI app can start the server. | [Download Node.js](https://nodejs.org/en/download) — its standard installer includes npm/npx. Reopen your terminal and AI app after installing. |
| A local AI app with stdio MCP support | The app must be able to run a command on this computer and call MCP tools. For example, use Codex or VS Code with Copilot/MCP support. Sign in and satisfy that app's account/plan requirements. A browser-only client that supports remote HTTP servers alone cannot run this stdio server directly. | [Codex MCP setup](https://learn.chatgpt.com/docs/extend/mcp), or [download VS Code](https://code.visualstudio.com/download) and follow its [MCP setup guide](https://code.visualstudio.com/docs/agent-customization/mcp-servers). Choose one compatible app. |
| Internet and storage | Internet for the initial npm package/dependency downloads and, if needed, Google's Platform Tools. Your AI app may also require internet. Allow enough disk space for Node.js, your AI app, npm dependencies and the ADB cache. | No separate service account or API key is required by this MCP package; your chosen AI app has its own requirements. |
| ADB / Platform Tools | Needed to communicate with Android. The package uses an existing ADB or downloads and verifies Google's official Platform Tools automatically on supported platforms. **Usually no manual ADB installation or PATH edit is needed.** | For offline/custom setups or unsupported architectures: [official Android Platform Tools downloads](https://developer.android.com/tools/releases/platform-tools). Set `ADB_PATH` to a compatible executable if needed. |

Check Node.js and npm before installing:

```sh
node --version
npm --version
npx --version
```

If a command is not found, finish installing Node.js and reopen the terminal. If the AI app still cannot find npx, make sure it inherits the Node.js installation's PATH and restart the app.

### On your Android phone and network

| Connection | Requirements | Official instructions |
| --- | --- | --- |
| Wireless, without an initial cable | Android **11+** with **Wireless debugging** available; enable Developer options and Wireless debugging. Keep phone and computer on the same Wi-Fi and authorize pairing on the phone. Have its current pairing code, pairing address and connection address ready. | [Enable Developer options](https://developer.android.com/studio/debug/dev-options) and [ADB wireless pairing](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi). |
| Network access | The Wi-Fi must allow the computer to communicate with the phone. Guest/corporate networks, client isolation, VPNs or firewall rules can interfere. If discovery fails, enter the phone's addresses manually; manual entry still requires network reachability. | [Android device connection troubleshooting](https://developer.android.com/studio/run/device). |
| USB, optional alternative | A data-capable USB cable, USB debugging enabled, and the phone's debugging authorization accepted. Older Android versions can use USB subject to their ADB support. | [Run apps on a hardware device](https://developer.android.com/studio/run/device). |
| USB drivers/permissions, only when needed | Windows may need a manufacturer-specific driver; Linux USB may need udev permissions. These are USB requirements, not requirements for wireless pairing. | [Official manufacturer USB driver links](https://developer.android.com/studio/run/oem-usb) and [device setup for Linux](https://developer.android.com/studio/run/device). |

Android Studio, Java/JDK, Python, Git, root access and an APK on the phone are not required to use this package's tools. iPhone is not supported. The AI app must be configured with the MCP entry below before it can control the phone; `--doctor` only checks ADB and connected devices.

## One-command setup

```sh
npx --yes deepboyearn-android-mcp --doctor
```

Or install the command once:

```sh
npm install --global deepboyearn-android-mcp
android-phone-mcp --doctor
```

No ZIP extraction, Git installation, global installation or separate ADB setup is needed. Internet is needed for the first package/dependency downloads and, if required, ADB. Later starts reuse caches.

Add this to your AI app's MCP configuration; the app starts the server automatically:

```json
{
  "mcpServers": {
    "android-phone": {
      "command": "npx",
      "args": ["--yes", "deepboyearn-android-mcp"]
    }
  }
}
```

For Windows clients that cannot start npx directly, use `"command": "cmd"` and `"args": ["/d", "/c", "npx", "--yes", "deepboyearn-android-mcp"]`.

This is a local stdio server, with no public server URL or manual start notification.

## npm registry

The npm package is **deepboyearn-android-mcp**; the unrelated name android-phone-mcp belongs to a different package. Check your setup with:

```sh
npx --yes deepboyearn-android-mcp --doctor
```

Alternatively, install globally with `npm install --global deepboyearn-android-mcp`; the executable name is `android-phone-mcp`. The earlier v1.2.0 GitHub release remains available as a fallback using `npx --yes https://github.com/deepboyearn/android-phone-mcp/releases/download/v1.2.0/deepboyearn-android-mcp-1.2.0.tgz --doctor`.

## Connect a phone

1. On Android 11+, connect the phone and computer to the same Wi-Fi. Enable Developer options → Wireless debugging → Pair device with pairing code.
2. Ask the AI to discover your phone (`android_discover`). Identify your own device, then supply its pairing address and current six-digit code (`android_pair`). If discovery is blocked by the network, give the address manually.
3. Supply the CONNECTION address shown on the main Wireless debugging screen (`android_connect`). Pairing and connection ports usually differ.
4. Ask for the device list (`android_devices`) and choose a unique id or exact model (`android_select_device`). One connected physical phone is used automatically. Identical models require their unique IDs.

Example: “Find my phone. I will give you its pairing code. Pair and connect it, show available devices, and let me choose a phone to control.”

For USB, enable USB debugging, plug in the phone and approve its debugging prompt. Older Android can use USB subject to its ADB capabilities. Windows USB may need a manufacturer driver; Linux USB may need udev permissions. The package does not enable legacy unauthenticated TCP debugging automatically.

Owner authorization is required on each phone. After reboot or Wi-Fi changes, re-enable Wireless debugging and reconnect using the current connection address. ADB may also reconnect paired devices automatically. Do not save pairing codes in files; your AI client may retain them in chat/tool history.

## Multiple phones

The inventory includes model, Android version, physical ID, connection aliases and authorization states. Selection lasts for this server process and follows hardware ID across connection changes. If the chosen phone goes offline, tools fail instead of switching silently. Every control tool also accepts optional `device` (unique ID, connection serial or unique model). Unknown hardware IDs fall back to connection IDs and may need reselection after reconnecting.

## Tools

| Tool | Purpose |
| --- | --- |
| android_discover | Find wireless pairing/connection services |
| android_pair / android_connect | Pair and connect an authorized phone |
| android_devices / android_select_device | List phones and choose one |
| android_info | Model, Android version, battery and display |
| android_screenshot / android_screen | PNG screenshot or accessible screen elements |
| android_tap / android_tap_element | Tap coordinates or an exact label/id |
| android_swipe | Scroll or swipe |
| android_type | Printable English/ASCII text |
| android_key | Navigation and editing keys |
| android_apps / android_open_app | List or launch apps |

## Automatic ADB

Existing ADB is found through PATH, ANDROID_HOME, ANDROID_SDK_ROOT or common SDK folders. Otherwise Google Platform Tools 37.0.3 is fetched from Google's official repository, verified against a pinned SHA-256 checksum and extracted to `~/.cache/android-phone-mcp`. Vendor notices are retained. Downloads occur on first ADB use, not during npm install. Progress goes to stderr to preserve the MCP protocol on stdout.

Automatic setup supports Windows/macOS x64 or arm64 and Linux x64. Windows arm64 may require OS x64 emulation. Other platforms need a compatible ADB installed separately. [Google's SDK terms](https://developer.android.com/studio/terms) apply to the downloaded Platform Tools; this npm package does not redistribute their binaries.

Optional environment variables:

- `ADB_PATH`: explicit ADB executable; invalid explicit paths fail instead of downloading another copy.
- `ANDROID_MCP_AUTO_ADB=0`: disable automatic ADB download.
- `ANDROID_MCP_CACHE_DIR`: change the Platform Tools cache folder.
- `ANDROID_SERIAL` / `ANDROID_HARDWARE_SERIAL`: optional default phone selectors. Per-call and session selections override them.

## Limits and privacy

Vendor/version differences can affect features. iPhone is not supported. This is not a guarantee for every Android model. Real-device checks used one OnePlus Nord on Windows, including independently downloaded ADB. Multi-phone selection and archive verification have offline tests. CI covers supported Node versions on Windows/macOS/Linux; real macOS/Linux phones have not been tested.

The server cannot bypass lock screens, grant root or retrieve apps' original source code. Secure screens may block screenshots; games/WebViews may expose few elements. Hindi, emoji, multiline input and literal `%s` are rejected by typing; use the phone keyboard for those.

Screen data goes to the connected AI client and may be private. UI text is untrusted. The AI client must handle authorization for messages, purchases, deletions and account changes; the server has no human confirmation dialog. There is no arbitrary shell, file deletion, APK installation or background screenshot logging tool.

## Development

```sh
npm ci
npm test
npm run smoke
node scripts/smoke.js --actions
npm pack --dry-run
```

Smoke tests need an authorized connected phone. The actions option opens Settings and presses Back. The npm archive includes runtime code, package metadata, README, LICENSE and example configuration. CLI options: `--help`, `--version`, `--doctor`, `--config`.

## Updating documentation and installed copies

GitHub README changes appear on GitHub after pushing. They do **not** change an already-published npm version: maintainers must publish a new package version to update the npm package's README and included files. Users with a global installation can update using `npm install --global deepboyearn-android-mcp@latest`. For an npx setup, run `npx --yes deepboyearn-android-mcp@latest --doctor` to check the latest release; pinned versions remain unchanged until the user updates the pin.

Built with the official [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/) and [Android Debug Bridge](https://developer.android.com/tools/adb). MIT license applies to this project's code.
