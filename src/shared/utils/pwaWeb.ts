import { Platform } from 'react-native';

/**
 * La version web installable (PWA) : un iPhone l'ajoute à son écran d'accueil (Safari, Partager, « Sur l'écran d'accueil ») et l'ouvre
 * sans la barre du navigateur. Expo n'écrit pas ces balises dans la page (sa sortie ne lit pas le gabarit « +html » ici) : on les ajoute
 * au chargement, comme on ajuste déjà le style. Les fichiers (le manifeste, les icônes) sont dans le dossier « public ».
 */
export function installerBalisesPwa(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.querySelector('link[rel="manifest"]')) return;
  const ajouterMeta = (nom: string, contenu: string) => {
    const meta = document.createElement('meta');
    meta.name = nom;
    meta.content = contenu;
    document.head.append(meta);
  };
  const ajouterLien = (rel: string, href: string) => {
    const lien = document.createElement('link');
    lien.rel = rel;
    lien.href = href;
    document.head.append(lien);
  };
  ajouterLien('manifest', '/manifest.webmanifest');
  ajouterLien('apple-touch-icon', '/apple-touch-icon.png');
  ajouterMeta('apple-mobile-web-app-capable', 'yes');
  ajouterMeta('apple-mobile-web-app-title', 'Chèvres');
  ajouterMeta('apple-mobile-web-app-status-bar-style', 'default');
}
