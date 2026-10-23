import { actionsDuLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BOUTONS_DE_LA_FERME, ENTREES_RETIREES_DES_MENUS, ROUTE_DIRECTE } from '@/features/accueil/ferme/routesFerme';
import { definitionDesMenus, menusParNom } from '@/bureau/MenuBureau';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

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
  const autres = (menu: DefinitionMenu, dejaMontrees: Set<string>): Entree[] => {
    const restes = (menu.items ?? []).filter(
      (e) => 'route' in e && !dejaMontrees.has(e.route) && !ENTREES_RETIREES_DES_MENUS.includes(e.route),
    );
    return restes.length > 0 ? [{ separateur: true }, ...restes] : [];
  };
  const B = BOUTONS_DE_LA_FERME;

  const gestionExploitation = entreesDe(B.exploitation.gestion);
  const intervenantsExploitation = entreesDe(B.exploitation.intervenants);
  const exploitationFerme = [...gestionExploitation, { separateur: true } as Entree, ...intervenantsExploitation];
  // Le menu du Cheptel (toutes les rubriques des animaux) vient après : l'accueil n'a qu'un bouton « Cheptel ».
  const exploitation: DefinitionMenu = {
    label: TEXTES.accueil.ferme.zones.enclos,
    items: [
      accueilDuCote(TEXTES.accueil.ferme.zones.enclos, 'exploitation'),
      { separateur: true },
      ...exploitationFerme,
      ...autres(cheptel, deja(exploitationFerme)),
    ],
  };

  const atelierFerme = [
    ...entreesDe(B.transformation.gestion),
    { separateur: true } as Entree,
    ...entreesDe(B.transformation.intervenants),
  ];
  const atelier: DefinitionMenu = {
    label: TEXTES.accueil.ferme.transformation.pastille,
    items: [
      accueilDuCote(TEXTES.accueil.ferme.transformation.pastille, 'transformation'),
      { separateur: true },
      ...atelierFerme,
      ...autres(production, deja(atelierFerme)),
    ],
  };

  const agritourismeFerme = [
    ...entreesDe(B.agritourisme.gestion),
    { separateur: true } as Entree,
    ...entreesDe(B.agritourisme.intervenants),
  ];
  const agritourisme: DefinitionMenu = {
    label: TEXTES.accueil.ferme.agritourisme.titre,
    items: [
      accueilDuCote(TEXTES.accueil.ferme.agritourisme.titre, 'agritourisme'),
      { separateur: true },
      ...agritourismeFerme,
      ...autres(commercial, deja(agritourismeFerme)),
    ],
  };

  // L'accueil garde ses entrées (les informations de l'exploitation, l'historique des rappels, les enregistrements) ; la comptabilité, les contacts et l'organisation, les leurs.
  return [accueil, exploitation, atelier, agritourisme, comptabilite, contacts, organisation];
}

/**
 * Les menus de l'application : le plan de la ferme (Accueil, Exploitation, Atelier, Agritourisme, Comptabilité, Contacts, Organisation) pour un élevage, les rubriques des onglets
 * pour une entreprise ou avec l'accueil classique. La fenêtre Windows, le menu « Menus » du mobile et l'arbre de gauche du poste de comptabilité les prennent ici.
 */
export const menusDeLApplication = (accueilClassique: boolean): DefinitionMenu[] =>
  !modeEntreprise() && !accueilClassique ? menusDeLaFerme() : definitionDesMenus();

/** Les noms des menus, de gauche à droite (sans « Affichage », que Windows ajoute en dernier). */
export const libellesDesMenus = (accueilClassique: boolean): string[] => menusDeLApplication(accueilClassique).map((m) => m.label);
