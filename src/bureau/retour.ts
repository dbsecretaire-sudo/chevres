import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';

/** Une adresse sans sa requête (« ?famille=… ») ni barre finale. */
const sansRequete = (adresse: string): string => adresse.split('?')[0].replace(/\/+$/, '') || '/';

/**
 * Les écrans que le menu de gauche (la version Windows en deux colonnes) montre : ce sont les lignes des accueils du Cheptel, de la
 * Production, de la Comptabilité et de l'Organisation. Leur flèche de retour disparaît : le menu fait office de navigation.
 */
const ECRANS_DU_MENU = new Set(
  [
    ROUTES.CHEPTEL_LISTE,
    ROUTES.CHEPTEL_TRAITEMENTS,
    ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE),
    ROUTES.santeControles(FAMILLE_CONTROLE.ANIMAUX),
    ROUTES.SANTE_ALIMENTATION,
    ROUTES.CHEPTEL_REGLAGES,
    ROUTES.PRODUCTION_FROMAGES,
    ROUTES.PRODUCTION_LAIT,
    ROUTES.PRODUCTION_VIANDE,
    ROUTES.PRODUCTION_OEUFS,
    ROUTES.PRODUCTION_CHARCUTERIE,
    ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
    ROUTES.santeControles(FAMILLE_CONTROLE.GROUPEMENT),
    ROUTES.santeControles(FAMILLE_CONTROLE.OFFICIEL),
    ROUTES.santeControles(FAMILLE_CONTROLE.SALMONELLE),
    ROUTES.PRODUCTION_RAPPELS_LOTS,
    ROUTES.COMMERCIAL_VENTES,
    ROUTES.CLIENTS,
    ROUTES.COMMERCIAL_TARIFS,
    ROUTES.COMMERCIAL_COMMANDES,
    ROUTES.COMMERCIAL_CIRCUITS,
    ROUTES.COMMERCIAL_AGRITOURISME,
    ROUTES.COMMERCIAL_FORMULES,
    ROUTES.COMPTABILITE_LISTE,
    ROUTES.COMPTABILITE_INVENTAIRE,
    ROUTES.COMPTABILITE_TRESORERIE,
    ROUTES.RENTABILITE,
    ROUTES.TVA,
    ROUTES.FISCALITE,
    ROUTES.COMPTES_PCG,
    ROUTES.COMPTABILITE_REGLAGES,
    ROUTES.ORGANISATION_ETABLISSEMENT,
    ROUTES.ORGANISATION_TIERS,
    ROUTES.ORGANISATION_DONNEES,
  ].map(sansRequete),
);

/** Vrai pour un écran que le menu de gauche montre déjà. */
export const dansLeMenuDeGauche = (adresse: string): boolean => ECRANS_DU_MENU.has(sansRequete(adresse));

/** Ce que la requête de l'adresse apporte à la page parente (« ?famille=… », « ?groupementId=… »). */
export interface ParametresDePage {
  famille?: string;
  groupementId?: string;
}

/**
 * La page parente d'un écran qui n'est pas dans le menu : celle d'où l'on vient d'ordinaire (une facture revient aux écritures, une
 * fiche d'animal à la liste du cheptel). Sans mémoire de la page précédente : la flèche recharge cette page.
 */
