import { ROUTES } from '@/shared/constants/routes';

/** Les onglets de la barre du bas, dans l'ordre (un élevage avec production). */
export const ONGLETS_DU_BAS = ['accueil', 'cheptel', 'production', 'commercial', 'comptabilite', 'organisation'] as const;
export type OngletDuBas = (typeof ONGLETS_DU_BAS)[number];

/** La hauteur d'un en-tête d'écran et celle de la barre des onglets du bas (sans la marge du système : barre d'état en haut, barre de navigation en bas). */
export const HAUTEUR_ENTETE = 56;
export const HAUTEUR_BARRE_ONGLETS = 56;
const LARGEUR_FLECHE_RETOUR = 64;

export interface ZoneEcran {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * La flèche de retour de l'en-tête natif (téléphone) : en haut à gauche, SOUS la barre d'état du système (`insetHaut`) — l'écran s'étend
 * derrière elle sur Android.
 */
export const zoneDeLaFlecheRetour = (insetHaut: number): ZoneEcran => ({ x: 0, y: insetHaut, w: LARGEUR_FLECHE_RETOUR, h: HAUTEUR_ENTETE });

/** Un onglet de la barre du bas (téléphone) : la barre est AU-DESSUS de la barre de navigation du système (`insetBas`). */
export const zoneDeLOnglet = (onglet: OngletDuBas, largeur: number, hauteur: number, insetBas: number): ZoneEcran => {
  const part = largeur / ONGLETS_DU_BAS.length;
  return { x: ONGLETS_DU_BAS.indexOf(onglet) * part, y: hauteur - insetBas - HAUTEUR_BARRE_ONGLETS, w: part, h: HAUTEUR_BARRE_ONGLETS };
};

/**
 * Une étape de la visite guidée : une page, ce qu'on y montre, et ce que l'utilisateur est invité à toucher. L'étape s'affiche quand on est
 * sur sa page ; toucher la zone en surbrillance ouvre la page suivante, dont l'étape prend le relais.
 */
export interface EtapeVisite {
  id: string;
  /** La page où l'étape s'affiche : son adresse, ou un motif d'adresse ; sans elle, partout. */
  route?: string | RegExp;
  /** L'adresse à ouvrir pour s'y rendre (« Suivant »), quand elle diffère de `route` : un onglet, un filtre. */
  ouvrir?: string;
  /** Vrai : l'écran n'est pas voilé (une étape d'un parcours de cas : la page reste utilisable, la bulle se pose en bas). */
  sansVoile?: boolean;
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
  /** Vrai : la page de l'étape est le menu d'une rubrique ; sur Windows (deux colonnes), ce menu est toujours à gauche : l'étape vaut pour toute page de la rubrique. */
  menu?: boolean;
  /** Vrai : l'étape n'a de sens que sur un écran étroit (téléphone) : revenir au menu d'une rubrique, qui reste affiché à gauche sur Windows. */
  etroit?: boolean;
  /** Vrai : l'étape attend qu'on touche la zone (on passe à la page suivante en la touchant) ; sinon, un bouton « Suivant » la termine. */
  clic?: boolean;
}

/** Les pages du cheptel qui ne sont pas la fiche d'un animal. */
const PAGES_CHEPTEL =
  'index|liste|ajout-rapide|bibliotheque|bilan|dossier-pac|historique|lot|lots-categorie|lots-categories|lots|naissance-nouvelle|naissances|nouvelle|reglages|tableau-de-bord|traitement|traitements|documents-circulation';
/** L'adresse de la fiche d'un animal : « /cheptel/ » suivi de son identifiant. */
export const FICHE_ANIMAL = new RegExp(`^/cheptel/(?!(?:${PAGES_CHEPTEL})$)[^/]+$`);

/**
 * Les étapes qui ont lieu sur cet écran. Sur Windows, les onglets du bas sont des menus de la fenêtre qu'on ne peut pas désigner : les étapes qui
 * demandent d'ouvrir un menu n'y ont pas lieu (« Suivant » ouvre la page d'après) ; avec deux colonnes, le menu de la rubrique est toujours à
 * gauche : les étapes « revenir au menu » non plus.
 */
export const etapesPourLEcran = (etapes: readonly EtapeVisite[], bureau: boolean, colonnes: boolean): EtapeVisite[] =>
  etapes.filter((e) => !(bureau && e.onglet) && !(colonnes && e.etroit));

/** La rubrique d'une adresse (cheptel, production, commercial, comptabilite, organisation), d'après son début. */
export function rubriqueDeLAdresse(adresse: string): string {
  const chemin = adresse.split('?')[0];
  if (/^\/(cheptel|sante)(\/|$)/.test(chemin)) return 'cheptel';
  if (/^\/production(\/|$)/.test(chemin)) return 'production';
  if (/^\/commercial(\/|$)/.test(chemin)) return 'commercial';
  if (/^\/comptabilite(\/|$)/.test(chemin)) return 'comptabilite';
  return 'organisation';
}

/**
 * Vrai quand l'étape s'affiche sur cette page. Avec deux colonnes (Windows), le menu d'une rubrique est toujours à gauche : une étape de
 * ce menu vaut pour toutes les pages de la rubrique (la ligne à toucher est visible à côté de l'écran ouvert).
 */
export function etapeSurLaPage(etape: EtapeVisite | undefined, adresse: string, colonnes = false): boolean {
  if (!etape) return false;
  if (pageDeLEtape(etape.route, adresse)) return true;
  return colonnes && !!etape.menu && typeof etape.route === 'string' && rubriqueDeLAdresse(etape.route) === rubriqueDeLAdresse(adresse);
}

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
export function etapeDeLaPage(etapes: readonly EtapeVisite[], index: number, adresse: string, colonnes = false): number {
  if (etapeSurLaPage(etapes[index], adresse, colonnes)) return index;
  const apres = etapes.findIndex((e, i) => i > index && etapeSurLaPage(e, adresse, colonnes));
  if (apres >= 0) return apres;
  for (let i = index - 1; i >= 0; i--) if (etapeSurLaPage(etapes[i], adresse, colonnes)) return i;
  return index;
}

/**
 * L'étape où la visite passe quand l'utilisateur choisit une entrée d'un menu de la barre du haut (Windows), si l'étape en cours demandait
 * d'ouvrir un menu : celle de la page qu'il ouvre, ou, si aucune étape ne la connaît (ou si c'est la page où il est déjà), l'étape d'après.
 * Rien (null) quand l'étape en cours ne demande pas de menu.
 */
export function etapeApresUnMenu(etapes: readonly EtapeVisite[], index: number, route: string, colonnes = false): number | null {
  if (!etapes[index]?.onglet) return null;
  const chemin = route.split('?')[0];
  const apres = etapes.findIndex((e, i) => i > index && etapeSurLaPage(e, chemin, colonnes));
  return apres >= 0 ? apres : Math.min(index + 1, etapes.length - 1);
}

/**
 * L'étape où « Suivant » ou « Passer cette étape » mène, et la page à ouvrir pour s'y rendre (rien si l'on y est déjà). Une étape qui n'a pas
 * d'adresse précise (la fiche d'un animal, dont on ignore laquelle) est passée quand on n'y est pas.
 */
export function etapeSuivante(
  etapes: readonly EtapeVisite[],
  index: number,
  adresse: string,
  colonnes = false,
): { index: number; ouvrir?: string } | null {
  let suivante = index + 1;
  while (suivante < etapes.length && etapes[suivante].route instanceof RegExp && !etapeSurLaPage(etapes[suivante], adresse, colonnes)) suivante++;
  if (suivante >= etapes.length) return null;
  const route = etapes[suivante].route;
  return {
    index: suivante,
    ouvrir: typeof route === 'string' && !etapeSurLaPage(etapes[suivante], adresse, colonnes) ? (etapes[suivante].ouvrir ?? route) : undefined,
  };
}

/**
 * L'étape où « Précédent » mène, et la page à ouvrir pour s'y rendre (rien si l'on y est déjà). Une étape qui n'a pas d'adresse précise (la
 * fiche d'un animal) est passée quand on n'y est pas. Rien (null) à la première étape.
 */
export function etapePrecedente(
  etapes: readonly EtapeVisite[],
  index: number,
  adresse: string,
  colonnes = false,
): { index: number; ouvrir?: string } | null {
  let precedente = index - 1;
  while (precedente >= 0 && etapes[precedente].route instanceof RegExp && !etapeSurLaPage(etapes[precedente], adresse, colonnes)) precedente--;
  if (precedente < 0) return null;
  const route = etapes[precedente].route;
  return {
    index: precedente,
    ouvrir: typeof route === 'string' && !etapeSurLaPage(etapes[precedente], adresse, colonnes) ? (etapes[precedente].ouvrir ?? route) : undefined,
  };
}

/**
 * La visite guidée, page après page : elle présente chaque page et invite à toucher les boutons de l'interface pour passer à la suivante.
 * Elle commence sur l'accueil, passe par le cheptel, la production, la comptabilité et l'organisation.
 */
export function etapesDeLaVisite(): EtapeVisite[] {
  /** Revenir au menu d'une rubrique, d'une page où l'on est (l'onglet du bas ; sur Windows, le menu du haut, ou rien : le menu reste à gauche). */
  const revenir = (id: string, depuis: EtapeVisite['route'], onglet: OngletDuBas, nom: string): EtapeVisite => ({
    id: id + '.retour',
    route: depuis,
    onglet,
    clic: true,
    etroit: true,
    titre: 'Revenir au menu ' + nom,
    texte: 'Touchez l’onglet ' + nom + ', en bas, pour revenir à son menu.',
    texteBureau: 'Ouvrez le menu ' + nom + ', dans la barre du haut de la fenêtre.',
  });
  /** Toucher une ligne du menu d'une rubrique (mise en surbrillance) : la page qu'elle ouvre prend la suite. */
  const toucher = (id: string, menu: string, ligne: string, titre: string, texte: string): EtapeVisite => ({
    id,
    route: menu,
    menu: true,
    ancre: 'rubrique:' + ligne,
    clic: true,
    titre,
    texte,
  });
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
      menu: true,
      titre: 'Le menu du Cheptel',
      texte: 'Le troupeau, la santé, l’identification et le dossier PAC, les statistiques : chaque ligne ouvre une page. Chacune dit en une phrase ce qu’on y trouve.',
    },
    {
      id: 'cheptel.animaux',
      route: ROUTES.CHEPTEL,
      menu: true,
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
      etroit: true,
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
      menu: true,
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
    revenir('cheptel.naissances', ROUTES.CHEPTEL_NAISSANCES, 'cheptel', 'Cheptel'),
    {
      id: 'cheptel.dossier',
      route: ROUTES.CHEPTEL,
      menu: true,
      ancre: `rubrique:${ROUTES.CHEPTEL_DOSSIER_PAC}`,
      clic: true,
      titre: 'Le dossier PAC',
      texte: 'Touchez « Dossier PAC » : tous les documents de la campagne.',
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
    // --- Le cheptel, suite : les lots, les traitements, les réglages et les aides, le bilan -----------------------------------
    revenir('cheptel.suite', ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION, 'cheptel', 'Cheptel'),
    toucher(
      'cheptel.lots',
      ROUTES.CHEPTEL,
      ROUTES.CHEPTEL_LOTS,
      'Les lots d’animaux',
      'Touchez « Lots d’animaux » : un lot regroupe des animaux pour les soigner, les suivre ou les compter ensemble.',
    ),
    {
      id: 'cheptel.lots.page',
      route: ROUTES.CHEPTEL_LOTS,
      ancre: 'fab',
      titre: 'Regrouper des animaux',
      texte: 'Un lot est un groupe d’animaux nommé, par leurs boucles. Certains se créent tout seuls : les jours d’abattage, les mises à la reproduction, les renouvellements, les avortements, les visites du vétérinaire. Le bouton + crée les vôtres. Un lot sert à traiter ou contrôler d’un geste les mêmes animaux, à suivre leur santé ensemble, et à retrouver ceux d’un jour d’abattage et sa facture.',
    },
    revenir('cheptel.lots', ROUTES.CHEPTEL_LOTS, 'cheptel', 'Cheptel'),
    toucher(
      'cheptel.traitements',
      ROUTES.CHEPTEL,
      ROUTES.CHEPTEL_TRAITEMENTS,
      'Les traitements',
      'Touchez « Traitements » : les médicaments donnés aux animaux et leurs délais d’attente.',
    ),
    {
      id: 'cheptel.traitements.page',
      route: ROUTES.CHEPTEL_TRAITEMENTS,
      ancre: 'fab',
      titre: 'Soigner et suivre les délais',
      texte: 'Chaque traitement dit quel médicament, à quels animaux (un animal, ou un lot entier) et pendant combien de temps. Il garde ses délais d’attente, pour le lait et pour la viande : un traitement en cours est rappelé sur l’accueil, dans « Santé du troupeau ». Le bouton + en ajoute un.',
    },
    revenir('cheptel.traitements', ROUTES.CHEPTEL_TRAITEMENTS, 'cheptel', 'Cheptel'),
    toucher(
      'cheptel.reglages',
      ROUTES.CHEPTEL,
      ROUTES.CHEPTEL_REGLAGES,
      'Les réglages et les aides',
      'Touchez « Réglages » : les coefficients UGB et les primes, qui servent au calcul prévisionnel des aides.',
    ),
    {
      id: 'cheptel.reglages.page',
      route: ROUTES.CHEPTEL_REGLAGES,
      titre: 'Les coefficients UGB et les primes',
      texte: 'Ici, les coefficients UGB par espèce (adultes et petits), puis pour chaque prime : si elle compte dans la prime prévisionnelle, son taux, ses plafonds et ce sur quoi elle s’applique (par UGB, par animal ou par hectare). Vous saisissez aussi l’effectif déclaré à la PAC de l’année. Ces réglages alimentent le calcul prévisionnel des aides.',
    },
    revenir('cheptel.reglages', ROUTES.CHEPTEL_REGLAGES, 'cheptel', 'Cheptel'),
    toucher(
      'cheptel.bilan',
      ROUTES.CHEPTEL,
      ROUTES.CHEPTEL_BILAN,
      'Le bilan annuel',
      'Touchez « Bilan annuel » : le résultat du calcul des aides.',
    ),
    {
      id: 'cheptel.bilan.page',
      route: ROUTES.CHEPTEL_BILAN,
      titre: 'Le bilan de l’année',
      texte: 'L’effectif, les mouvements de l’année, et le calcul prévisionnel : l’UGB prévisionnel et la prime prévisionnelle, d’après les coefficients et les taux des réglages. Changez un réglage, le bilan suit.',
    },
    // --- La production : fromages, viande, rappels de lots, qualité du lait ------------------------------------------------------
    {
      id: 'production.onglet',
      route: ROUTES.CHEPTEL_BILAN,
      onglet: 'production',
      clic: true,
      titre: 'La production',
      texte: 'Touchez l’onglet Production : c’est là qu’on fabrique, qu’on rappelle et qu’on facture.',
      texteBureau: 'Ouvrez le menu Production, dans la barre du haut de la fenêtre.',
    },
    {
      id: 'production.menu',
      route: ROUTES.PRODUCTION,
      menu: true,
      titre: 'Le menu de la Production',
      texte: 'Le produit (fromages, viande, boucherie / charcuterie), la qualité du lait et les rappels de lots. Tout est branché sur l’inventaire : les lots fabriqués et le stock sont ceux de l’inventaire, et chaque vente les fait baisser.',
    },
    toucher(
      'production.fromages',
      ROUTES.PRODUCTION,
      ROUTES.PRODUCTION_FROMAGES,
      'Les fromages',
      'Touchez « Fromages » : les fromages par lot, de la fabrication à la vente.',
    ),
    {
      id: 'production.fromages.page',
      route: ROUTES.PRODUCTION_FROMAGES,
      ancre: 'fab',
      titre: 'Fabriquer, facturer, rappeler',
      texte: 'Un fromage par type, avec ses lots et son stock. Le bouton + fabrique des fromages (des numéros de lot à la suite, qui entrent au stock de l’inventaire), les facture (la vente sort du stock, avec le lot) ou rappelle un lot dont le contrôle n’est pas ok.',
    },
    revenir('production.fromages', ROUTES.PRODUCTION_FROMAGES, 'production', 'Production'),
    toucher(
      'production.viande',
      ROUTES.PRODUCTION,
      ROUTES.PRODUCTION_VIANDE,
      'La viande',
      'Touchez « Viande » : les animaux à vendre, et ceux à facturer.',
    ),
    {
      id: 'production.viande.page',
      route: ROUTES.PRODUCTION_VIANDE,
      titre: 'Réserver et facturer la viande',
      texte: '« À facturer » : un jour d’abattage se facture d’un bloc, avec la facture de l’abattoir. « À vendre » : les animaux sans boucle, qu’on peut réserver pour un contact avant de les facturer ; « Facturée » et « Vendue » gardent l’historique. Les animaux sont ceux de l’inventaire : chaque vente les en sort.',
    },
    revenir('production.viande', ROUTES.PRODUCTION_VIANDE, 'production', 'Production'),
    toucher(
      'production.rappels',
      ROUTES.PRODUCTION,
      ROUTES.PRODUCTION_RAPPELS_LOTS,
      'Les rappels de lots',
      'Touchez « Rappels de lots » : les lots vendus qu’il faut rappeler.',
    ),
    {
      id: 'production.rappels.page',
      route: ROUTES.PRODUCTION_RAPPELS_LOTS,
      titre: 'Rappeler un lot',
      texte: 'Quand un contrôle n’est pas ok, le lot vendu est à rappeler : l’écran retrouve la vente, la facture et le contact à joindre (nom, téléphone, e-mail). Une fois le rappel fait, on le valide.',
    },
    revenir('production.rappels', ROUTES.PRODUCTION_RAPPELS_LOTS, 'production', 'Production'),
    toucher(
      'production.lait',
      ROUTES.PRODUCTION,
      ROUTES.santeControles('laitier'),
      'La qualité du lait',
      'Touchez « Qualité du lait » : les contrôles et les analyses du lait.',
    ),
    {
      id: 'production.lait.page',
      route: '/production/controles/liste',
      titre: 'Les contrôles du lait',
      texte: 'Les contrôles de la production et de la qualité du lait, et les analyses, avec leurs résultats.',
    },
    // --- Le commercial : tarifs, commandes, ventes, contacts ---------------------------------------------------------------------
    {
      id: 'commercial.onglet',
      route: '/production/controles/liste',
      onglet: 'commercial',
      clic: true,
      titre: 'Le commercial',
      texte: 'Touchez l’onglet Commercial, pour la vente.',
      texteBureau: 'Ouvrez le menu Commercial, dans la barre du haut de la fenêtre.',
    },
    {
      id: 'commercial.menu',
      route: ROUTES.COMMERCIAL,
      menu: true,
      titre: 'Le menu du Commercial',
      texte: 'Le chiffre d’affaires, la grille de tarifs, les commandes et livraisons, les circuits de vente (ferme, marché, restaurateurs…), et vos contacts. Les produits vendus sont ceux de l’inventaire.',
    },
    toucher(
      'commercial.tarifs',
      ROUTES.COMMERCIAL,
      ROUTES.COMMERCIAL_TARIFS,
      'La grille de tarifs',
      'Touchez « Grille de tarifs » : le prix selon la catégorie du contact.',
    ),
    {
      id: 'commercial.tarifs.page',
      route: ROUTES.COMMERCIAL_TARIFS,
      titre: 'Un prix par catégorie de contact',
      texte: 'Le prix d’un fromage ou d’une viande peut changer selon la catégorie du contact (particulier, professionnel…). Laissé vide, c’est le prix de l’inventaire qui s’applique. Ces prix servent aux commandes et aux ventes, avec la marge de chaque produit.',
    },
    revenir('commercial.tarifs', ROUTES.COMMERCIAL_TARIFS, 'commercial', 'Commercial'),
    toucher(
      'commercial.commandes',
      ROUTES.COMMERCIAL,
      ROUTES.COMMERCIAL_COMMANDES,
      'Les commandes',
      'Touchez « Commandes » : ce que les contacts ont commandé.',
    ),
    {
      id: 'commercial.commandes.page',
      route: ROUTES.COMMERCIAL_COMMANDES,
      ancre: 'fab',
      titre: 'Préparer et livrer',
      texte: 'Ce que les contacts ont commandé : à préparer, à livrer, livré. Le prix suit la grille de tarifs selon la catégorie du contact. L’accueil du Commercial rappelle les commandes à préparer.',
    },
    revenir('commercial.commandes', ROUTES.COMMERCIAL_COMMANDES, 'commercial', 'Commercial'),
    toucher(
      'commercial.ventes',
      ROUTES.COMMERCIAL,
      ROUTES.COMMERCIAL_VENTES,
      'Le chiffre d’affaires',
      'Touchez « Chiffre d’affaires » : ce que vous avez vendu.',
    ),
    {
      id: 'commercial.ventes.page',
      route: ROUTES.COMMERCIAL_VENTES,
      titre: 'Ce que rapporte la vente',
      texte: 'Le chiffre d’affaires par produit, par contact et par mois, les paiements en attente à encaisser et les contacts à relancer.',
    },
    revenir('commercial.ventes', ROUTES.COMMERCIAL_VENTES, 'commercial', 'Commercial'),
    toucher(
      'commercial.contacts',
      ROUTES.COMMERCIAL,
      ROUTES.CONTACTS,
      'Les contacts',
      'Touchez « Contacts » : vos clients, fournisseurs et organismes.',
    ),
    {
      id: 'commercial.contacts.page',
      route: ROUTES.CONTACTS,
      titre: 'Une fiche par contact',
      texte: 'Vos clients, fournisseurs et organismes (abattoir, vétérinaire, éleveur…), chacun avec sa fiche, rangé par catégorie. On les choisit dans les écritures. Leur catégorie décide de ce qu’ils peuvent acheter ou vendre : elle se règle dans Organisation, plus loin.',
    },
    {
      id: 'compta.onglet',
      route: ROUTES.CONTACTS,
      onglet: 'comptabilite',
      clic: true,
      titre: 'La comptabilité',
      texte: 'Touchez l’onglet Comptabilité, en bas.',
      texteBureau: 'Ouvrez le menu Comptabilité, dans la barre du haut de la fenêtre.',
    },
    {
      id: 'compta.menu',
      route: ROUTES.COMPTABILITE,
      menu: true,
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
    revenir('compta.ecritures', ROUTES.COMPTABILITE_LISTE, 'comptabilite', 'Comptabilité'),
    toucher(
      'compta.inventaire',
      ROUTES.COMPTABILITE,
      ROUTES.COMPTABILITE_INVENTAIRE,
      'L’inventaire',
      'Touchez « Inventaire » : ce qui est en stock, et d’où viennent les lots.',
    ),
    {
      id: 'compta.inventaire.page',
      route: ROUTES.COMPTABILITE_INVENTAIRE,
      titre: 'L’inventaire, le cœur de l’application',
      texte: 'Tout est rangé par catégorie (produits finis, produits animaux, matières premières…) en listes : fromages, lait, viande, animaux, aliments, boucles… Ce sont ces listes qui font les stocks, les lots de la Production et les produits du Commercial : une fabrication les augmente, une vente ou un abattage les diminue, un achat les remplit. Les catégories de contact s’en servent aussi.',
    },
    {
      id: 'organisation.onglet',
      route: ROUTES.COMPTABILITE_INVENTAIRE,
      onglet: 'organisation',
      clic: true,
      titre: 'L’organisation',
      texte: 'Touchez l’onglet Organisation, tout à droite.',
      texteBureau: 'Ouvrez le menu Organisation, dans la barre du haut de la fenêtre.',
    },
    toucher(
      'organisation.tiers',
      ROUTES.REGLAGES,
      ROUTES.ORGANISATION_TIERS,
      'Les contacts',
      'Touchez la ligne des contacts : leurs catégories et leur personnalisation.',
    ),
    {
      id: 'organisation.categories',
      route: ROUTES.ORGANISATION_TIERS,
      ancre: 'rubrique:' + ROUTES.ORGANISATION_CATEGORIES_TIERS,
      clic: true,
      titre: 'Les catégories de contact',
      texte: 'Touchez « Catégories de contact (dépenses) » : ce que chaque type de fournisseur peut vous vendre. Les catégories de clients (les recettes) sont à côté.',
    },
    {
      id: 'organisation.categories.page',
      route: ROUTES.ORGANISATION_CATEGORIES_TIERS,
      titre: 'Personnaliser les types de contact',
      texte: 'Chaque catégorie (abattoir, vétérinaire, éleveur, fournisseur d’aliments…) se renomme, se retire ou s’ajoute. Elle dit ce que ses contacts peuvent faire, liste de l’inventaire par liste : un achat (et, pour les animaux, la sortie vers l’abattoir) dans les dépenses ; les ventes sont dans les catégories de clients. La nouvelle écriture ne propose alors que ce qui convient au contact choisi.',
    },
    revenir('organisation.categories', ROUTES.ORGANISATION_CATEGORIES_TIERS, 'organisation', 'Organisation'),
    {
      id: 'organisation.menu',
      route: ROUTES.REGLAGES,
      menu: true,
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
