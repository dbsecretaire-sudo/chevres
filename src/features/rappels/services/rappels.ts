import {
  GENRE_RAPPEL,
  JOURS_ECHEANCE_GROUPEMENT,
  MOIS_PAR_TRIMESTRE,
  PERIODES_RAPPELEES,
} from '@/shared/constants/rappels';
import { ROUTES } from '@/shared/constants/routes';
import { libelleDeRappelCirculation, periodeDeRappelCirculation } from '@/features/rappels/services/rappelsCirculation';
import { ajouterJours } from '@/shared/utils/calendrier';
import { MOIS_PAR_AN } from '@/shared/constants/temps';
import { TEXTES } from '@/shared/textes';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Les rappels qui ne sont pas des déclarations : une échéance de groupement, un document de circulation, une analyse de plat ou de savon, un dossier de savon. */
export type GenreRappelDeLot =
  | typeof GENRE_RAPPEL.GROUPEMENT
  | typeof GENRE_RAPPEL.CIRCULATION
  | typeof GENRE_RAPPEL.ANALYSE_PLAT
  | typeof GENRE_RAPPEL.DOSSIER_SAVON
  | typeof GENRE_RAPPEL.STOCK_A_PREVOIR
  | typeof GENRE_RAPPEL.ACCUEIL_PUBLIC;

/** Les déclarations qu'on peut activer ou non (RSA) ; une échéance de groupement s'y ajoute dans les rappels (voir Rappel.genre). */
export type GenreRappel = Exclude<
  ValeurDe<typeof GENRE_RAPPEL>,
  GenreRappelDeLot
>;

/** Une déclaration à faire (ou à valider) pour une période terminée. */
export interface Rappel {
  /** Identifiant de la période (« rsa:2026-T3 »), enregistré quand le rappel est validé. */
  id: string;
  genre: GenreRappel | GenreRappelDeLot;
  /** « Déclaration RSA · 3e trimestre 2026 ». */
  libelle: string;
  /** Le dernier jour pour la faire : la fin du mois qui suit la période (AAAA-MM-JJ). */
  echeance: string;
  enRetard: boolean;
  /** Ce qui remplace la ligne « À faire avant le… » (un envoi de document de circulation n'a pas d'échéance : la date est celle de l'écriture). */
  detail?: string;
  /** Pour l'échéance d'un groupement : l'écran du contenu, et de quoi le passer à « terminé ». */
  cible?: string;
  groupementId?: string;
  contenuId?: string;
  /** Pour l'analyse d'un plat préparé : la fabrication dont l'échantillon part (voir enregistrerAnalyseDePlats). */
  fabricationId?: string;
}

/** « Déclaration RSA · 3e trimestre 2026 » d'après l'identifiant d'un rappel ; rien si l'identifiant est inconnu. */
export function libelleDeRappel(id: string): string | null {
  const T = TEXTES.rappels;
  const envoi = libelleDeRappelCirculation(id);
  if (envoi) return envoi;
  const [genre, periode = ''] = id.split(':');
  const trimestre = /^(\d{4})-T([1-4])$/.exec(periode);
  if (genre === GENRE_RAPPEL.RSA && trimestre) {
    return T.ligne(T.genre.rsa, T.trimestre(Number(trimestre[2]), Number(trimestre[1])));
  }
  return null;
}

/** Le dernier mois de la période d'un rappel (AAAAMM) : pour ranger l'historique du plus récent au plus ancien. */
export function periodeDeRappel(id: string): number {
  const envoi = periodeDeRappelCirculation(id);
  if (envoi) return envoi;
  const periode = id.split(':')[1] ?? '';
  const trimestre = /^(\d{4})-T([1-4])$/.exec(periode);
  if (trimestre) return Number(trimestre[1]) * 100 + Number(trimestre[2]) * MOIS_PAR_TRIMESTRE;
  const mois = /^(\d{4})-(\d{2})$/.exec(periode);
  return mois ? Number(mois[1]) * 100 + Number(mois[2]) : 0;
}

