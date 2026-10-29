import { estUnEcranDeLaRubrique } from '@/features/accueil/rubriques/rubriquesDuPlus';

/**
 * Le Précédent du téléphone, pour chaque page : la page d'où l'on vient (la racine de sa rubrique, ou l'accueil pour les lieux de la ferme).
 * C'est une seule règle, lue par la flèche de l'en-tête : une page racine (l'accueil, Chèvres, Atelier, Visites, Plus) n'a pas de Précédent.
 * `lieu` : le paramètre « lieu » d'une page des lieux (la grange, l'animaux…), quand il y en a un.
 */

/** Les pages racines : l'accueil et les quatre rubriques de la barre du bas. */
export const PAGES_RACINES: readonly string[] = ['/', '/cheptel', '/production', '/visites', '/plus'];

/** Les pages ouvertes depuis les tuiles de l'accueil (Estive, Santé, Partenaires) : leur Précédent est l'accueil. */
const PAGES_DE_L_ACCUEIL: Record<string, string> = {
  '/cheptel/dossier-pac': '/',
  '/cheptel/traitements': '/',
  '/commercial/partenaires': '/',
  '/rappels': '/',
  '/rappels-historique': '/rappels',
};

/** Les lieux de la ferme qui s'ouvrent depuis l'accueil (la grange, les aliments) et ceux qui relèvent du cheptel (les animaux). */
const LIEUX_DE_L_ACCUEIL = ['grange', 'aliments'];
const LIEUX_DU_CHEPTEL = ['animaux'];

/** Les pages du commercial qui relèvent des Visites ; les autres (ventes, tarifs, commandes, partenaires) sont dans Plus. */
const COMMERCIAL_DES_VISITES = ['/commercial/visite', '/commercial/visites-simple', '/commercial/visite-simple', '/commercial/agritourisme', '/commercial/formules', '/commercial/formule', '/commercial/formules-simple', '/commercial/accueil-public', '/commercial/accueil-public-simple', '/commercial/groupes'];

/** La page d'où l'on vient pour une page donnée ; rien pour une page racine. */
export function parentDeLaPage(adresse: string, lieu?: string): string | undefined {
  if (PAGES_RACINES.includes(adresse)) return undefined;
  if (adresse in PAGES_DE_L_ACCUEIL) return PAGES_DE_L_ACCUEIL[adresse];
  // Chaque écran du menu Argent revient à Argent ; ses sous-pages (fiscalité, trésorerie) à leur écran parent.
  if (estUnEcranDeLaRubrique('argent', adresse, lieu)) return '/rubrique/argent';
  if (/^\/comptabilite\/(fiscalite-impots|fiscalite-rsa|fiscalite-rsa-trimestrielle|fiscalite-rsa-annuelle)$/.test(adresse)) return '/comptabilite/fiscalite';
  if (adresse === '/comptabilite/tresorerie-reglages') return '/comptabilite/tresorerie';
  // La saisie d'une écriture revient à la liste des écritures.
  if (adresse === '/comptabilite/nouvelle') return '/comptabilite/liste';
  if (/^\/comptabilite\/(facture|vente)\/[^/]+$/.test(adresse)) return '/comptabilite/liste';
  if (adresse === '/production/lieu') {
    if (lieu && LIEUX_DE_L_ACCUEIL.includes(lieu)) return '/';
    if (lieu && LIEUX_DU_CHEPTEL.includes(lieu)) return '/cheptel';
    return '/production';
  }
  const premier = adresse.split('/')[1] ?? '';
  switch (premier) {
    case 'cheptel':
    case 'sante':
      return '/cheptel';
    case 'production':
      return '/production';
    case 'commercial':
      return COMMERCIAL_DES_VISITES.includes(adresse) || adresse.startsWith('/commercial/visite') ? '/visites' : '/plus';
    default:
      // Argent, réglages, organisation, didacticiel, clients : ce sont les rubriques du menu Plus.
      return '/plus';
  }
}
