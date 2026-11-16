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

## Installation and wireless connection (Windows PowerShell)

Complete these three main steps in PowerShell. Replace PHONE_IP, PAIRING_PORT and CONNECTION_PORT with the current values shown on your own phone. Do not paste the PS prompt, placeholder words or trailing backslashes into the commands.

### Step 1 — Install the npm package

```powershell
npm install -g deepboyearn-android-mcp@latest
```

Requires Node.js 20+; prefer a currently supported LTS release. No ZIP extraction or Git installation is needed.

### Step 2 — Check the installation and locate ADB

```powershell
android-phone-mcp --doctor
```

This checks ADB and lists any connected phones. On supported systems, missing ADB is downloaded from Google automatically. An empty device list is normal before connecting. The doctor command does not pair a new phone.

In the same PowerShell window, save the ADB executable path reported by the doctor command:

```powershell
$adb = ((android-phone-mcp --doctor | Select-String '^Installed as ' | Select-Object -First 1).Line -replace '^Installed as ', '').Trim()
if (-not $adb -or -not (Test-Path -LiteralPath $adb)) { throw 'ADB path not found. Copy the Installed as path from --doctor into $adb manually.' }
```

This uses the actual ADB location instead of assuming a particular Android SDK folder. If automatic detection fails, set $adb manually to the full executable path printed after Installed as. Keep using the same PowerShell window so the variable remains available.

**PowerShell rule:** use **& $adb**, not **$adb** alone, to execute the program. The & call operator is required when running a path stored in a variable.

### Step 3 — Pair first, then connect

On an Android 11+ phone:

1. Connect the computer and phone to the same Wi-Fi.
2. Open Developer options → Wireless debugging and turn it on. Approve the network prompt if shown.
3. Tap **Pair device with pairing code**. A popup displays a temporary six-digit code and its own IP address and port.
4. **Keep this popup open while pairing.** Use the address and port from this popup in the following command:

```powershell
& $adb pair PHONE_IP:PAIRING_PORT
```

When asked for Enter pairing code, type the current six-digit code from that still-open popup. Wait for **Successfully paired to ...**. Codes and pairing ports can change when the popup is reopened; never copy an old code from a guide.

5. After successful pairing, close the popup and return to the **main Wireless debugging screen**. Use the IP address and port shown there with:

```powershell
& $adb connect PHONE_IP:CONNECTION_PORT
```

6. Verify the live connection:

```powershell
& $adb devices -l
```

Your phone must appear with status **device**. Then the ADB connection is ready for the MCP. A phone appearing under Paired devices only proves stored authorization; it does not prove an active connection.

| Where the address appears | What it is for | Command |
| --- | --- | --- |
| Pair device with pairing code popup | Temporary pairing service, with six-digit code | & $adb pair PHONE_IP:PAIRING_PORT |
| Main Wireless debugging screen | Debugging connection service | & $adb connect PHONE_IP:CONNECTION_PORT |

The two ports are generally different. The main-screen port is valid for **connect**; do not use it as the pairing port. The pairing popup/code is needed only during pairing, not for keeping an already-paired connection alive. ADB may connect automatically after pairing; if devices already shows status device, a manual connect is unnecessary. Ports can change after restarting the phone, Wi-Fi or Wireless debugging.

### Paired successfully, but no phone notification?

Do not use a notification as the only success check. Pairing authorizes the computer, while an active ADB connection is a separate state. Android's reference implementation shows the wireless-debugging connected notification when a Wi-Fi ADB connection becomes active; manufacturer behavior can differ. If pairing succeeded but the phone is missing from devices, run connect using the main-screen port. If devices shows status device, the connection is ready even if you do not see a notification. If it does not, a missing notification alone cannot identify the cause.

References: [Android's official ADB pairing and connection guide](https://developer.android.com/tools/adb) and [Android's wireless connection notification implementation](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/services/core/java/com/android/server/adb/AdbDebuggingManager.java).

### Common connection errors

| Symptom | What to check |
| --- | --- |
| Unexpected token 'pair' in PowerShell | Use & $adb pair ..., including the leading &. |
| protocol fault (couldn't read status message) | The code can be correct while the port is wrong. Reopen the pairing popup and use its current address, port and code together; leave it open until pairing finishes. Also check current Platform Tools and network reachability if it persists. |
| Successfully paired, but phone is not listed | Pairing is not the same as connecting. Use connect with the main Wireless debugging screen's current port. |
| Connection refused, offline or empty list | Recheck Wireless debugging, the current connection port, same Wi-Fi, VPN/firewall/client-isolation restrictions and device authorization. Do not keep retrying an old address. |

For discovery diagnostics, while the pairing popup is open:

```powershell
& $adb mdns services
```

Services containing **_adb-tls-pairing._tcp** are pairing services; **_adb-tls-connect._tcp** are connection services. Identify your own phone. If discovery is blocked, enter the addresses from its screens manually.

## Optional — Connect with the Codex app

**This command is only for adding the MCP to Codex. It is not required to pair/connect Android or to use another MCP client.** The Codex CLI must already be installed and available in your terminal; see [Codex MCP setup](https://learn.chatgpt.com/docs/extend/mcp).

After the global npm installation, run:

```powershell
codex mcp add android-phone -- cmd /d /c android-phone-mcp
```

Restart the Codex app to load the configuration, then ask it to use the android-phone MCP. Pairing the phone by itself does not configure an AI app: choose this Codex setup or configure another compatible local MCP client.

## Other MCP clients / npx alternative

For a compatible local client that accepts this JSON structure:

```json
{
  "mcpServers": {
    "android-phone": {
      "command": "npx",
      "args": [
        "--yes",
        "deepboyearn-android-mcp"
      ]
    }
  }
}
```

The client starts this stdio MCP automatically. There is no public HTTP server URL. Windows clients that cannot start npx directly can use command cmd and args ["/d", "/c", "npx", "--yes", "deepboyearn-android-mcp"]. Client-specific configuration formats may differ.

If you prefer not to install globally, you can check the package with:

```powershell
npx --yes deepboyearn-android-mcp@latest --doctor
```

The npm package is **deepboyearn-android-mcp**. The unrelated name android-phone-mcp is not this npm package; android-phone-mcp is this package's installed executable name.

## USB alternative

For USB, enable USB debugging, use a data cable and accept the phone's debugging authorization. Older Android versions can use USB subject to ADB support. Windows may need a manufacturer USB driver; Linux may need USB permissions. Owner authorization is required for every phone. This package does not automatically enable legacy unauthenticated TCP debugging.

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

When Android cannot obtain an idle UI tree (for example during a playing video), `android_screen` returns a `mode: screenshot` explanation and a PNG instead of failing without a usable view. Normal accessible screens still return the JSON element array. Use coordinate taps/swipes with the fallback; label-based taps require an accessible screen. Offline/ADB errors remain errors. Secure apps can still produce black screenshots. `android_open_app` resolves the app's launcher and waits for Android's launch status; it does not prevent subsequent user navigation.

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
