import { ROUTES } from '@/shared/constants/routes';

/** Les onglets de la barre du bas, dans l'ordre (un élevage avec production). */
export const ONGLETS_DU_BAS = ['accueil', 'cheptel', 'production', 'commercial', 'comptabilite', 'organisation'] as const;
export type OngletDuBas = (typeof ONGLETS_DU_BAS)[number];

/**
 * Une étape de la visite guidée : une page, ce qu'on y montre, et ce que l'utilisateur est invité à toucher. L'étape s'affiche quand on est
 * sur sa page ; toucher la zone en surbrillance ouvre la page suivante, dont l'étape prend le relais.
 */
export interface EtapeVisite {
  id: string;
  /** La page où l'étape s'affiche : son adresse, ou un motif d'adresse ; sans elle, partout. */
  route?: string | RegExp;
  titre: string;
  texte: string;
  /** Le texte sur ordinateur, quand il diffère (les onglets du bas y sont des menus en haut de la fenêtre). */
  texteBureau?: string;
  /** L'élément de la page à toucher (voir AncreVisite) : mis en surbrillance, le reste de l'écran est voilé. */
  ancre?: string;
  /** L'onglet de la barre du bas à toucher (téléphone) : mis en surbrillance. */
  onglet?: OngletDuBas;
  /** La flèche de retour de l'en-tête (en haut à gauche) est à toucher : mise en surbrillance (sur Windows, quand la page en a une). */
  retour?: boolean;
  /** Vrai : l'étape attend qu'on touche la zone (on passe à la page suivante en la touchant) ; sinon, un bouton « Suivant » la termine. */
  clic?: boolean;
}

/** Les pages du cheptel qui ne sont pas la fiche d'un animal. */
const PAGES_CHEPTEL =
  'index|liste|ajout-rapide|bibliotheque|bilan|dossier-pac|historique|lot|lots-categorie|lots-categories|lots|naissance-nouvelle|naissances|nouvelle|reglages|tableau-de-bord|traitement|traitements|documents-circulation';
/** L'adresse de la fiche d'un animal : « /cheptel/ » suivi de son identifiant. */
export const FICHE_ANIMAL = new RegExp(`^/cheptel/(?!(?:${PAGES_CHEPTEL})$)[^/]+$`);

/** Vrai quand l'adresse courante est celle de l'étape. */
export function pageDeLEtape(route: string | RegExp | undefined, adresse: string): boolean {
  if (!route) return true;
  const propre = adresse.replace(/\/+$/, '') || '/';
  return typeof route === 'string' ? propre === route : route.test(propre);
}

/**
 * L'étape à afficher sur une page : l'étape en cours si c'est la sienne, sinon la première étape suivante de cette page (l'utilisateur a
 * avancé en touchant un bouton), sinon la dernière étape précédente (il est revenu en arrière), sinon l'étape en cours (page hors visite).
 */
export function etapeDeLaPage(etapes: readonly EtapeVisite[], index: number, adresse: string): number {
  const courante = etapes[index];
  if (courante && pageDeLEtape(courante.route, adresse)) return index;
  const apres = etapes.findIndex((e, i) => i > index && pageDeLEtape(e.route, adresse));
  if (apres >= 0) return apres;
  for (let i = index - 1; i >= 0; i--) if (pageDeLEtape(etapes[i].route, adresse)) return i;
  return index;
}

/**
 * L'étape où « Suivant » ou « Passer cette étape » mène, et la page à ouvrir pour s'y rendre (rien si l'on y est déjà). Une étape qui n'a pas
 * d'adresse précise (la fiche d'un animal, dont on ignore laquelle) est passée quand on n'y est pas.
 */
export function etapeSuivante(
  etapes: readonly EtapeVisite[],
  index: number,
  adresse: string,
): { index: number; ouvrir?: string } | null {
  let suivante = index + 1;
  while (suivante < etapes.length && etapes[suivante].route instanceof RegExp && !pageDeLEtape(etapes[suivante].route, adresse)) suivante++;
  if (suivante >= etapes.length) return null;
  const route = etapes[suivante].route;
  return { index: suivante, ouvrir: typeof route === 'string' && !pageDeLEtape(route, adresse) ? route : undefined };
}

