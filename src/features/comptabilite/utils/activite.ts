import type { ActiviteComptable, Facture, LigneAlimentation, Vente } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { especeParDefaut } from '@/shared/dictionnaire/animaux';

/**
 * Activité d'une facture. Les factures saisies avant le choix de l'activité sont rattachées à l'espèce par
 * défaut pour l'alimentation (propre à une espèce), et à l'activité commune pour le reste (carburant, impôts…).
 */
export function activiteFacture(f: Pick<Facture, 'activite' | 'categorieDepense'>): ActiviteComptable {
  if (f.activite) return f.activite;
  return f.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION ? especeParDefaut() : ACTIVITE_COMMUNE;
}

/** Activité d'une vente de production : toujours une espèce — l'espèce par défaut pour les anciennes ventes. */
export const activiteVente = (v: Pick<Vente, 'activite'>): ActiviteComptable =>
  v.activite ?? especeParDefaut();

/** Cheptel d'une ligne d'alimentation : le sien s'il est précisé, sinon celui de la facture. */
export const activiteLigne = (
  f: Pick<Facture, 'activite' | 'categorieDepense'>,
  ligne: Pick<LigneAlimentation, 'activite'>,
): ActiviteComptable => ligne.activite ?? activiteFacture(f);

/** La part d'une facture qui revient à une activité : la facture elle-même si elle n'en concerne qu'une. */
export interface PartFacture {
  activite: ActiviteComptable;
  /** Copie de la facture limitée à cette activité : `montant` et `lignesAlimentation` sont ceux de la part. */
  facture: Facture;
}

/**
 * Découpe une facture par activité. Une facture d'alimentation peut regrouper des aliments pour plusieurs
 * cheptels : chacun reçoit le montant de ses propres lignes. Toute autre facture n'a qu'une seule part.
 */
export function partsDeFacture(f: Facture): PartFacture[] {
  const lignes = f.lignesAlimentation ?? [];
  if (
    f.type !== TYPE_FACTURE.RECUE ||
    f.categorieDepense !== CATEGORIE_DEPENSE.ALIMENTATION ||
    lignes.length === 0
  ) {
    return [{ activite: activiteFacture(f), facture: f }];
  }

  const groupes = new Map<ActiviteComptable, LigneAlimentation[]>();
  for (const ligne of lignes) {
    const activite = activiteLigne(f, ligne);
    groupes.set(activite, [...(groupes.get(activite) ?? []), ligne]);
  }
  if (groupes.size === 1) return [{ activite: [...groupes.keys()][0], facture: f }];

  return [...groupes].map(([activite, lignesDuGroupe]) => ({
    activite,
    facture: {
      ...f,
      activite,
      montant: lignesDuGroupe.reduce((somme, l) => somme + l.montant, 0),
      lignesAlimentation: lignesDuGroupe,
    },
  }));
}

/** Les activités qu'une facture concerne (plusieurs si l'alimentation est répartie entre des cheptels). */
export const activitesFacture = (f: Facture): ActiviteComptable[] => partsDeFacture(f).map((p) => p.activite);
