import type { Chevre } from '@/features/cheptel/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, roleDeLaViande, type FiltreStock } from '@/features/stock/services/stock';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { GENRE_ARTICLE, type ROLE_VIANDE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { SEPARATEUR_ANIMAUX } from '@/shared/constants/comptabilite';
import type { Vente } from '@/features/comptabilite/types';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

/**
 * L'animal d'une vente tel qu'on le lit dans les listes : son n° de boucle (ou son nom, ou « sans boucle » pour un petit pas
 * encore bouclé), M ou F, puis sa date de naissance — une seule fois.
 */
export function libelleAnimalVendu(
  a: Pick<Chevre, 'numeroBoucle' | 'nom' | 'sexe' | 'dateNaissance'>,
): string {
  const identifiant = a.numeroBoucle
    ? a.nom
      ? `${a.numeroBoucle} — ${a.nom}`
      : a.numeroBoucle
    : a.nom
      ? T.sansBoucleNom(a.nom)
      : T.sansBoucle;
  return T.animalOption(identifiant, a.sexe === SEXE.MALE ? T.sexeM : T.sexeF, formatDateFR(a.dateNaissance));
}

/** La valeur du choix « un par un » dans la liste des abattoirs à facturer. */
export const UN_PAR_UN = '__un_par_un';

/** Les boucles d'un lot en quelques mots : toutes quand il y en a peu, sinon de la première à la dernière (« 00836 → 00855 »). */
export function resumeBoucles(animaux: Chevre[]): string {
  const boucles = animaux
    .map((a) => a.numeroBoucle)
    .filter((b): b is string => !!b)
    .sort();
  if (boucles.length <= 3) return boucles.join(', ');
  return `${boucles[0]} → ${boucles[boucles.length - 1]}`;
}

/** Les animaux envoyés à l'abattoir un même jour. */
export interface JourAbattu {
  date: string;
  animaux: Chevre[];
}

/**
 * Les animaux à l'abattoir dont la viande n'est pas encore facturée (aucune vente ne les désigne), rangés par jour d'abattage — le
 * plus récent d'abord. `venteId` : la vente qu'on modifie, dont les animaux restent proposés.
 */
export function joursAbattusAFacturer(
  animaux: Chevre[],
  ventes: Pick<Vente, 'id' | 'animaux'>[],
  venteId?: string,
): JourAbattu[] {
  const factures = new Set(
    ventes
      .filter((v) => v.id !== venteId)
      .flatMap((v) => (v.animaux ?? '').split(SEPARATEUR_ANIMAUX).filter(Boolean)),
  );
  const parJour = new Map<string, Chevre[]>();
  for (const a of animaux) {
    if (a.statut !== STATUT_CHEVRE.ABATTOIR || !a.dateStatut || factures.has(a.id)) continue;
    parJour.set(a.dateStatut, [...(parJour.get(a.dateStatut) ?? []), a]);
  }
  return [...parJour.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, liste]) => ({
      date,
      animaux: liste.sort((a, b) => (a.numeroBoucle ?? '').localeCompare(b.numeroBoucle ?? '')),
    }));
}

/**
 * Le rôle de la ligne de viande qu'une vente a choisie comme détail (les petits, l'animal sur pied, l'animal vivant) ; rien pour
 * la charcuterie et les autres lignes. Une vente de ces lignes se fait animal par animal : elle désigne ses fiches du cheptel.
 */
export async function roleDuDetailDeVente(
  activite: string,
  precision: string | undefined,
): Promise<ValeurDe<typeof ROLE_VIANDE> | undefined> {
  if (!precision) return undefined;
  const archive = await lireArchiveStock();
  const filtre = activite === ACTIVITE_COMMUNE ? undefined : (activite as FiltreStock);
  const ligne = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, filtre).find((a) => a.libelle === precision);
  return ligne ? roleDeLaViande(ligne.cle) : undefined;
}
