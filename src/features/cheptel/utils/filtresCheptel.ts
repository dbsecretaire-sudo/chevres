import type { Chevre } from '@/features/cheptel/types';
import { categorieAnimal, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import {
  FILTRE_CATEGORIE_CHEPTEL,
  FILTRE_STATUT_CHEPTEL,
  SEXE,
  STATUT_CHEVRE,
  TRI_CHEPTEL,
} from '@/shared/constants/cheptel';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { formatDateFR, yearOf } from '@/shared/utils/dates';
import { vocabulaire } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';

export type StatutFiltre = ValeurDe<typeof FILTRE_STATUT_CHEPTEL>;
export type CategorieFiltre = ValeurDe<typeof FILTRE_CATEGORIE_CHEPTEL>;
export type Tri = ValeurDe<typeof TRI_CHEPTEL>;

/** Critères précis qui n'apparaissent que pour certains tris (plages de dates, années). */
export interface CriteresPrecis {
  dateAbattoirDebut: string;
  dateAbattoirFin: string;
  dateNaissanceDebut: string;
  dateNaissanceFin: string;
  anneeMorte: string;
  anneeRenouv: string;
  anneePresence: string;
}

export const CRITERES_PRECIS_VIDES: CriteresPrecis = {
  dateAbattoirDebut: '',
  dateAbattoirFin: '',
  dateNaissanceDebut: '',
  dateNaissanceFin: '',
  anneeMorte: '',
  anneeRenouv: '',
  anneePresence: '',
};

export interface CriteresCheptel extends CriteresPrecis {
  recherche: string;
  statutFiltre: StatutFiltre;
  categorieFiltre: CategorieFiltre;
  triActif: Tri;
}

// ---------------------------------------------------------------------------
// Listes d'options et libellés
// ---------------------------------------------------------------------------

export const OPTIONS_STATUT: { value: StatutFiltre; label: string }[] = [
  { value: FILTRE_STATUT_CHEPTEL.VIVANTE, label: TEXTES.cheptel.listeCheptel.vivantes },
  { value: FILTRE_STATUT_CHEPTEL.MORTE, label: TEXTES.commun.general.mortes },
  { value: FILTRE_STATUT_CHEPTEL.ABATTOIR, label: TEXTES.commun.general.abattoir },
  { value: FILTRE_STATUT_CHEPTEL.VENDUE, label: TEXTES.commun.general.vendues },
  { value: FILTRE_STATUT_CHEPTEL.AUTOCONSOMMEE, label: TEXTES.cheptel.listeCheptel.autoConsommees },
  { value: FILTRE_STATUT_CHEPTEL.MORT_NE, label: TEXTES.cheptel.listeCheptel.mortNees },
  { value: FILTRE_STATUT_CHEPTEL.SORTIES, label: TEXTES.cheptel.listeCheptel.toutesSorties },
  { value: FILTRE_STATUT_CHEPTEL.TOUT, label: TEXTES.cheptel.listeCheptel.toutes },
];

/** Qualificatif accolé à « Aucun animal » quand la liste est vide pour un statut donné. */
export const LABEL_STATUT_VIDE: Record<StatutFiltre, string> = {
  [FILTRE_STATUT_CHEPTEL.VIVANTE]: 'vivant',
  [FILTRE_STATUT_CHEPTEL.MORTE]: 'mort',
  [FILTRE_STATUT_CHEPTEL.ABATTOIR]: TEXTES.cheptel.listeCheptel.envoyeALAbattoir,
  [FILTRE_STATUT_CHEPTEL.VENDUE]: 'vendu',
  [FILTRE_STATUT_CHEPTEL.AUTOCONSOMMEE]: TEXTES.cheptel.listeCheptel.autoConsomme,
  [FILTRE_STATUT_CHEPTEL.MORT_NE]: TEXTES.cheptel.listeCheptel.mortNe,
  [FILTRE_STATUT_CHEPTEL.SORTIES]: 'sorti',
  [FILTRE_STATUT_CHEPTEL.TOUT]: '',
};

export const OPTIONS_CATEGORIE: { value: CategorieFiltre; label: string }[] = [
  // label en getter : lu au moment de l'affichage, après le choix de l'établissement (vocabulaire de l'espèce).
  {
    value: FILTRE_CATEGORIE_CHEPTEL.CHEVRE,
    get label() {
      return TEXTES.commun.general.chevres;
    },
  },
  {
    value: FILTRE_CATEGORIE_CHEPTEL.BOUC,
    get label() {
      return TEXTES.commun.general.boucs;
    },
  },
  {
    value: FILTRE_CATEGORIE_CHEPTEL.CABRIT,
    get label() {
      return TEXTES.commun.general.cabris;
    },
  },
  { value: FILTRE_CATEGORIE_CHEPTEL.SANS_BOUCLE, label: TEXTES.cheptel.listeCheptel.sansBoucle },
  { value: FILTRE_CATEGORIE_CHEPTEL.TOUT, label: TEXTES.cheptel.listeCheptel.tous },
];

export const LABEL_CATEGORIE_FILTRE: Record<CategorieFiltre, string> = {
  get [FILTRE_CATEGORIE_CHEPTEL.CHEVRE]() {
    return vocabulaire().femelle.singulier;
  },
  get [FILTRE_CATEGORIE_CHEPTEL.BOUC]() {
    return vocabulaire().male.singulier;
  },
  get [FILTRE_CATEGORIE_CHEPTEL.CABRIT]() {
    return vocabulaire().petit.singulier;
  },
  [FILTRE_CATEGORIE_CHEPTEL.SANS_BOUCLE]: TEXTES.cheptel.listeCheptel.animalSansBoucle,
  [FILTRE_CATEGORIE_CHEPTEL.TOUT]: 'animal',
};

export const OPTIONS_TRI: { value: Tri; label: string }[] = [
  { value: TRI_CHEPTEL.BOUCLE, label: TEXTES.cheptel.listeCheptel.aucunFiltre },
  { value: TRI_CHEPTEL.NAISSANCE, label: TEXTES.commun.general.dateDeNaissance },
  { value: TRI_CHEPTEL.MISE_BAS, label: TEXTES.cheptel.listeCheptel.derniereMiseBas },
  { value: TRI_CHEPTEL.ABATTOIR, label: TEXTES.commun.general.abattoir },
  { value: TRI_CHEPTEL.MORTE, label: TEXTES.cheptel.listeCheptel.morte },
  { value: TRI_CHEPTEL.ANNEE, label: TEXTES.cheptel.listeCheptel.anneePresentSurLExploitation },
  { value: TRI_CHEPTEL.RENOUVELLEMENT, label: TEXTES.commun.general.renouvellement },
];

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------

/** Un animal correspond à cette catégorie de filtre (âge/sexe, ou absence de boucle). */
export function matchCategorie(c: Chevre, filtre: CategorieFiltre): boolean {
  if (filtre === FILTRE_CATEGORIE_CHEPTEL.TOUT) return true;
  if (filtre === FILTRE_CATEGORIE_CHEPTEL.SANS_BOUCLE) return !c.numeroBoucle;
  return categorieAnimal(c) === filtre;
}

/** « Toutes sorties » couvre tous les statuts de sortie ; les autres valeurs correspondent chacune à un statut précis. */
export function matchStatut(c: Chevre, filtre: StatutFiltre): boolean {
  if (filtre === FILTRE_STATUT_CHEPTEL.TOUT) return true;
  if (filtre === FILTRE_STATUT_CHEPTEL.SORTIES) return c.statut !== STATUT_CHEVRE.VIVANTE;
  return c.statut === filtre;
}

/**
 * Présent sur l'exploitation durant cette année : né avant ou pendant, et encore vivant à cette
 * date ou sorti pendant/après (ex : né en 2022, mort en août 2024 → présent en 2022, 2023 et 2024).
 */
function chevrePresenteAnnee(c: Chevre, annee: number): boolean {
  if (yearOf(c.dateNaissance) > annee) return false;
  if (c.statut === STATUT_CHEVRE.VIVANTE) return true;
  if (!c.dateStatut) return true;
  return yearOf(c.dateStatut) >= annee;
}

/** Recherche large : toutes les infos affichables de la fiche, pas seulement boucle/nom. */
function chevreCorrespond(c: Chevre, q: string): boolean {
  if (!q) return true;
  const champs: (string | undefined)[] = [
    c.numeroBoucle,
    c.nom,
    c.mereNumeroBoucle,
    c.notes,
    c.sexe === SEXE.FEMELLE ? 'femelle' : TEXTES.cheptel.listeCheptel.male,
    statutLabel(c.statut, c.sexe),
    c.dateNaissance,
    formatDateFR(c.dateNaissance),
    c.dateStatut,
    formatDateFR(c.dateStatut),
    c.dateBouclage,
    formatDateFR(c.dateBouclage),
    c.renouvellement
      ? TEXTES.cheptel.listeCheptel.renouvellementValeur(c.renouvellementAnnee ?? '')
      : undefined,
  ];
  return champs.some((v) => (v ?? '').toLowerCase().includes(q));
}

/** Plage Du/Au, et filtres précis du tri actif (ignorés pour les tris qui n'en ont pas). */
function respecteCriteresPrecis(c: Chevre, k: CriteresCheptel): boolean {
  switch (k.triActif) {
    case TRI_CHEPTEL.ABATTOIR:
      if (c.statut !== STATUT_CHEVRE.ABATTOIR) return false;
      if (!k.dateAbattoirDebut && !k.dateAbattoirFin) return true;
      if (!c.dateStatut) return false;
      if (k.dateAbattoirDebut && c.dateStatut < k.dateAbattoirDebut) return false;
      if (k.dateAbattoirFin && c.dateStatut > k.dateAbattoirFin) return false;
      return true;
    case TRI_CHEPTEL.MORTE:
      if (c.statut !== STATUT_CHEVRE.MORTE) return false;
      if (!k.anneeMorte.trim()) return true;
      return !!c.dateStatut && yearOf(c.dateStatut) === Number(k.anneeMorte);
    case TRI_CHEPTEL.RENOUVELLEMENT:
      if (!k.anneeRenouv.trim()) return true;
      return !!c.renouvellement && c.renouvellementAnnee === Number(k.anneeRenouv);
    case TRI_CHEPTEL.ANNEE:
      if (!k.anneePresence.trim()) return true;
      return chevrePresenteAnnee(c, Number(k.anneePresence));
    case TRI_CHEPTEL.NAISSANCE:
      if (!k.dateNaissanceDebut && !k.dateNaissanceFin) return true;
      if (k.dateNaissanceDebut && c.dateNaissance < k.dateNaissanceDebut) return false;
      if (k.dateNaissanceFin && c.dateNaissance > k.dateNaissanceFin) return false;
      return true;
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Tri
// ---------------------------------------------------------------------------

function compareBoucle(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b);
}

/** Compare deux clés facultatives (date, année…) : absentes reléguées en fin de liste, égalité = 0 (départagée ensuite par la boucle). */
function compareOptionnel<K>(ak: K | undefined, bk: K | undefined, cmp: (a: K, b: K) => number): number {
  if (ak === undefined && bk === undefined) return 0;
  if (ak === undefined) return 1;
  if (bk === undefined) return -1;
  return cmp(ak, bk);
}

const compareTexte = (x: string, y: string) => x.localeCompare(y);

function comparer(a: Chevre, b: Chevre, triActif: Tri, misesBas: Record<string, string>): number {
  switch (triActif) {
    case TRI_CHEPTEL.NAISSANCE:
      return a.dateNaissance.localeCompare(b.dateNaissance);
    case TRI_CHEPTEL.MISE_BAS:
      return compareOptionnel(
        a.numeroBoucle ? misesBas[a.numeroBoucle] : undefined,
        b.numeroBoucle ? misesBas[b.numeroBoucle] : undefined,
        compareTexte,
      );
    case TRI_CHEPTEL.ABATTOIR:
      return compareOptionnel(
        a.statut === STATUT_CHEVRE.ABATTOIR ? a.dateStatut : undefined,
        b.statut === STATUT_CHEVRE.ABATTOIR ? b.dateStatut : undefined,
        compareTexte,
      );
    case TRI_CHEPTEL.MORTE:
      return compareOptionnel(
        a.statut === STATUT_CHEVRE.MORTE ? a.dateStatut : undefined,
        b.statut === STATUT_CHEVRE.MORTE ? b.dateStatut : undefined,
        compareTexte,
      );
    case TRI_CHEPTEL.RENOUVELLEMENT:
      return compareOptionnel(
        a.renouvellement ? a.renouvellementAnnee : undefined,
        b.renouvellement ? b.renouvellementAnnee : undefined,
        (x, y) => x - y,
      );
    default:
      return 0;
  }
}

/**
 * Applique statut, catégorie, recherche et critères précis, puis trie. Chaque tri applique son propre
 * critère et départage toujours par n° de boucle croissant.
 */
export function filtrerEtTrierCheptel(
  chevres: Chevre[],
  criteres: CriteresCheptel,
  misesBas: Record<string, string>,
): Chevre[] {
  const q = criteres.recherche.trim().toLowerCase();
  // Le filtre Statut est ignoré pour Année (couvre vivant ET sorti), Morte et Abattoir : le tri impose
  // déjà un statut précis, et le filtre par défaut sur « Vivantes » les viderait sinon.
  const ignorerStatut = [TRI_CHEPTEL.ANNEE, TRI_CHEPTEL.MORTE, TRI_CHEPTEL.ABATTOIR].some(
    (t) => t === criteres.triActif,
  );

  return chevres
    .filter((c) => ignorerStatut || matchStatut(c, criteres.statutFiltre))
    .filter((c) => matchCategorie(c, criteres.categorieFiltre))
    .filter((c) => chevreCorrespond(c, q))
    .filter((c) => respecteCriteresPrecis(c, criteres))
    .sort(
      (a, b) => comparer(a, b, criteres.triActif, misesBas) || compareBoucle(a.numeroBoucle, b.numeroBoucle),
    );
}
