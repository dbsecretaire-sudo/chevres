import { estBureau } from '@/shared/utils/plateforme';

/**
 * Les trois affichages de la version Windows. « bureau » : les menus de la fenêtre en haut, et deux colonnes quand la fenêtre est large. « mobile » :
 * l'application du téléphone dans une colonne centrée, sans les menus de la fenêtre. « sobre » : la même chose, sans couleur ni dessin.
 */
export const AFFICHAGE = { BUREAU: 'bureau', MOBILE: 'mobile', SOBRE: 'sobre' } as const;
export type ModeAffichage = (typeof AFFICHAGE)[keyof typeof AFFICHAGE];

/** La clé, dans les données de l'ordinateur, du choix d'affichage (elle n'est pas dans les sauvegardes : chaque ordinateur a le sien). */
export const CLE_AFFICHAGE = 'bureau:affichage';

const MODES: readonly string[] = Object.values(AFFICHAGE);

/**
 * Le mode choisi, lu au démarrage dans les données de l'ordinateur (le pont les donne tout de suite) ; « bureau » par défaut. Dans un navigateur ordinaire
 * (qui n'a jamais ce choix), la même clé du stockage du navigateur permet d'essayer l'affichage sobre.
 */
function lireMode(): ModeAffichage {
  let brut: string | null | undefined;
  try {
    brut = estBureau() ? window.bureau?.donnees[CLE_AFFICHAGE] : typeof localStorage === 'undefined' ? undefined : localStorage.getItem(CLE_AFFICHAGE);
  } catch {
    brut = undefined;
  }
  return brut && MODES.includes(brut) ? (brut as ModeAffichage) : AFFICHAGE.BUREAU;
}

/** Le mode de cette session : changer d'affichage recharge la fenêtre, il ne change donc pas en cours de route. */
export const modeAffichage: ModeAffichage = lireMode();

/** Vrai dans la version Windows en affichage « bureau » : les menus de la fenêtre, les deux colonnes, la flèche de retour de page parente. */
export const afficheBureau = (): boolean => estBureau() && modeAffichage === AFFICHAGE.BUREAU;

/** Vrai en affichage « sobre » : sans couleur ni dessin. */
export const afficheSobre = (): boolean => modeAffichage === AFFICHAGE.SOBRE;

/** L'identifiant de la feuille de style qui passe toute la page en nuances de gris (la même est posée au plus tôt par bureau/preload.js). */
export const ID_STYLE_SOBRE = 'affichage-sobre';

/** Le mode donné par un changement d'affichage (« #affichage:mobile » envoyé par un menu de la fenêtre), ou rien. */
export const modeDeLaCommande = (commande: string): ModeAffichage | undefined => {
  const mode = commande.startsWith('#affichage:') ? commande.slice('#affichage:'.length) : '';
  return MODES.includes(mode) ? (mode as ModeAffichage) : undefined;
};
