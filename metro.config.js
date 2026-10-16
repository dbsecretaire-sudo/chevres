const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// La version Windows (EXPO_PUBLIC_BUREAU=1, voir bureau/LISEZMOI.md) remplace les modules du téléphone par ceux de l'ordinateur :
// les données et les fichiers dans des fichiers de Windows, l'impression, le partage et Google Drive sans passer par un service du
// téléphone. Le téléphone et la version web ordinaire ne changent pas.
if (process.env.EXPO_PUBLIC_BUREAU === '1') {
  const remplacements = {
    '@react-native-async-storage/async-storage': 'asyncStorage',
    'expo-file-system/legacy': 'fileSystem',
    'expo-print': 'print',
    'expo-sharing': 'sharing',
    'expo-document-picker': 'documentPicker',
    '@react-native-google-signin/google-signin': 'googleSignin',
    'expo-crypto': 'crypto',
  };
  const resolutionInitiale = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const module = remplacements[moduleName];
    if (platform === 'web' && module) {
      return { type: 'sourceFile', filePath: path.join(__dirname, 'src', 'bureau', `${module}.ts`) };
    }
    return (resolutionInitiale ?? context.resolveRequest)(context, moduleName, platform);
  };
}

module.exports = config;
