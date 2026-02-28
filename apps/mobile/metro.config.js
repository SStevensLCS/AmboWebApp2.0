const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Help Metro resolve hoisted packages that aren't in the local node_modules.
//    npm workspaces hoists everything to the root, so Metro needs explicit pointers.
const rootModules = path.resolve(monorepoRoot, 'node_modules');
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_target, name) => {
      // Check local node_modules first, then fall back to root
      const localPath = path.resolve(projectRoot, 'node_modules', String(name));
      if (fs.existsSync(localPath)) return localPath;
      return path.resolve(rootModules, String(name));
    },
  },
);

module.exports = config;
