const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// La version Windows (EXPO_PUBLIC_BUREAU=1, voir bureau/LISEZMOI.md) remplace les modules du téléphone par ceux de l'ordinateur :
// les données et les fichiers dans des fichiers de Windows, l'impression, le partage et Google Drive sans passer par un service du
// téléphone. Le téléphone et la version web ordinaire ne changent pas.
const remplacements =
  process.env.EXPO_PUBLIC_BUREAU === '1'
    ? {
        '@react-native-async-storage/async-storage': 'asyncStorage',
        'expo-file-system/legacy': 'fileSystem',
        'expo-print': 'print',
        'expo-sharing': 'sharing',
        'expo-document-picker': 'documentPicker',
        '@react-native-google-signin/google-signin': 'googleSignin',
        'expo-crypto': 'crypto',
      }
    : {};

// Le téléphone : le stockage garde toutes les données en mémoire (comme Windows) au lieu de relire le téléphone à chaque écran. Seul ce
// module-là importe l'original.
const STOCKAGE_NATIF = '@react-native-async-storage/async-storage';
const STOCKAGE_EN_MEMOIRE = path.join(__dirname, 'src', 'shared', 'stockage-en-memoire', 'asyncStorageEnMemoire.ts');
// Ce module est reconnu à la fin de son chemin (la forme complète que Metro donne peut différer de __dirname : accents, disque, séparateurs).
// Il doit rester SEUL dans son dossier : Metro mémorise la résolution d'un module par dossier, donc un voisin qui importe le stockage
// (comme src/shared/storage/localStore.ts) lui ferait recevoir sa propre réponse — il s'importerait lui-même et l'application resterait
// blanche, sans aucune erreur (le vrai stockage n'était même pas dans le paquet). Un test le garde.
const estLeStockageEnMemoire = (chemin) => /[\\/]src[\\/]shared[\\/]stockage-en-memoire[\\/]asyncStorageEnMemoire\.ts$/.test(chemin ?? '');

const resolutionInitiale = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === STOCKAGE_NATIF && !estLeStockageEnMemoire(context.originModulePath)) {
    return { type: 'sourceFile', filePath: STOCKAGE_EN_MEMOIRE };
  }
  // pdf-lib (qui remplit les formulaires PDF officiels) : sur le web et Windows, Metro prendrait sa version « module », qui importe tslib
  // avec une interopérabilité cassée (« Cannot destructure property '__extends' of 'n.default' ») et laisse la fenêtre blanche. On lui
  // donne sa version autonome (tslib inclus), qui ne dépend de rien. Le téléphone garde la version d'origine.
  if (platform === 'web' && moduleName === 'pdf-lib') {
    return { type: 'sourceFile', filePath: require.resolve('pdf-lib/dist/pdf-lib.js') };
  }
  const module = remplacements[moduleName];
  if (platform === 'web' && module) {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'src', 'bureau', `${module}.ts`) };
  }
  return (resolutionInitiale ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