/**
 * La visite guidée, page après page : elle présente chaque page et invite à toucher les boutons de l'interface pour passer à la suivante.
 * Elle commence sur l'accueil, passe par le cheptel, la production, la comptabilité et l'organisation.
 */
export function etapesDeLaVisite(): EtapeVisite[] {
  return [
    {
      id: 'accueil.bienvenue',
      route: '/',
      titre: 'Bienvenue',
      texte: 'Cette visite vous montre l’application page après page. Ici, l’accueil : ce qui demande qu’on s’en occupe (santé du troupeau, rappels) et les chiffres de l’année.',
    },
    {
      id: 'accueil.filtres',
      route: '/',
      ancre: 'accueil.filtres',
      titre: 'L’année et l’espèce',
      texte: 'Choisissez ici l’année et l’espèce : tout l’écran, et la plupart des listes de l’application, suivent ce choix.',
    },
    {
      id: 'accueil.cheptel',
      route: '/',
      onglet: 'cheptel',
      clic: true,
      titre: 'Le cheptel',
      texte: 'Touchez l’onglet Cheptel, en bas, pour ouvrir le troupeau.',
      texteBureau: 'Ouvrez le menu Cheptel, dans la barre du haut de la fenêtre.',
    },
    {
      id: 'cheptel.menu',
      route: ROUTES.CHEPTEL,
      titre: 'Le menu du Cheptel',
      texte: 'Le troupeau, la santé, l’identification et le dossier PAC, les statistiques : chaque ligne ouvre une page. Chacune dit en une phrase ce qu’on y trouve.',
    },
    {
      id: 'cheptel.animaux',
      route: ROUTES.CHEPTEL,
      ancre: `rubrique:${ROUTES.CHEPTEL_LISTE}`,
      clic: true,
      titre: 'Les animaux',
      texte: 'Touchez « Animaux » pour voir la liste des animaux vivants.',
    },
    {
      id: 'cheptel.liste',
      route: ROUTES.CHEPTEL_LISTE,
      ancre: 'fab',
      titre: 'La liste des animaux',
      texte: 'Tous vos animaux vivants, avec leur boucle, leur sexe et leur naissance. La recherche et « Filtrer » retrouvent un animal ; le bouton + ajoute un animal, ou déclare une naissance depuis sa mère.',
    },
    {
      id: 'cheptel.fiche.ouvrir',
      route: ROUTES.CHEPTEL_LISTE,
      ancre: 'cheptel.premiereLigne',
      titre: 'Ouvrir une fiche',
      texte: 'Touchez un animal de la liste pour ouvrir sa fiche.',
      clic: true,
    },
    {
      id: 'cheptel.fiche',
      route: FICHE_ANIMAL,
      titre: 'La fiche d’un animal',
      texte: 'Trois onglets : Fiche (identité, bouclage ; « Modifier la fiche » s’enregistre tout seul), Santé (visites et traitements) et Reproduction (lots de l’année, mère et père, descendance, signaler un avortement). Le menu en haut à droite supprime l’animal.',
    },
    {
      id: 'cheptel.retour',
      route: FICHE_ANIMAL,
      retour: true,
      clic: true,
      titre: 'Revenir à la liste',
      texte: 'Touchez la flèche en haut à gauche : elle ramène à la page précédente, ici la liste des animaux.',
    },
    {
      id: 'cheptel.retour.menu',
      route: ROUTES.CHEPTEL_LISTE,
      retour: true,
      onglet: 'cheptel',
      clic: true,
      titre: 'Revenir au menu du Cheptel',
      texte: 'Touchez encore la flèche en haut à gauche pour revenir au menu du Cheptel.',
      texteBureau: 'Ouvrez le menu Cheptel, dans la barre du haut de la fenêtre, pour la suite.',
    },
    {
      id: 'cheptel.naissances',
      route: ROUTES.CHEPTEL,
      ancre: `rubrique:${ROUTES.CHEPTEL_NAISSANCES}`,
      clic: true,
      titre: 'Les naissances',
      texte: 'Touchez « Naissances » : les mises bas, portée par portée.',
    },
    {
      id: 'cheptel.naissances.page',
      route: ROUTES.CHEPTEL_NAISSANCES,
      titre: 'Les mises bas',
      texte: 'Chaque carte est une mise bas : la mère, la date et les petits, avec leur devenir (vivant, vendu…). Le bouton du haut imprime le carnet de mise bas en livret à plier ; en A4, il est dans Organisation › Mes données › PDF.',
    },
    {
      id: 'cheptel.dossier',
      route: ROUTES.CHEPTEL,
      ancre: `rubrique:${ROUTES.CHEPTEL_DOSSIER_PAC}`,
      clic: true,
      titre: 'Le dossier PAC',
      texte: 'Revenez au menu du Cheptel, puis touchez « Dossier PAC » : tous les documents de la campagne.',
    },
    {
      id: 'cheptel.dossier.page',
      route: ROUTES.CHEPTEL_DOSSIER_PAC,
      ancre: 'dossier.circulation',
      clic: true,
      titre: 'Les documents de la campagne',
      texte: 'Le suivi des mouvements, les bordereaux de perte, le recensement : un appui génère chaque document, rempli d’après le cheptel. Touchez « Documents de circulation » : ils sont obligatoires pour tout transport d’animaux vivants.',
    },
    {
      id: 'cheptel.circulation',
      route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION,
      titre: 'Les documents de circulation',
      texte: 'Chaque vente ou achat d’animaux vivants est listé. Touchez l’icône d’une écriture : déposez votre document rempli (scan, photo), ou générez le modèle pré-rempli. Tant qu’il manque, l’accueil vous le rappelle.',
    },
    {
      id: 'compta.onglet',
      route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION,
      onglet: 'comptabilite',
      clic: true,
      titre: 'La comptabilité',
      texte: 'Touchez l’onglet Comptabilité, en bas.',
      texteBureau: 'Ouvrez le menu Comptabilité, dans la barre du haut de la fenêtre.',
    },
    {
      id: 'compta.menu',
      route: ROUTES.COMPTABILITE,
      ancre: `rubrique:${ROUTES.COMPTABILITE_LISTE}`,
      clic: true,
      titre: 'Le menu de la Comptabilité',
      texte: 'Les écritures et l’inventaire, le pilotage (trésorerie, rentabilité, TVA), les déclarations et les comptes. Touchez « Écritures ».',
    },
    {
      id: 'compta.ecritures',
      route: ROUTES.COMPTABILITE_LISTE,
      ancre: 'fab',
      titre: 'Les écritures',
      texte: 'Toutes les ventes et factures de l’année. Le bouton + saisit une écriture, en deux étapes : un débit (dépense) ou un crédit (recette) ; d’abord le contact et la facture, puis ce qui est acheté ou vendu. Un appui sur une écriture l’ouvre.',
    },
    {
      id: 'organisation.onglet',
      route: ROUTES.COMPTABILITE_LISTE,
      onglet: 'organisation',
      clic: true,
      titre: 'L’organisation',
      texte: 'Touchez l’onglet Organisation, tout à droite.',
      texteBureau: 'Ouvrez le menu Organisation, dans la barre du haut de la fenêtre.',
    },
    {
      id: 'organisation.menu',
      route: ROUTES.REGLAGES,
      ancre: `rubrique:${ROUTES.ORGANISATION_REGLES}`,
      clic: true,
      titre: 'Ce qui est commun à toute l’exploitation',
      texte: 'L’établissement, les contacts et leurs catégories, vos données (export, PDF, sauvegarde, Google Drive). Touchez « Réglages » : les règles que l’application applique.',
    },
    {
      id: 'organisation.regles',
      route: ROUTES.ORGANISATION_REGLES,
      titre: 'Les règles de l’application',
      texte: 'Voici toutes les règles que l’application applique aujourd’hui, par domaine. C’est la fin de la visite : vous pouvez la reprendre depuis l’accueil, et le didacticiel détaille toutes les options.',
    },
  ];
}
