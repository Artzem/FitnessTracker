import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fittrack.mobile',
  appName: 'FitTrack',
  webDir: 'dist',
  plugins: {
    CapacitorHealth: {}
  }
}

export default config
