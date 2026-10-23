/** Un menu de la barre du haut : un écran (route), ou une liste d'écrans. */
export interface MenuBureau {
  label: string;
  route?: string;
  /** Les écrans du menu : un libellé et son écran, ou un séparateur entre deux groupes. */
  items?: ({ label: string; route: string } | { separateur: true; titre?: string })[];
}

/** Le pont de la version Windows (voir bureau/preload.js) : ce que l'ordinateur offre à l'application, et seulement cela. */
export interface PontBureau {
  /** Toutes les données enregistrées au démarrage. */
  donnees: Record<string, string>;
  dossiers: { documents: string; cache: string };
  ecrireStockage: (ecrire: Record<string, string>, retirer: string[]) => Promise<void>;
  fichiers: {
    creerDossier: (chemin: string) => Promise<void>;
    copier: (de: string, vers: string) => Promise<void>;
    lire: (chemin: string, encodage: 'base64' | 'utf8') => Promise<string>;
    ecrire: (chemin: string, contenu: string, encodage: 'base64' | 'utf8') => Promise<void>;
    supprimer: (chemin: string) => Promise<void>;
    existe: (chemin: string) => Promise<boolean>;
    choisir: (extensions: string[], multiple: boolean) => Promise<{ chemin: string; nom: string }[]>;
    enregistrerSous: (source: string, nom: string, titre?: string) => Promise<boolean>;
    ouvrir: (chemin: string) => Promise<void>;
    imprimerPdf: (
      html: string,
      paysage?: boolean,
      sansMarges?: boolean,
      pied?: { gauche: string; droite: string },
    ) => Promise<string>;
  };
  /** Fixe le zoom de la fenêtre (1 = normal) : le texte et tout le reste grandissent ensemble. */
  zoom?: (facteur: number) => void;
  menu: {
    /** Donne à la fenêtre les menus de la barre du haut (aucun : la barre disparaît) et l'affichage en cours. */
    definir: (menus: MenuBureau[], affichage: string) => Promise<void>;
    /** L'écran choisi dans un menu ; rend la fonction qui arrête l'écoute. */
    surChoix: (rappel: (route: string) => void) => () => void;
  };
  google: {
    connexion: () => Promise<{ email: string; accessToken: string } | null>;
    jeton: () => Promise<string | null>;
    email: () => Promise<string | null>;
    deconnexion: () => Promise<void>;
  };
}

declare global {
  interface Window {
    bureau?: PontBureau;
  }
}

/** Le pont de l'ordinateur ; ces modules ne sont chargés que dans la version Windows, où il existe toujours. */
export const pont = (): PontBureau => {
  if (!window.bureau) throw new Error('Le pont de la version Windows est absent.');
  return window.bureau;
};
