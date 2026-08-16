import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'no.danceitude.app',
  appName: 'Danceitude',
  webDir: 'out',
  server: {
    url: 'https://p-tbooking.vercel.app',
    cleartext: false,
  },
};

export default config;