const PARENTS: [RegExp, (m: RegExpExecArray, p: ParametresDePage) => string][] = [
  [/^\/comptabilite\/(facture|vente)\/[^/]+$/, () => ROUTES.COMPTABILITE_LISTE],
  [/^\/comptabilite\/nouvelle$/, () => ROUTES.COMPTABILITE_LISTE],
  [/^\/comptabilite\/(clients|fournisseurs|contacts|comptes-pcg)\/(?!index$)[^/]+$/, (m) => `/comptabilite/${m[1]}`],
  [/^\/comptabilite\/(stocks|conditionnement)$/, () => ROUTES.COMPTABILITE_INVENTAIRE],
  [/^\/comptabilite\/stock-(historique|statistiques|structure)$/, () => ROUTES.COMPTABILITE_STOCKS],
  [/^\/comptabilite\/tresorerie-reglages$/, () => ROUTES.COMPTABILITE_TRESORERIE],
  [/^\/comptabilite\/(fiscalite-impots|fiscalite-rsa|urssaf)$/, () => ROUTES.FISCALITE],
  [/^\/comptabilite\/taux$/, () => ROUTES.COMPTABILITE_REGLAGES],
  [/^\/comptabilite\/detail$/, () => ROUTES.COMPTABILITE_LISTE],
  [/^\/cheptel\/(nouvelle|naissance-nouvelle|ajout-rapide)$/, () => ROUTES.CHEPTEL_LISTE],
  [
    /^\/cheptel\/(?!liste$|bilan$|historique$|naissances$|reglages$|index$)[^/]+$/,
    () => ROUTES.CHEPTEL_LISTE,
  ],
  [/^\/cheptel\/(bilan|historique|naissances)$/, () => ROUTES.CHEPTEL_LISTE],
  // Un groupement revient à la liste des groupements, un contenu à son groupement, un nouveau contrôle à la liste de sa famille.
  [/^\/commercial\/partenaires\/groupement$/, () => ROUTES.santeControles(FAMILLE_CONTROLE.GROUPEMENT)],
  [
    /^\/commercial\/partenaires\/contenu$/,
    (_, p) =>
      p.groupementId ? ROUTES.santeGroupement(p.groupementId) : ROUTES.santeControles(FAMILLE_CONTROLE.GROUPEMENT),
  ],
  [
    /^\/(?:production\/controles|commercial\/partenaires)\/nouvelle$/,
    (_, p) =>
      ROUTES.santeControles(
        p.famille === FAMILLE_CONTROLE.GROUPEMENT ? FAMILLE_CONTROLE.GROUPEMENT : FAMILLE_CONTROLE.LAITIER,
      ),
  ],
  [/^\/production\/(fabrication|statistiques)$/, () => ROUTES.PRODUCTION_FROMAGES],
  [/^\/production\/rappel$/, () => ROUTES.PRODUCTION_RAPPELS_LOTS],
  [/^\/commercial\/commande$/, () => ROUTES.COMMERCIAL_COMMANDES],
  [/^\/commercial\/visite$/, () => ROUTES.COMMERCIAL_AGRITOURISME],
  [/^\/commercial\/formule$/, () => ROUTES.COMMERCIAL_FORMULES],
  [/^\/sante\/controles\/nouvelle$/, () => ROUTES.santeControles(FAMILLE_CONTROLE.ANIMAUX)],
  [/^\/sante\/veterinaire\/visite$/, () => ROUTES.santeControles(FAMILLE_CONTROLE.ANIMAUX)],
  [/^\/organisation-categories-(client|tiers)$/, () => ROUTES.ORGANISATION_TIERS],
  [/^\/documents-identification$/, () => ROUTES.ORGANISATION_ETABLISSEMENT],
  [/^\/document-identification$/, () => ROUTES.DOCUMENTS_IDENTIFICATION],
  [/^\/(export-donnees|pdf-donnees|sauvegarde-locale|google-drive)$/, () => ROUTES.ORGANISATION_DONNEES],
  [/^\/structure-dossiers$/, () => ROUTES.ORGANISATION_ETABLISSEMENT],
  [/^\/clients\/(?!liste$|index$|journal$|dossiers-clients$|nouveau$)[^/]+$/, () => ROUTES.CLIENTS],
  [/^\/clients\/(nouveau|journal|dossiers-clients)$/, () => ROUTES.CLIENTS],
];

/** Les rubriques de l'application : chacune a son accueil, à son adresse. */
const RUBRIQUES = ['cheptel', 'production', 'commercial', 'comptabilite', 'clients'];

/**
 * La page vers laquelle la flèche de retour mène : la page parente de l'écran, à défaut l'accueil de sa rubrique. Rien sur l'accueil
 * et sur l'accueil d'une rubrique, qui n'ont pas de flèche.
 */
export function pageParente(adresse: string, parametres: ParametresDePage = {}): string | null {
  const chemin = sansRequete(adresse);
  for (const [motif, parent] of PARENTS) {
    const trouve = motif.exec(chemin);
    if (trouve) return parent(trouve, parametres);
  }
  const segments = chemin.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  // Une rubrique : l'accueil de la rubrique (la santé fait partie du cheptel) ; les autres pages : l'accueil de l'application.
  const rubrique = segments[0] === 'sante' ? 'cheptel' : segments[0];
  if (RUBRIQUES.includes(rubrique)) return segments.length >= 2 ? `/${rubrique}` : null;
  return '/';
}
