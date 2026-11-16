# Android Phone MCP — Installation guide

These commands are for Windows PowerShell. See the [requirements and download links](README.md#requirements--read-before-installing) before installing.

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

