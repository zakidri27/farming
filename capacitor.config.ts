import type { CapacitorConfig } from '@capacitor/cli';

// OFFLINE MODE: static export (webDir 'out') served locally from the APK.
// All data lives in on-device SQLite; no server, no internet needed.
const config: CapacitorConfig = {
  appId: 'com.farm.app',
  appName: 'مزرعتي',
  webDir: 'out',
};

export default config;