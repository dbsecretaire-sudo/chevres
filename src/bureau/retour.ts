import { FAMILLE_CONTROLE, ONGLET_SANTE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';

/** Une adresse sans sa requête (« ?famille=… ») ni barre finale. */
const sansRequete = (adresse: string): string => adresse.split('?')[0].replace(/\/+$/, '') || '/';

/**
 * Les écrans que le menu de gauche (la version Windows en deux colonnes) montre : ce sont les lignes des accueils du Cheptel, de la
 * Production, de la Comptabilité et de l'Organisation. Leur flèche de retour disparaît : le menu fait office de navigation.
 */
const ECRANS_DU_MENU = new Set(
  [
    ROUTES.CHEPTEL_TRAITEMENTS,
    ROUTES.CHEPTEL_LOTS,
    ROUTES.CHEPTEL_NAISSANCES,
    ROUTES.CHEPTEL_HISTORIQUE,
    ROUTES.CHEPTEL_DOSSIER_PAC,
    ROUTES.CHEPTEL_TABLEAU_DE_BORD,
    ROUTES.CHEPTEL_BILAN,
    ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE),
    ROUTES.santeControles(FAMILLE_CONTROLE.ANIMAUX),
    ROUTES.SANTE_ALIMENTATION,
    ROUTES.CHEPTEL_REGLAGES,
    ROUTES.PRODUCTION_FROMAGES,
    ROUTES.PRODUCTION_LAITERIE,
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
    ROUTES.CONTACTS,
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
    ROUTES.ORGANISATION_REGLES,
  ].map(sansRequete),
);

/** Vrai pour un écran que le menu de gauche montre déjà. */
export const dansLeMenuDeGauche = (adresse: string): boolean => ECRANS_DU_MENU.has(sansRequete(adresse));

/** Ce que la requête de l'adresse apporte à la page parente (« ?famille=… », « ?groupementId=… »). */
export interface ParametresDePage {
  famille?: string;
  groupementId?: string;
  /** La fiche du contact d'où vient une page de dossier. */
  contact?: string;
}

/**
 * La page parente d'un écran qui n'est pas dans le menu : celle d'où l'on vient d'ordinaire (une facture revient aux écritures, une
 * fiche d'animal à la liste du cheptel). Sans mémoire de la page précédente : la flèche recharge cette page.
 */
