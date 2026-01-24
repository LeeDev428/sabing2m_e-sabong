import type { CapacitorConfig } from '@capacitor/cli';

// For development: Update this URL based on your environment
// - Emulator: http://10.0.2.2:8000
// - Physical device via USB: http://localhost:8000 (use adb reverse tcp:8000 tcp:8000)
// - Physical device via WiFi: http://YOUR_COMPUTER_IP:8000 (e.g., http://192.168.1.100:8000)
// - Production: https://your-domain.com
const SERVER_URL = 'http://localhost:8000'; // USB connected with adb reverse

const config: CapacitorConfig = {
  appId: 'com.sumbo.esabong',
  appName: 'eSabong',
  webDir: 'public/build',
  server: {
    androidScheme: 'https',
    url: SERVER_URL,
    cleartext: true // Set to false when using HTTPS
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;
