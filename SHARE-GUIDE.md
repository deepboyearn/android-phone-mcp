# Android Phone MCP — आसान सेटअप

कंप्यूटर में Node.js 20+ इंस्टॉल करें: https://nodejs.org/

फिर Terminal में यह एक कमांड चलाएँ:

```sh
npx --yes deepboyearn-android-mcp --doctor
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
