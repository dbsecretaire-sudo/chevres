import type { Chevre } from '@/features/cheptel/types';
import type { SuiviAnnuel } from '@/features/cheptel/services/suiviMouvements';
import { CAUSE_ENTREE, CAUSE_SORTIE } from '@/shared/constants/suiviMouvements';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';

/** Les classes d'âge de la pyramide, en mois : de la borne basse (comprise) à la borne haute (exclue) ; la dernière n'a pas de borne haute. */
export const CLASSES_D_AGE: { cle: string; de: number; a?: number }[] = [
  { cle: 'moins6', de: 0, a: 6 },
  { cle: 'de6a12', de: 6, a: 12 },
  { cle: 'de1a2', de: 12, a: 24 },
  { cle: 'de2a3', de: 24, a: 36 },
  { cle: 'de3a4', de: 36, a: 48 },
  { cle: 'de4a5', de: 48, a: 60 },
  { cle: 'plus5', de: 60 },
];

/** Les mois entiers écoulés entre deux dates AAAA-MM-JJ (0 avant le premier mois révolu). */
export function moisEntre(de: string, a: string): number {
  const [ad, am, aj] = de.split('-').map(Number);
  const [bd, bm, bj] = a.split('-').map(Number);
  const mois = (bd - ad) * 12 + (bm - am) - (bj < aj ? 1 : 0);
  return Math.max(0, mois);
}

export interface ClasseDAge {
  cle: string;
  femelles: number;
  males: number;
}

/** La pyramide des âges des animaux vivants à une date : le nombre de femelles et de mâles de chaque classe d'âge. */
export function pyramideDesAges(animaux: Chevre[], jour: string): ClasseDAge[] {
  const classes: ClasseDAge[] = CLASSES_D_AGE.map((c) => ({ cle: c.cle, femelles: 0, males: 0 }));
  for (const animal of animaux) {
    if (animal.statut !== STATUT_CHEVRE.VIVANTE || animal.dateNaissance > jour) continue;
    const mois = moisEntre(animal.dateNaissance, jour);
    const index = CLASSES_D_AGE.findIndex((c) => mois >= c.de && (c.a === undefined || mois < c.a));
    if (index < 0) continue;
    if (animal.sexe === SEXE.FEMELLE) classes[index].femelles += 1;
    else classes[index].males += 1;
  }
  return classes;
}

/** Les entrées et les sorties d'une année, par cause (sans les changements de catégorie, qui ne sont ni l'une ni l'autre). */
export interface MouvementsDeLAnnee {
  naissances: number;
  achats: number;
  ventes: number;
  morts: number;
  autresSorties: number;
}

const total = (e: { jeunes: number; femelles: number; males: number }) => e.jeunes + e.femelles + e.males;

/** Ce que le suivi des mouvements de l'année compte : naissances, achats, ventes, morts et autres sorties (pension, autoconsommation…). */
export function mouvementsDeLAnnee(suivi: Pick<SuiviAnnuel, 'lignes'>): MouvementsDeLAnnee {
  const m: MouvementsDeLAnnee = { naissances: 0, achats: 0, ventes: 0, morts: 0, autresSorties: 0 };
  for (const l of suivi.lignes) {
    if (l.cause === CAUSE_ENTREE.NAISSANCE) m.naissances += total(l.entrees);
    else if (l.cause === CAUSE_ENTREE.ACHAT) m.achats += total(l.entrees);
    else if (l.cause === CAUSE_SORTIE.VENTE) m.ventes += total(l.sorties);
    else if (l.cause === CAUSE_SORTIE.MORT) m.morts += total(l.sorties);
    else if (l.cause !== CAUSE_ENTREE.CHANGEMENT_CATEGORIE) m.autresSorties += total(l.sorties);
  }
  return m;
}
