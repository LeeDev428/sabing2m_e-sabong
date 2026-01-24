import type { CapacitorConfig } from '@capacitor/cli';

// PRODUCTION CONFIGURATION
// Use this for building the production APK
const SERVER_URL = 'https://sabing2m.com';

const config: CapacitorConfig = {
  appId: 'com.sumbo.esabong',
  appName: 'eSabong',
  webDir: 'public/build',
  server: {
    androidScheme: 'https',
    url: SERVER_URL,
    cleartext: false // HTTPS - no cleartext allowed
  },
  android: {
    buildOptions: {
      signingConfig: 'release'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