/** Ce qui détermine les rappels d'un établissement : son type, et ce que l'utilisateur a désactivé ou validé. */
export interface ContexteRappels {
  desactives?: readonly string[];
  valides?: readonly string[];
}

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

/** Le dernier jour du mois `mois` (1 à 12) de l'année `annee`, au format AAAA-MM-JJ. */
export function finDuMois(annee: number, mois: number): string {
  const dernier = new Date(annee, mois, 0).getDate();
  return `${annee}-${deuxChiffres(mois)}-${deuxChiffres(dernier)}`;
}

/** Le mois qui suit (le mois 12 est suivi du mois 1 de l'année suivante). */
const moisSuivant = (annee: number, mois: number) =>
  mois === MOIS_PAR_AN ? { annee: annee + 1, mois: 1 } : { annee, mois: mois + 1 };

/** Les genres de rappel de déclaration : le RSA agricole, chaque trimestre. */
export const genresApplicables = (): GenreRappel[] => [GENRE_RAPPEL.RSA];

/**
 * Les déclarations à valider à la date donnée : pour chaque genre actif, les dernières périodes terminées (le trimestre pour le
 * RSA) que l'utilisateur n'a pas validées. À faire avant la fin du mois qui suit la période.
 */
export function rappelsDus(aujourdhui: string, ctx: ContexteRappels): Rappel[] {
  const annee = Number(aujourdhui.slice(0, 4));
  const mois = Number(aujourdhui.slice(5, 7));
  const actifs = genresApplicables().filter((g) => !ctx.desactives?.includes(g));
  const rappels: Rappel[] = [];

  for (let k = 1; k <= PERIODES_RAPPELEES; k++) {
    if (actifs.includes(GENRE_RAPPEL.RSA)) {
      // Le trimestre en cours (0 à 3), puis ceux qui l'ont précédé.
      const rang = Math.floor((mois - 1) / MOIS_PAR_TRIMESTRE) - k;
      const a = rang < 0 ? annee - 1 : annee;
      const t = ((rang % 4) + 4) % 4;
      const finTrimestre = (t + 1) * MOIS_PAR_TRIMESTRE;
      const suivant = moisSuivant(a, finTrimestre);
      rappels.push({
        id: `${GENRE_RAPPEL.RSA}:${a}-T${t + 1}`,
        genre: GENRE_RAPPEL.RSA,
        libelle: libelleDeRappel(`${GENRE_RAPPEL.RSA}:${a}-T${t + 1}`) ?? '',
        echeance: finDuMois(suivant.annee, suivant.mois),
        enRetard: false,
      });
    }
  }
  return rappels
    .filter((r) => !ctx.valides?.includes(r.id))
    .map((r) => ({ ...r, enRetard: r.echeance < aujourdhui }))
    .sort((a, b) => a.echeance.localeCompare(b.echeance));
}

/**
 * Les échéances des contenus des groupements à rappeler : celles qui sont dépassées ou qui tombent dans le mois, du plus pressé
 * au moins pressé. Une fois le contenu terminé, l'échéance n'est plus rappelée.
 */
export function rappelsGroupements(
  echeances: {
    groupementId: string;
    groupement: string;
    contenu: { id: string; titre: string; echeance?: string };
  }[],
  aujourdhui: string,
): Rappel[] {
  const limite = ajouterJours(aujourdhui, JOURS_ECHEANCE_GROUPEMENT);
  return echeances
    .filter((e) => !!e.contenu.echeance && e.contenu.echeance <= limite)
    .map((e) => ({
      id: `${GENRE_RAPPEL.GROUPEMENT}:${e.contenu.id}`,
      genre: GENRE_RAPPEL.GROUPEMENT,
      libelle: TEXTES.rappels.ligne(e.contenu.titre, e.groupement),
      echeance: e.contenu.echeance as string,
      enRetard: (e.contenu.echeance as string) < aujourdhui,
      cible: ROUTES.santeContenuGroupement(e.groupementId, e.contenu.id),
      groupementId: e.groupementId,
      contenuId: e.contenu.id,
    }))
    .sort((a, b) => a.echeance.localeCompare(b.echeance));
}
