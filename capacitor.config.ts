import type { CapacitorConfig } from '@capacitor/cli';

// Production APK — points to the live Hostinger deployment
const SERVER_URL = 'https://sabing2m.com';

const config: CapacitorConfig = {
  appId: 'com.sumbo.esabong',
  appName: 'eSabong',
  webDir: 'public/build',
  server: {
    androidScheme: 'https',
    url: SERVER_URL,
    cleartext: false
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
