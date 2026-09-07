const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

// Add RECORD_AUDIO permission
if (!code.includes('android.permission.RECORD_AUDIO')) {
    code = code.replace(
        '<uses-permission android:name="android.permission.INTERNET" />',
        '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />'
    );
    fs.writeFileSync('android/app/src/main/AndroidManifest.xml', code);
}
