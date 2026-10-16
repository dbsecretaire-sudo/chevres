import type { Ionicons } from '@expo/vector-icons';
import { FAMILLE_CONTROLE, ONGLET_SANTE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

type Icone = keyof typeof Ionicons.glyphMap;

/** Une ligne d'un menu du Cheptel : un écran, avec son titre, une phrase qui dit ce qu'on y trouve, et son icône. */
export interface LigneRubrique {
  cle: string;
  titre: string;
  aide?: string;
  icone: Icone;
  route: string;
}

/** Un groupe de lignes qui vont ensemble. */
export interface GroupeRubrique {
  cle: string;
  titre: string;
  lignes: LigneRubrique[];
}

/**
 * Le menu du Cheptel, rangé par logique — le même sur téléphone (l'accueil du Cheptel) et sur Windows (la barre du haut et le menu de
 * gauche) :
 * - le troupeau : les animaux, leurs naissances, leurs sorties, leurs lots ;
 * - la santé : les traitements et les délais d'attente, les visites du vétérinaire ;
 * - l'identification et la PAC : les boucles, les contrôles, les terrains, le dossier PAC ;
 * - les statistiques : le bilan annuel, l'alimentation ;
 * - la technique : les réglages.
 * `avecDossierPac` : le dossier PAC ne concerne que les brebis et les chèvres.
 */
export function groupesCheptel(avecDossierPac: boolean): GroupeRubrique[] {
  const C = TEXTES.cheptel;
  const L = C.accueil.lignes;
  const F = TEXTES.exploitation.controles.familles;
  return [
    {
      cle: 'troupeau',
      titre: C.accueil.groupes.troupeau,
      lignes: [
        { cle: 'animaux', titre: L.animaux.titre, aide: L.animaux.aide, icone: 'paw', route: ROUTES.CHEPTEL_LISTE },
        { cle: 'naissances', titre: L.naissances.titre, aide: L.naissances.aide, icone: 'heart', route: ROUTES.CHEPTEL_NAISSANCES },
        { cle: 'sorties', titre: L.sorties.titre, aide: L.sorties.aide, icone: 'exit', route: ROUTES.CHEPTEL_HISTORIQUE },
        { cle: 'lots', titre: C.lots.titre, aide: C.lots.aide, icone: 'layers', route: ROUTES.CHEPTEL_LOTS },
      ],
    },
    {
      cle: 'sante',
      titre: C.accueil.groupes.sante,
      lignes: [
        { cle: 'traitements', titre: C.traitements.titre, aide: C.traitements.aide, icone: 'medkit', route: ROUTES.CHEPTEL_TRAITEMENTS },
        {
          cle: 'visites',
          titre: L.visites.titre,
          aide: L.visites.aide,
          icone: 'clipboard',
          route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, ONGLET_SANTE),
        },
      ],
    },
    {
      cle: 'identification',
      titre: C.accueil.groupes.identification,
      lignes: [
        {
          cle: 'boucles',
          titre: L.boucles.titre,
          aide: L.boucles.aide,
          icone: 'pricetag',
          route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES),
        },
        {
          cle: 'controles',
          titre: L.controles.titre,
          aide: L.controles.aide,
          icone: 'checkmark-circle',
          route: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.ANIMAUX),
        },
        { cle: 'terrains', titre: F.surface.titre, aide: F.surface.aide, icone: 'map', route: ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE) },
        ...(avecDossierPac
          ? [{ cle: 'dossierPac', titre: L.dossierPac.titre, aide: L.dossierPac.aide, icone: 'document-text' as Icone, route: ROUTES.CHEPTEL_DOSSIER_PAC }]
          : []),
      ],
    },
    {
      cle: 'statistiques',
      titre: C.accueil.groupes.statistiques,
      lignes: [
        { cle: 'tableauDeBord', titre: C.tableauDeBord.titre, aide: C.tableauDeBord.aide, icone: 'bar-chart', route: ROUTES.CHEPTEL_TABLEAU_DE_BORD },
        { cle: 'bilan', titre: TEXTES.commun.general.bilanAnnuel, aide: L.bilan.aide, icone: 'stats-chart', route: ROUTES.CHEPTEL_BILAN },
        { cle: 'alimentation', titre: TEXTES.commun.general.alimentation, aide: L.alimentation.aide, icone: 'nutrition', route: ROUTES.SANTE_ALIMENTATION },
      ],
    },
    {
      cle: 'technique',
      titre: C.accueil.groupes.technique,
      lignes: [
        { cle: 'reglages', titre: C.reglages.titre, aide: C.reglages.aide, icone: 'settings', route: ROUTES.CHEPTEL_REGLAGES },
      ],
    },
  ];
}
