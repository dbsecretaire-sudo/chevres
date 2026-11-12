import { estUnEcranDeLaRubrique } from '@/features/accueil/rubriques/rubriquesDuPlus';

/**
 * Le Précédent du téléphone, pour chaque page : la page d'où l'on vient (la racine de sa rubrique, ou l'accueil pour les lieux de la ferme).
 * C'est une seule règle, lue par la flèche de l'en-tête : une page racine (l'accueil, Chèvres, Atelier, Visites, Plus) n'a pas de Précédent.
 * `lieu` : le paramètre « lieu » d'une page des lieux (la grange, l'animaux…), quand il y en a un.
 */

/** Les pages racines : l'accueil et les rubriques de la barre du bas. L'Atelier n'en est plus une : il s'ouvre depuis la Ferme. */
const PAGES_RACINES: readonly string[] = ['/', '/cheptel', '/comptabilite', '/contacts', '/comptabilite/contacts', '/comptabilite/stocks', '/plus'];

/** Les pages ouvertes depuis les tuiles de l'accueil (Estive, Santé, Partenaires) : leur Précédent est l'accueil. */
const PAGES_DE_L_ACCUEIL: Record<string, string> = {
  // Le Dossier PAC (ex-Estive) est dans les Documents : sa flèche y revient.
  '/cheptel/dossier-pac': '/rubrique/documents',
  '/cheptel/traitements': '/',
  '/commercial/partenaires': '/',
  '/rappels': '/',
  '/rappels-historique': '/rappels',
  // L'Atelier, le Commerce et les Documents s'ouvrent depuis la Ferme : leur Précédent est la Ferme.
  '/production': '/cheptel',
  '/rubrique/commerce': '/cheptel',
  '/rubrique/documents': '/cheptel',
  '/rubrique/sante': '/cheptel',
  // Le stock : la structure des listes, l'historique et les statistiques reviennent au stock.
  '/comptabilite/stock-structure': '/comptabilite/stocks',
  '/comptabilite/stock-historique': '/comptabilite/stocks',
  '/comptabilite/stock-statistiques': '/comptabilite/stocks',
  // Les Ventes sont dans l'Atelier ; les commandes reviennent au Commerce.
  '/commercial/ventes': '/production',
  '/commercial/commandes': '/rubrique/commerce',
  '/commercial/commande': '/rubrique/commerce',
};

/** Les lieux de la ferme qui s'ouvrent depuis l'accueil (les aliments) et ceux qui relèvent du cheptel (les animaux). */
const LIEUX_DE_L_ACCUEIL = ['aliments'];
const LIEUX_DU_CHEPTEL = ['animaux'];

/** Les pages du commercial qui relèvent des Visites ; les autres (ventes, tarifs, commandes, partenaires) sont dans Plus. */
const COMMERCIAL_DES_VISITES = ['/commercial/visite', '/commercial/visites-simple', '/commercial/visite-simple', '/commercial/agritourisme', '/commercial/formules', '/commercial/formule', '/commercial/formules-simple', '/commercial/accueil-public', '/commercial/accueil-public-simple', '/commercial/groupes'];

/** La page d'où l'on vient pour une page donnée ; rien pour une page racine. */
export function parentDeLaPage(adresse: string, lieu?: string): string | undefined {
  if (PAGES_RACINES.includes(adresse)) return undefined;
  if (adresse in PAGES_DE_L_ACCUEIL) return PAGES_DE_L_ACCUEIL[adresse];
  // Les pages du Commerce (ventes, commandes, circuits, tarifs, viande) reviennent au Commerce ; celles des Documents, aux Documents.
  if (estUnEcranDeLaRubrique('commerce', adresse, lieu)) return '/rubrique/commerce';
  if (estUnEcranDeLaRubrique('documents', adresse, lieu)) return '/rubrique/documents';
  if (/^\/comptabilite\/(fiscalite-impots|fiscalite-rsa|fiscalite-rsa-trimestrielle|fiscalite-rsa-annuelle)$/.test(adresse)) return '/comptabilite/fiscalite';
  if (adresse === '/comptabilite/tresorerie-reglages') return '/comptabilite/tresorerie';
  // La saisie d'une écriture revient à la liste des écritures.
  if (adresse === '/comptabilite/nouvelle') return '/comptabilite/liste';
  if (/^\/comptabilite\/(facture|vente)\/[^/]+$/.test(adresse)) return '/comptabilite/liste';
  // La fiche d'une recette revient à la bibliothèque des recettes, pas à la racine de l'Atelier.
  if (adresse === '/production/recette') return '/production/recettes';
  // La fabrication d'un produit revient à la page « Fabriquer » (la liste des produits), pas à la racine de l'Atelier.
  if (adresse === '/production/fabrication-simple') return '/production/terrain?zone=fabriquer';
  if (adresse === '/production/lieu') {
    if (lieu && LIEUX_DE_L_ACCUEIL.includes(lieu)) return '/';
    if (lieu && LIEUX_DU_CHEPTEL.includes(lieu)) return '/cheptel';
    return '/production';
  }
  // La Comptabilité est un onglet : ses pages reviennent à elle, et les fiches de contact à la liste des contacts.
  if (adresse.startsWith('/comptabilite/contacts/')) return '/comptabilite/contacts';
  const premier = adresse.split('/')[1] ?? '';
  switch (premier) {
    case 'comptabilite':
      return '/comptabilite';
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
