# Android Phone MCP — आसान सेटअप

## इस्तेमाल से पहले क्या चाहिए

- **कंप्यूटर:** Windows/macOS (x64 या arm64) या Linux x64 पर automatic ADB setup उपलब्ध है। Windows arm64 में x64 emulation लग सकता है। दूसरी architecture पर compatible ADB अलग से देना होगा।
- **Node.js + npm/npx:** कम से कम Node.js 20; नया supported LTS वर्ज़न लें। डाउनलोड: https://nodejs.org/en/download । इंस्टॉल करने के बाद Terminal और AI ऐप दोबारा खोलें। `node --version`, `npm --version`, `npx --version` से जाँचें।
- **एक स्थानीय AI ऐप:** ऐसा ऐप चाहिए जो इस कंप्यूटर पर stdio MCP चला सके, जैसे Codex या VS Code में Copilot/MCP। अपने ऐप में लॉगिन और उसकी account/plan requirements पूरी करें। केवल npm पैकेज इंस्टॉल करना पर्याप्त नहीं है। Codex सेटअप: https://learn.chatgpt.com/docs/extend/mcp । VS Code डाउनलोड: https://code.visualstudio.com/download । MCP सेटअप: https://code.visualstudio.com/docs/agent-customization/mcp-servers ।
- **इंटरनेट और जगह:** पहली बार npm पैकेज, dependencies और जरूरत होने पर ADB डाउनलोड होंगे। कंप्यूटर में इनके और AI ऐप के लिए खाली जगह रखें।
- **Android फोन:** बिना केबल pairing के लिए Android 11+ और Wireless debugging चाहिए। फोन और कंप्यूटर एक ही Wi-Fi पर हों और नेटवर्क दोनों को आपस में कनेक्ट होने दे। Developer options खोलने का तरीका: https://developer.android.com/studio/debug/dev-options । Wireless debugging तरीका: https://developer.android.com/tools/adb ।
- **ADB:** समर्थित कंप्यूटर पर अपने आप डाउनलोड होता है; आम तौर पर अलग से इंस्टॉल करने की जरूरत नहीं। Manual/offline सेटअप के लिए आधिकारिक डाउनलोड: https://developer.android.com/tools/releases/platform-tools ।
- **USB विकल्प:** data cable और USB debugging की अनुमति चाहिए। Windows पर जरूरत हो तो अपने फोन के USB driver यहाँ से लें: https://developer.android.com/studio/run/oem-usb । Linux USB permissions की जानकारी: https://developer.android.com/studio/run/device । Wireless debugging के लिए USB driver नहीं चाहिए।

इस MCP के लिए Android Studio, Java, Python, Git, root या फोन में APK इंस्टॉल करना जरूरी नहीं है। iPhone समर्थित नहीं है।

## इंस्टॉल और कनेक्ट करें

फिर Terminal में यह एक कमांड चलाएँ:

```sh
npx --yes deepboyearn-android-mcp --doctor
```

या एक बार इंस्टॉल करें:

```sh
npm install --global deepboyearn-android-mcp
android-phone-mcp --doctor
```

ZIP निकालना या Git/ADB अलग से इंस्टॉल करना ज़रूरी नहीं है। ADB नहीं मिला तो पहली बार Google से डाउनलोड होगा। इंटरनेट चाहिए।

अपने AI ऐप की MCP configuration में जोड़ें:

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

ऐप दोबारा खोलें। वह MCP खुद शुरू करेगा। Windows पर सीधे npx न चले तो README का cmd वाला विकल्प देखें।

फोन और कंप्यूटर एक ही Wi-Fi पर रखें। Android 11+ में Developer options → Wireless debugging → Pair device with pairing code खोलें। AI को अपने फोन का pairing address/code दें, फिर मुख्य स्क्रीन का connection address दें। हर फोन के मालिक की debugging अनुमति चाहिए। कई फोन हों तो लिस्ट में अपना फोन चुनें।

यह पैकेज npm से इंस्टॉल होता है। ZIP या Git इंस्टॉल करने की ज़रूरत नहीं है। MCP वाला JSON दूसरे यूज़र को भी दे सकते हैं।

iPhone और हिंदी/इमोजी टाइपिंग समर्थित नहीं हैं। अलग मॉडलों में सुविधाएँ बदल सकती हैं। Linux arm64 पर ADB अलग से चाहिए। Windows पर OnePlus Nord से वास्तविक जाँच हुई है।

पूरा विवरण: https://github.com/deepboyearn/android-phone-mcp

## नया वर्ज़न कैसे लें

README बदलने से पुराना npm पैकेज अपने आप नहीं बदलता; maintainer को नया version publish करना होता है। Global installation अपडेट करने के लिए `npm install --global deepboyearn-android-mcp@latest` चलाएँ। npx से नया release जाँचने के लिए `npx --yes deepboyearn-android-mcp@latest --doctor` चलाएँ।
