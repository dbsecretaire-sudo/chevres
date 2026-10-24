import type { Facture } from '@/features/comptabilite/types';
import { activiteFacture } from '@/features/comptabilite/utils/activite';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import type { Chevre } from '@/features/cheptel/types';
import type { VisiteVeterinaire } from '@/features/sante/types';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { comparerAlphabetique } from '@/shared/utils/personne';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';

/** Une ligne du carnet sanitaire : une intervention, avec tout ce que la page du carnet demande. */
export interface LigneCarnet {
  /** Date de l'intervention (AAAA-MM-JJ). */
  date: string;
  /** Le n° d'animal ou le lot concerné ; vide : le troupeau entier. */
  animal: string;
  ordonnance: string;
  debut: string;
  fin: string;
  /** Le médicament (ou l'acte) : la case large au-dessus de la voie, de la dose et du rythme. */
  medicament: string;
  voie: string;
  dose: string;
  rythme: string;
  remise: string;
  /** Le motif du traitement et les observations. */
  motif: string;
  /** Qui est intervenu : le vétérinaire (le nom de la facture). */
  intervenant: string;
}

const ligneVide = (date: string, intervenant: string): LigneCarnet => ({
  date,
  animal: '',
  ordonnance: '',
  debut: '',
  fin: '',
  medicament: '',
  voie: '',
  dose: '',
  rythme: '',
  remise: '',
  motif: '',
  intervenant,
});

/** Une intervention qui concerne plusieurs animaux : une ligne par animal, comme le carnet le demande (les autres champs se répètent). */
const uneLigneParAnimal = (ligne: LigneCarnet, animaux: string[]): LigneCarnet[] =>
  animaux.length > 1 ? animaux.map((animal) => ({ ...ligne, animal })) : [{ ...ligne, animal: animaux[0] ?? ligne.animal }];

/**
 * Les interventions du carnet sanitaire de l'espèce, de la plus ancienne à la plus récente (un registre se lit dans l'ordre) :
 * chaque ligne « Ce qui a été fait » d'une facture vétérinaire est une intervention ; une visite sans ligne détaillée (une visite
 * saisie à la main, ou une facture sans détail) en est une aussi, avec son motif.
 */
export function lignesDuCarnet(
  factures: Facture[],
  visites: VisiteVeterinaire[],
  espece: EspeceAnimale,
): LigneCarnet[] {
  const veterinaires = factures.filter((f) => {
    if (f.categorieDepense !== CATEGORIE_DEPENSE.VETERINAIRE) return false;
    const activite = activiteFacture(f);
    return activite === espece || activite === ACTIVITE_COMMUNE;
  });
  const detaillees = new Set(veterinaires.filter((f) => (f.lignesVeterinaire?.length ?? 0) > 0).map((f) => f.id));

  const duDetail = veterinaires.flatMap((f) =>
    (f.lignesVeterinaire ?? []).flatMap((l) => {
      const ligne: LigneCarnet = {
      ...ligneVide(f.date, f.tiers),
      animal: l.animal ?? '',
      ordonnance: l.ordonnance ?? '',
      debut: l.dateDebut ?? '',
      fin: l.dateFin ?? '',
      medicament: l.libelle,
      voie: l.voie ?? '',
      dose: l.dose ?? '',
      rythme: l.rythme ?? '',
      remise: l.remiseEnVente ?? '',
      motif: l.observations ?? '',
      };
      // Plusieurs animaux séparés par des virgules ; un lot (« Lot 60 chèvres ») reste d'une pièce.
      return uneLigneParAnimal(ligne, (l.animal ?? '').split(/[,;\n]+/).map((a) => a.trim()).filter(Boolean));
    }),
  );

  // Une visite dont la facture est détaillée est déjà dans le carnet par ses lignes.
  const parFacture = new Map(veterinaires.map((f) => [f.id, f]));
  const desVisites = visites
    .filter((v) => !v.factureId || !detaillees.has(v.factureId))
    .flatMap((v) =>
      uneLigneParAnimal(
        {
          ...ligneVide(v.date, (v.factureId ? parFacture.get(v.factureId)?.tiers : undefined) ?? ''),
          motif: [v.motif, v.description].filter(Boolean).join(' — '),
        },
        numerosDeBoucles(v.chevreNumeroBoucle),
      ),
    );

  return [...duDetail, ...desVisites].sort((a, b) => a.date.localeCompare(b.date));
}

/** Le nombre de lignes d'une page du carnet : celui du formulaire papier. */
export const LIGNES_PAR_PAGE_CARNET = 9;

/**
 * Les lignes réparties en pages de neuf, toujours : la dernière page est complétée de lignes vides, et une page vide quand il n'y a
 * rien. Un texte long ne prend pas la place d'une autre ligne : il s'écrit plus petit dans sa case (voir carnetSanitairePdf).
 */
export function pagesDuCarnet(lignes: LigneCarnet[], parPage: number = LIGNES_PAR_PAGE_CARNET): (LigneCarnet | undefined)[][] {
  const nombre = Math.max(1, Math.ceil(lignes.length / parPage));
  return Array.from({ length: nombre }, (_, p) =>
    Array.from({ length: parPage }, (_, i) => lignes[p * parPage + i]),
  );
}

/**
 * Les boucles que l'on peut choisir pour un acte de la visite du vétérinaire, par ordre croissant : celles des animaux présents à
 * l'exploitation ce jour-là (nés, et pas encore morts, vendus ou partis) et contrôlés ce même jour, c'est-à-dire nommés dans le
 * « N° de boucle concerné » d'une visite de cette date. Sans visite ce jour-là, ou sans boucle dans la visite, aucune : les numéros
 * s'ajoutent d'abord dans les détails de la visite vétérinaire.
 */
export function bouclesDeLaVisite(
  date: string,
  animaux: Pick<Chevre, 'numeroBoucle' | 'dateNaissance' | 'statut' | 'dateStatut'>[],
  visites: Pick<VisiteVeterinaire, 'date' | 'chevreNumeroBoucle'>[],
): string[] {
  const presentes = animaux.filter(
    (a) =>
      !!a.numeroBoucle?.trim() &&
      (!a.dateNaissance || a.dateNaissance <= date) &&
      (a.statut === STATUT_CHEVRE.VIVANTE || (a.dateStatut ?? '') > date),
  );
  const controlees = new Set(
    visites.filter((v) => v.date === date).flatMap((v) => numerosDeBoucles(v.chevreNumeroBoucle)),
  );
  const numeros = presentes
    .map((a) => (a.numeroBoucle ?? '').trim())
    .filter((n) => controlees.has(n));
  return [...new Set(numeros)].sort(comparerAlphabetique);
}
