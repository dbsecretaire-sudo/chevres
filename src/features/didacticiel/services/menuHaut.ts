import type { OngletDuBas } from '@/features/didacticiel/services/visiteGuidee';
import { TEXTES } from '@/shared/textes';

/** Le nom, dans la barre de menus de la fenêtre Windows, de ce que l'onglet du bas est sur téléphone. */
export function libelleDuMenu(onglet: OngletDuBas, planDeLaFerme = false): string {
  return {
    accueil: TEXTES.navigation.layout.accueil,
    // Avec le plan de la ferme, le cheptel est dans le menu Exploitation, la production dans l'Atelier, le commercial dans l'Agritourisme.
    cheptel: planDeLaFerme ? TEXTES.accueil.ferme.zones.enclos : TEXTES.commun.general.cheptel,
    production: planDeLaFerme ? TEXTES.accueil.ferme.transformation.pastille : TEXTES.production.titre,
    commercial: planDeLaFerme ? TEXTES.accueil.ferme.agritourisme.titre : TEXTES.commercial.titre,
    comptabilite: TEXTES.commun.general.comptabilite,
    organisation: TEXTES.navigation.layout.reglages,
  }[onglet];
}

/** La marge à gauche de la barre de menus, et l'espace entre deux menus (la barre est dessinée par Windows, hors de la page). */
const DEPART = 8;
const ESPACE = 12;

/**
 * Où est un menu dans la barre du haut de la fenêtre : le centre de son nom, en pixels depuis le bord gauche. La barre n'est pas dans la page
 * (c'est Windows qui la dessine) : on la reconstitue d'après la largeur des noms, mis bout à bout. Une estimation, assez juste pour une flèche.
 */
export function centreDuMenu(libelles: readonly string[], libelle: string, mesure: (texte: string) => number): number | null {
  let x = DEPART;
  for (const l of libelles) {
    const largeur = mesure(l);
    if (l === libelle) return x + largeur / 2;
    x += largeur + ESPACE;
  }
  return null;
}
