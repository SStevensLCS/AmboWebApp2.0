import { ExpoConfig, ConfigContext } from 'expo/config';
import path from 'path';

// In a monorepo, packages are hoisted to the root node_modules.
// Expo resolves plugins relative to the project root (apps/mobile),
// which fails when the package only exists at the monorepo root.
// require.resolve walks up the directory tree and finds it correctly.
function resolvePlugin(packageName: string): string {
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name!,
  slug: config.slug!,
  plugins: [
    ...(config.plugins || []),
    [
      resolvePlugin('expo-notifications'),
      {
        icon: './assets/icon.png',
        color: '#3b82f6',
      },
    ],
  ],
});
