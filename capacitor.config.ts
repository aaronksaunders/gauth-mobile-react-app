import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter.gamr2',
  appName: 'gauth-mobile-react-2',
  webDir: 'build',
  bundledWebRuntime: false,
    plugins: {
      FirebaseAuthentication: {
        skipNativeAuth: false,
        providers: ["phone", "google.com"],
      },
    },
};

export default config;
