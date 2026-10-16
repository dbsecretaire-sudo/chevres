import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Les tests automatiques : ils font tourner la vraie logique (services, calculs) sans l'interface. Le stockage de l'appareil est
 * remplacé par une mémoire (tests/stubs/asyncStorage.ts).
 */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@react-native-async-storage/async-storage',
        replacement: path.resolve(__dirname, 'tests/stubs/asyncStorage.ts'),
      },
      { find: /^expo-crypto$/, replacement: path.resolve(__dirname, 'tests/stubs/expoCrypto.ts') },
      {
        find: /^expo-(file-system(\/legacy)?|sharing|print|document-picker)$/,
        replacement: path.resolve(__dirname, 'tests/stubs/vide.ts'),
      },
      { find: /^react-native$/, replacement: path.resolve(__dirname, 'tests/stubs/reactNative.ts') },
      { find: /^@\//, replacement: `${path.resolve(__dirname, 'src')}/` },
    ],
  },
  define: { __DEV__: false },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
