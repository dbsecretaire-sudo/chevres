import { actionsDuLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BOUTONS_DE_LA_FERME, ENTREES_RETIREES_DES_MENUS, ROUTE_DIRECTE } from '@/features/accueil/ferme/routesFerme';
import { definitionDesMenus, menusParNom } from '@/bureau/MenuBureau';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { COMPTES_VIDES, tuilesDuTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { groupesCheptel } from '@/features/cheptel/services/rubriquesCheptel';
import { especeDuSuivi } from '@/features/export/documents/suiviMouvementsPdf';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { RUBRIQUES, RUBRIQUES_DU_PLUS, TUILES_VISITES } from '@/features/accueil/rubriques/rubriquesDuPlus';

/** Une entrée d'un menu : un écran (libellé et route), ou un trait entre deux groupes. */
type Entree = NonNullable<DefinitionMenu['items']>[number];


/** Les entrées d'un bouton de l'accueil : sa page, ou celles de ses bulles (la grange : l'alimentation et le stock ; les lots ; fabriquer un fromage, un plat…). */
function entreesDuBouton(cle: string, libelle: string): Entree[] {
  if (ROUTE_DIRECTE[cle]) return [{ label: libelle, route: ROUTE_DIRECTE[cle] }];
  return actionsDuLieu(cle as CibleDesBulles).map((a) => ({
    label: cle === 'fabriquer' ? `${libelle} · ${a.titre.replace(/^Fabriquer /i, '')}` : cle === 'grange' ? `${libelle} · ${a.titre}` : a.titre,
    route: a.route,
  }));
}

const entreesDe = (boutons: readonly (readonly [string, string])[]): Entree[] =>
  boutons.flatMap(([cle, libelle]) => entreesDuBouton(cle, libelle));

/** L'accueil ouvert sur un côté (l'exploitation, l'atelier, l'agritourisme). */
const accueilDuCote = (libelle: string, cote: string): Entree => ({ label: libelle, route: ROUTES.retourAccueil(cote) });

/**
 * Les menus du haut du téléphone (et du mobile pour PC) d'un élevage : ceux de l'accueil « ferme » — l'Accueil, l'Exploitation, l'Atelier, l'Agritourisme —, puis la
 * Comptabilité, les Contacts et l'Organisation. Chaque côté reprend d'abord ses boutons (la gestion, puis les intervenants), puis, après un trait, les écrans qui
 * n'ont pas de bouton sur l'accueil (l'ancien menu Cheptel, Production, Commercial), pour que rien ne devienne inaccessible.
 */
export function menusDeLaFerme(): DefinitionMenu[] {
  const { accueil, cheptel, production, commercial, comptabilite, contacts, organisation } = menusParNom();
  const deja = (entrees: Entree[]) => new Set(entrees.flatMap((e) => ('route' in e ? [e.route] : [])));
  /** Les entrées d'un ancien menu que la ferme ne montre pas déjà (un même écran ne se répète pas). */
  /** Un trait qui porte le nom de la partie qui suit (« Gestion », « Intervenants »…) : les menus longs se lisent par parties. */
  const partie = (titre: string): Entree => ({ separateur: true, titre });
  const autres = (menu: DefinitionMenu, dejaMontrees: Set<string>, titre: string): Entree[] => {
    const restes = (menu.items ?? []).filter(
      (e) => 'route' in e && !dejaMontrees.has(e.route) && !ENTREES_RETIREES_DES_MENUS.includes(e.route),
    );
    return restes.length > 0 ? [partie(titre), ...restes] : [];
  };
  const B = BOUTONS_DE_LA_FERME;

  const gestionExploitation = entreesDe(B.exploitation.gestion);
  const intervenantsExploitation = entreesDe(B.exploitation.intervenants);
  const exploitationFerme = [partie(TEXTES.accueil.ferme.gestion), ...gestionExploitation, partie(TEXTES.accueil.ferme.intervenants), ...intervenantsExploitation];
  // Le menu du Cheptel (toutes les rubriques des animaux) vient après : l'accueil n'a qu'un bouton « Cheptel ».
  const exploitation: DefinitionMenu = {
    label: TEXTES.accueil.ferme.zones.enclos,
    items: [
      accueilDuCote(TEXTES.accueil.ferme.zones.enclos, 'exploitation'),
      ...exploitationFerme,
      ...autres(cheptel, deja(exploitationFerme), TEXTES.accueil.ferme.menus.suiviDuCheptel),
    ],
  };

  const atelierFerme = [
    partie(TEXTES.accueil.ferme.gestion),
    ...entreesDe(B.transformation.gestion),
    partie(TEXTES.accueil.ferme.intervenants),
    ...entreesDe(B.transformation.intervenants),
  ];
  const atelier: DefinitionMenu = {
    label: TEXTES.accueil.ferme.transformation.pastille,
    items: [
      accueilDuCote(TEXTES.accueil.ferme.transformation.pastille, 'transformation'),
      ...atelierFerme,
      ...autres(production, deja(atelierFerme), TEXTES.accueil.ferme.menus.autresPages),
    ],
  };

  const agritourismeFerme = [
    partie(TEXTES.accueil.ferme.gestion),
    ...entreesDe(B.agritourisme.gestion),
    partie(TEXTES.accueil.ferme.intervenants),
    ...entreesDe(B.agritourisme.intervenants),
  ];
  const agritourisme: DefinitionMenu = {
    label: TEXTES.accueil.ferme.agritourisme.titre,
    items: [
      accueilDuCote(TEXTES.accueil.ferme.agritourisme.titre, 'agritourisme'),
      ...agritourismeFerme,
      ...autres(commercial, deja(agritourismeFerme), TEXTES.accueil.ferme.menus.autresPages),
    ],
  };

  // L'accueil garde ses entrées (les informations de l'exploitation, l'historique des rappels, les enregistrements) ; la comptabilité, les contacts et l'organisation, les leurs.
  return [accueil, exploitation, atelier, agritourisme, comptabilite, contacts, organisation];
}

const separateur = (titre: string): Entree => ({ separateur: true, titre });

const routesDeMenus = (menus: DefinitionMenu[]): Set<string> =>
  new Set(menus.flatMap((m) => [...(m.route ? [m.route] : []), ...(m.items ?? []).flatMap((e) => ('route' in e ? [e.route] : []))]));

/**
 * Les quatre rubriques de la fenêtre Windows, comme sur le téléphone : Chèvres, Atelier, Visites, Plus. Chacune reprend ses tuiles, puis son détail (le menu du
 * cheptel, les fabrications, les listes du Plus). Les pages de l'ancienne organisation qu'aucune rubrique ne reprend restent dans Plus, rangées par thème :
 * rien ne disparaît.
 */
export function menusDeLaFenetre(): DefinitionMenu[] {
  const tuiles = (cle: 'troupeau' | 'atelier' | 'fabriquer') => tuilesDuTerrain(cle, COMPTES_VIDES).map((t) => ({ label: t.titre, route: t.route }));
  const chevres: DefinitionMenu = {
    label: 'Chèvres',
    items: [
      { label: 'Accueil des chèvres', route: ROUTES.CHEPTEL },
      ...tuiles('troupeau'),
      separateur('Suivi'),
      ...groupesCheptel(especeDuSuivi(especeCourante())).flatMap((groupe) => [
        separateur(groupe.titre),
        ...groupe.lignes.map((l) => ({ label: l.titre, route: l.route })),
      ]),
    ],
  };
  const atelier: DefinitionMenu = {
    label: 'Atelier',
    items: [{ label: 'Accueil de l’atelier', route: ROUTES.PRODUCTION }, ...tuiles('atelier'), separateur('Fabriquer'), ...tuiles('fabriquer')],
  };
  const visites: DefinitionMenu = {
    label: 'Visites',
    items: TUILES_VISITES.map((t) => ({ label: t.libelle, route: t.route })),
  };
  const plusRubriques: DefinitionMenu = {
    label: 'Plus',
    items: [
      { label: 'Accueil de la ferme', route: '/' },
      ...RUBRIQUES_DU_PLUS.flatMap((r) => [
        separateur(r.libelle),
        ...RUBRIQUES[r.cle].sections.flatMap((s) => [separateur(s.titre), ...s.lignes.map((l) => ({ label: l.libelle, route: l.route }))]),
      ]),
    ],
  };
  // Les pages que les quatre rubriques ne reprennent pas encore : elles restent dans Plus, par thème de l'ancienne organisation.
  const montrees = routesDeMenus([chevres, atelier, visites, plusRubriques]);
  const restantes = menusDuPoste().flatMap((theme) => {
    const pages = (theme.items ?? []).filter((e): e is { label: string; route: string } => 'route' in e && !montrees.has(e.route));
    return pages.length > 0 ? [separateur(theme.label), ...pages] : [];
  });
  return [chevres, atelier, visites, { ...plusRubriques, items: [...(plusRubriques.items ?? []), ...restantes] }];
}

/**
 * Les menus de l'application : la fenêtre Windows prend les quatre rubriques (Chèvres, Atelier, Visites, Plus), avec l'accueil classique ce sont les menus
 * d'avant, et le poste de comptabilité (affichage sobre et large) garde ses huit thèmes dans l'arbre de gauche.
 */
export const menusDeLApplication = (accueilClassique: boolean, comptable = false): DefinitionMenu[] =>
  accueilClassique ? definitionDesMenus() : comptable ? menusDuPoste() : menusDeLaFenetre();

/** Les noms des menus, de gauche à droite (sans « Affichage », que Windows ajoute en dernier). */
export const libellesDesMenus = (accueilClassique: boolean): string[] => menusDeLApplication(accueilClassique).map((m) => m.label);

/** Une entrée du plan du poste de comptabilité : une route (son libellé est celui du menu de la ferme), une route avec son libellé, ou le titre d'une partie. */
type EntreeDuPoste = string | readonly [route: string, libelle: string] | { partie: string; alphabetique?: boolean };

/**
 * Les menus du poste de comptabilité (Windows, affichage sobre) : huit thèmes qui ne se mélangent pas — Accueil, Cheptel, Stock, Production, Commercial, Comptabilité, Contacts, Données.
 * Chaque thème garde ses propres pages, intervenants compris (l'abattoir est dans le Cheptel, la banque dans la Comptabilité) ; l'agritourisme est dans le Commercial.
 * Les pages et leurs libellés sont ceux des menus de la ferme : rien n'est inventé, et un test vérifie qu'aucune page n'est perdue.
 */
const THEMES_DU_POSTE: readonly { label: string; route?: string; entrees?: EntreeDuPoste[] }[] = [
  { label: 'Accueil', entrees: ['/', '/informations-exploitation', '/rappels-historique'] },
  {
    label: 'Cheptel',
    entrees: [
      ['/?accueil=retour&interieur=exploitation', 'Plan de l’exploitation'],
      { partie: 'Animaux' },
      '/production/lieu?lieu=animaux',
      '/cheptel/naissances',
      '/cheptel/historique',
      '/cheptel/lots',
      '/cheptel/traitements',
      ['/cheptel/a-completer', 'À compléter'],
      '/production/lieu?lieu=boucles',
      '/sante/controles/liste?famille=animaux&onglet=animaux',
      { partie: 'Suivi' },
      '/cheptel/tableau-de-bord',
      '/cheptel/bilan',
      ['/sante/alimentation', 'Alimentation · Statistiques'],
      '/sante/controles/liste?famille=surface',
      '/cheptel/dossier-pac',
      '/production/lieu?lieu=documents',
      '/production/ventes-vivants',
      '/cheptel/reglages',
    ],
  },
  {
    label: 'Stock',
    entrees: [
      '/comptabilite/stocks',
      '/comptabilite/conditionnement',
      '/comptabilite/stock-structure',
      '/comptabilite/stock-historique',
      '/comptabilite/stock-statistiques',
    ],
  },
  {
    label: 'Production',
    entrees: [
      ['/?accueil=retour&interieur=transformation', 'Production'],
      { partie: 'Fabrication' },
      '/production/fabrication?produit=fromage',
      '/production/fabrication?produit=charcuterie',
      '/production/fabrication?produit=plat',
      '/production/fabrication?produit=savon',
      '/production/lots',
      '/production/rappels-lots',
      '/production/recettes',
      '/production/registre-analyses',
      ['/comptabilite/stocks?vue=atelier', 'Stock de l’atelier'],
      { partie: 'Réglementation' },
      '/production/cadre-reglementaire',
      { partie: 'Suivi' },
      '/comptabilite/rentabilite?perimetre=atelier',
    ],
  },
  {
    label: 'Commercial',
    entrees: [
      { partie: 'Ventes' },
      '/commercial/commande',
      ['/commercial/ventes?perimetre=atelier', 'Ventes de l’atelier'],
      ['/commercial/ventes?perimetre=agritourisme', 'Ventes de l’agritourisme'],
      { partie: 'Agritourisme' },
      '/?accueil=retour&interieur=agritourisme',
      '/commercial/visite',
      '/commercial/agritourisme',
      '/commercial/formules',
      '/commercial/tarifs',
      '/commercial/accueil-public',
      { partie: 'Suivi' },
      '/comptabilite/rentabilite?perimetre=agritourisme',
    ],
  },
  {
    label: 'Comptabilité',
    entrees: [
      '/comptabilite/liste',
      '/comptabilite/inventaire',
      '/comptabilite/tresorerie',
      '/comptabilite/rentabilite',
      '/comptabilite/tva',
      '/comptabilite/fiscalite',
      { partie: 'Plan comptable' },
      '/comptabilite/comptes-pcg',
      '/comptabilite/plan-comptable',
      '/comptabilite/reglages',
    ],
  },
  {
    label: 'Contacts',
    entrees: [
      '/comptabilite/contacts',
      '/organisation-categories-client',
      '/organisation-categories-tiers',
      { partie: 'Intervenants', alphabetique: true },
      '/production/lieu?lieu=abattoir',
      '/production/lieu?lieu=equarrissage',
      '/production/lieu?lieu=groupementSanitaire',
      '/production/lieu?lieu=groupement',
      '/production/lieu?lieu=organismes',
      '/production/laiterie',
      '/production/lieu?lieu=emballages',
      '/production/lieu?lieu=analyses',
      '/production/lieu?lieu=particuliers',
      '/production/lieu?lieu=entreprises',
      '/production/lieu?lieu=visiteurs',
      '/production/lieu?lieu=groupesVisiteurs',
      '/production/lieu?lieu=repas',
      '/production/lieu?lieu=tourisme',
      '/production/lieu?lieu=garage',
      '/production/lieu?lieu=assurance',
      '/production/lieu?lieu=banque',
    ],
  },
  {
    label: 'Données',
    entrees: [
      { partie: 'Établissement' },
      '/organisation-etablissement',
      '/organisation-listes',
      '/organisation-regles',
      { partie: 'Sauvegardes et exports' },
      '/organisation-donnees',
      '/export-donnees',
      '/pdf-donnees',
      '/sauvegarde-locale',
      '/google-drive',
    ],
  },
];

/** Les parties qui le demandent (« Intervenants ») ont leurs pages classées par ordre alphabétique de libellé ; les autres gardent l'ordre du plan. */
function enAlphabetique(plan: readonly EntreeDuPoste[], entrees: Entree[]): Entree[] {
  const resultat: Entree[] = [];
  let alphabetique = false;
  let groupe: Entree[] = [];
  const vider = () => {
    resultat.push(...(alphabetique ? [...groupe].sort((a, b) => ('label' in a && 'label' in b ? a.label.localeCompare(b.label, 'fr') : 0)) : groupe));
    groupe = [];
  };
  for (const entree of entrees) {
    if ('separateur' in entree) {
      vider();
      resultat.push(entree);
      alphabetique = plan.some((e) => typeof e === 'object' && 'partie' in e && e.partie === entree.titre && e.alphabetique);
    } else groupe.push(entree);
  }
  vider();
  return resultat;
}

/** Les menus du poste de comptabilité : les huit thèmes, avec les pages et les libellés de ceux de la ferme. */
export function menusDuPoste(): DefinitionMenu[] {
  // Le libellé de chaque page, d'après les menus de la ferme (le premier trouvé pour une route).
  const libelles = new Map<string, string>();
  for (const menu of menusDeLaFerme()) {
    if (menu.route && !libelles.has(menu.route)) libelles.set(menu.route, menu.label);
    for (const e of menu.items ?? []) if ('route' in e && !libelles.has(e.route)) libelles.set(e.route, e.label);
  }
  return THEMES_DU_POSTE.map((theme) => ({
    label: theme.label,
    ...(theme.route ? { route: theme.route } : {}),
    ...(theme.entrees
      ? {
          items: enAlphabetique(
            theme.entrees,
            theme.entrees.flatMap((e): Entree[] => {
              if (typeof e === 'string') return libelles.has(e) ? [{ label: libelles.get(e) as string, route: e }] : [];
              if ('partie' in e) return [{ separateur: true, titre: e.partie }];
              return libelles.has(e[0]) ? [{ label: e[1], route: e[0] }] : [];
            }),
          ),
        }
      : {}),
  }));
}