const PARENTS: [RegExp, (m: RegExpExecArray, p: ParametresDePage) => string][] = [
  [/^\/comptabilite\/(facture|vente)\/[^/]+$/, () => ROUTES.COMPTABILITE_LISTE],
  [/^\/comptabilite\/nouvelle$/, () => ROUTES.COMPTABILITE_LISTE],
  [/^\/comptabilite\/fournisseurs$/, () => ROUTES.CONTACTS],
  // Un dossier d'un contact revient à sa fiche.
  [/^\/comptabilite\/contacts\/dossier$/, (_, p) => (p.contact ? ROUTES.ficheContact(p.contact) : ROUTES.CONTACTS)],
  [/^\/comptabilite\/(clients|fournisseurs|contacts|comptes-pcg)\/(?!index$)[^/]+$/, (m) => `/comptabilite/${m[1]}`],
  [/^\/comptabilite\/plan-comptable$/, () => ROUTES.COMPTES_PCG],
  // Un contrat d'assurance revient à la page de l'assurance (les contrats de tous les assureurs).
  [/^\/comptabilite\/contacts\/contrat$/, () => ROUTES.lieu('assurance')],
  [/^\/comptabilite\/(stocks|conditionnement)$/, () => ROUTES.COMPTABILITE_INVENTAIRE],
  [/^\/comptabilite\/stock-(historique|statistiques|structure)$/, () => ROUTES.COMPTABILITE_STOCKS],
  [/^\/comptabilite\/tresorerie-reglages$/, () => ROUTES.COMPTABILITE_TRESORERIE],
  [/^\/comptabilite\/(fiscalite-impots|fiscalite-rsa|urssaf)$/, () => ROUTES.FISCALITE],
  [/^\/comptabilite\/taux$/, () => ROUTES.COMPTABILITE_REGLAGES],
  [/^\/comptabilite\/detail$/, () => ROUTES.COMPTABILITE_LISTE],
  // Un lot revient aux lots d'animaux, un traitement aux traitements, une nouvelle naissance aux naissances.
  [/^\/cheptel\/(lot|lots-categories?)$/, () => ROUTES.CHEPTEL_LOTS],
  // Les documents de circulation se trouvent dans le dossier PAC : on y revient (que l'écran s'ouvre d'ici ou d'un rappel de l'accueil).
  [/^\/cheptel\/documents-circulation$/, () => ROUTES.CHEPTEL_DOSSIER_PAC],
  // Un lot ouvert depuis la Production revient à la viande ; depuis la Comptabilité, aux écritures.
  [/^\/production\/lot$/, () => ROUTES.PRODUCTION_VIANDE],
  // Les documents et les rapports d'essais se trouvent sur la page du groupement sanitaire : on y revient, pas à l'accueil de la Production.
  [/^\/production\/(documents-gds|rapports-essais)$/, () => ROUTES.lieu('groupementSanitaire')],
  // L'assistant d'une vente d'animaux vivants revient à la liste des ventes.
  [/^\/production\/ventes-vivants$/, () => ROUTES.lieu('animaux')],
  [/^\/production\/depart$/, () => ROUTES.VENTES_VIVANTS],
  // La fiche d'un enlèvement revient à la liste des enlèvements, qui revient à la page de l'équarrissage.
  [/^\/production\/enlevement$/, () => ROUTES.ENLEVEMENTS],
  [/^\/production\/enlevements$/, () => ROUTES.lieu('equarrissage')],
  // Le rapport d'essais d'une visite revient à la liste des rapports d'essais.
  [/^\/production\/rapport-essais$/, () => ROUTES.RAPPORTS_ESSAIS_GDS],
  // La flotte revient au garage, un véhicule à la flotte.
  [/^\/production\/flotte$/, () => ROUTES.lieu('garage')],
  // La page d'un lieu de la ferme (un intervenant, la grange, tous les animaux) revient à l'accueil de la ferme.
  [/^\/production\/lieu$/, () => '/'],
  [/^\/production\/vehicule$/, () => ROUTES.FLOTTE],
  [/^\/comptabilite\/lot$/, () => ROUTES.COMPTABILITE_LISTE],
  [/^\/cheptel\/traitement$/, () => ROUTES.CHEPTEL_TRAITEMENTS],
  [/^\/cheptel\/naissance-nouvelle$/, () => ROUTES.CHEPTEL_NAISSANCES],
  [/^\/cheptel\/(nouvelle|ajout-rapide)$/, () => ROUTES.CHEPTEL_LISTE],
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
  // Les listes de lots (fromages, viande, charcuterie, plats préparés, savons) reviennent à la page des lots de l'atelier, le dossier d'un savon à la liste des savons.
  [/^\/production\/(fromages|viande|charcuterie|plats|savons)$/, () => ROUTES.PRODUCTION_LOTS],
  [/^\/production\/savon-dossier$/, () => ROUTES.PRODUCTION_SAVONS],
  [/^\/production\/(lots|registre-analyses|recettes)$/, () => '/'],
  [/^\/production\/(analyses-produit|analyse-produit)$/, () => ROUTES.PRODUCTION_REGISTRE_ANALYSES],
  [/^\/production\/(fabrication|statistiques)$/, () => ROUTES.PRODUCTION_FROMAGES],
  [/^\/production\/rappel$/, () => ROUTES.PRODUCTION_RAPPELS_LOTS],
  [/^\/commercial\/commande$/, () => ROUTES.COMMERCIAL_COMMANDES],
  [/^\/commercial\/(visite|accueil-public)$/, () => ROUTES.COMMERCIAL_AGRITOURISME],
  [/^\/commercial\/formule$/, () => ROUTES.COMMERCIAL_FORMULES],
  // Un contrôle revient à sa liste (celle des contrôles des animaux ou de surface, ou celle des terrains), une visite à la liste des visites.
  [
    /^\/sante\/controles\/nouvelle$/,
    (_, p) =>
      p.famille === FAMILLE_CONTROLE.SURFACE
        ? ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.SURFACE, FAMILLE_CONTROLE.SURFACE)
        : p.famille === FAMILLE_CONTROLE.TERRAIN
          ? ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.SURFACE, FAMILLE_CONTROLE.TERRAIN)
          : ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.ANIMAUX),
  ],
  [/^\/sante\/veterinaire\/visite$/, () => ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, ONGLET_SANTE)],
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
 * La ligne du menu de gauche qui représente un écran absent du menu (un écran « de dessous ») : celle de sa page parente. Les documents
 * de circulation s'ouvrent du dossier PAC, même depuis un rappel de l'accueil : c'est la ligne « Dossier PAC » qui s'allume. De même la
 * déclaration RSA, l'URSSAF et les impôts : ce sont des écrans de la Fiscalité (Comptabilité › Fiscalité › Déclaration RSA).
 */
export const ligneDuMenuDe = (adresse: string): string => {
  const chemin = sansRequete(adresse);
  if (/^\/cheptel\/documents-circulation$/.test(chemin)) return ROUTES.CHEPTEL_DOSSIER_PAC;
  if (/^\/comptabilite\/(fiscalite-impots|fiscalite-rsa|urssaf)$/.test(chemin)) return ROUTES.FISCALITE;
  // Un lot ouvert depuis une vente reste dans la Comptabilité : c'est la ligne des écritures qui s'allume.
  if (/^\/comptabilite\/lot$/.test(chemin)) return ROUTES.COMPTABILITE_LISTE;
  return adresse;
};

/**
 * Vrai quand l'adresse est celle d'un accueil de rubrique lui-même (« /cheptel », « /comptabilite »…) et non celle d'un écran de dessous.
 * Sur Windows, l'accueil d'une rubrique redirige vers son écran principal ; il ne doit jamais écraser un écran plus profond demandé
 * d'ailleurs (un rappel de l'accueil, le courrier d'un contact) : l'accueil de la rubrique se monte alors sous l'écran, sans être l'adresse.
 */
export const estLaRacineDUneRubrique = (adresse: string): boolean => sansRequete(adresse).split('/').filter(Boolean).length === 1;

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
