import { ExpoConfig, ConfigContext } from 'expo/config';

// In a monorepo, expo-notifications is hoisted to the root node_modules
// but Expo resolves plugins relative to apps/mobile where it doesn't exist.
// We try to resolve it, and gracefully skip if unavailable (e.g. during eas init).
function tryResolvePlugin(
  packageName: string,
  options: Record<string, unknown>
): [string, Record<string, unknown>] | null {
  try {
    const resolved = require.resolve(`${packageName}/app.plugin.js`);
    return [resolved, options];
  } catch {
    // Not resolvable from this context — skip the plugin
    return null;
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const notificationsPlugin = tryResolvePlugin('expo-notifications', {
    icon: './assets/icon.png',
    color: '#111827',
  });

  return {
    ...config,
    name: config.name!,
    slug: config.slug!,
    plugins: [
      ...(config.plugins || []),
      ...(notificationsPlugin ? [notificationsPlugin] : []),
      '@react-native-community/datetimepicker',
    ],
  };
};
