import {
  GENRE_RAPPEL,
  JOURS_ECHEANCE_GROUPEMENT,
  MOIS_PAR_TRIMESTRE,
  PERIODES_RAPPELEES,
} from '@/shared/constants/rappels';
import { ROUTES } from '@/shared/constants/routes';
import { ajouterJours } from '@/shared/utils/calendrier';
import { ACTIVITE_SOCIETE, ACTIVITES_ENTREPRISE } from '@/shared/constants/etablissements';
import { MOIS_PAR_AN } from '@/shared/constants/temps';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Les déclarations qu'on peut activer ou non (RSA, URSSAF) ; une échéance de groupement s'y ajoute dans les rappels (voir Rappel.genre). */
export type GenreRappel = Exclude<ValeurDe<typeof GENRE_RAPPEL>, typeof GENRE_RAPPEL.GROUPEMENT>;

/** Une déclaration à faire (ou à valider) pour une période terminée. */
export interface Rappel {
  /** Identifiant de la période (« rsa:2026-T3 »), enregistré quand le rappel est validé. */
  id: string;
  genre: GenreRappel | typeof GENRE_RAPPEL.GROUPEMENT;
  /** « Déclaration RSA · 3e trimestre 2026 ». */
  libelle: string;
  /** Le dernier jour pour la faire : la fin du mois qui suit la période (AAAA-MM-JJ). */
  echeance: string;
  enRetard: boolean;
  /** Pour l'échéance d'un groupement : l'écran du contenu, et de quoi le passer à « terminé ». */
  cible?: string;
  groupementId?: string;
  contenuId?: string;
}

/** « Déclaration RSA · 3e trimestre 2026 » (ou le mois de l'URSSAF) d'après l'identifiant d'un rappel ; rien si l'identifiant est inconnu. */
export function libelleDeRappel(id: string): string | null {
  const T = TEXTES.rappels;
  const [genre, periode = ''] = id.split(':');
  const trimestre = /^(\d{4})-T([1-4])$/.exec(periode);
  if (genre === GENRE_RAPPEL.RSA && trimestre) {
    return T.ligne(T.genre.rsa, T.trimestre(Number(trimestre[2]), Number(trimestre[1])));
  }
  const mois = /^(\d{4})-(\d{2})$/.exec(periode);
  if (genre === GENRE_RAPPEL.URSSAF && mois && Number(mois[2]) >= 1 && Number(mois[2]) <= MOIS_PAR_AN) {
    return T.ligne(T.genre.urssaf, `${NOMS_MOIS[Number(mois[2]) - 1]} ${mois[1]}`);
  }
  return null;
}

/** Le dernier mois de la période d'un rappel (AAAAMM) : pour ranger l'historique du plus récent au plus ancien. */
export function periodeDeRappel(id: string): number {
  const periode = id.split(':')[1] ?? '';
  const trimestre = /^(\d{4})-T([1-4])$/.exec(periode);
  if (trimestre) return Number(trimestre[1]) * 100 + Number(trimestre[2]) * MOIS_PAR_TRIMESTRE;
  const mois = /^(\d{4})-(\d{2})$/.exec(periode);
  return mois ? Number(mois[1]) * 100 + Number(mois[2]) : 0;
}

/** Ce qui détermine les rappels d'un établissement : son type, et ce que l'utilisateur a désactivé ou validé. */
export interface ContexteRappels {
  /** Vrai pour un élevage (RSA agricole). */
  elevage: boolean;
  /** Les types de l'établissement (gîte, secrétariat…) : l'URSSAF concerne le gîte et le secrétariat. */
  activites: readonly string[];
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

/** Les genres de rappel qui concernent l'établissement. */
export function genresApplicables(ctx: Pick<ContexteRappels, 'elevage' | 'activites'>): GenreRappel[] {
  if (ctx.elevage) return [GENRE_RAPPEL.RSA];
  const gereUrssaf =
    ctx.activites.includes(ACTIVITE_SOCIETE.ASSOCIATION) ||
    ctx.activites.includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE);
  return gereUrssaf && ctx.activites.some((a) => ACTIVITES_ENTREPRISE.includes(a))
    ? [GENRE_RAPPEL.URSSAF]
    : [];
}

/**
 * Les déclarations à valider à la date donnée : pour chaque genre actif, les dernières périodes terminées (le trimestre pour le
 * RSA, le mois pour l'URSSAF) que l'utilisateur n'a pas validées. À faire avant la fin du mois qui suit la période.
 */
export function rappelsDus(aujourdhui: string, ctx: ContexteRappels): Rappel[] {
  const annee = Number(aujourdhui.slice(0, 4));
  const mois = Number(aujourdhui.slice(5, 7));
  const actifs = genresApplicables(ctx).filter((g) => !ctx.desactives?.includes(g));
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
    if (actifs.includes(GENRE_RAPPEL.URSSAF)) {
      const brut = mois - k;
      const a = brut < 1 ? annee - 1 : annee;
      const m = brut < 1 ? brut + MOIS_PAR_AN : brut;
      const suivant = moisSuivant(a, m);
      rappels.push({
        id: `${GENRE_RAPPEL.URSSAF}:${a}-${deuxChiffres(m)}`,
        genre: GENRE_RAPPEL.URSSAF,
        libelle: libelleDeRappel(`${GENRE_RAPPEL.URSSAF}:${a}-${deuxChiffres(m)}`) ?? '',
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
