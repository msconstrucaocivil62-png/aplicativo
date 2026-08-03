import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.oprofissionalcerto.app',
  appName: 'O Profissional Certo',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: { SplashScreen: { launchShowDuration: 1200 } }
};
export default config;
