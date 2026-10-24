import type { Facture } from '@/features/comptabilite/types';
import {
  enregistrerVisiteVeterinaire,
  getVisiteVeterinaire,
  supprimerVisiteVeterinaire,
} from '@/features/sante/repository/visitesVeterinaire';
import { supprimerPiece } from '@/features/fichiers/services/pieces';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';

/** L'identifiant de la visite d'une facture : toujours le même, pour qu'une facture enregistrée plusieurs fois ne fasse qu'une visite. */
export const idVisiteDeLaFacture = (factureId: string): string => `facture-${factureId}`;

/**
 * Inscrit la visite d'une dépense vétérinaire (sa date, son motif, son montant) dans les visites vétérinaires, quand elle le
 * demande : la visite suit les modifications de la facture (ce qu'on a ajouté à sa fiche, comme l'animal ou les fichiers, reste).
 * Sans demande (ou sans motif), la visite de la facture disparaît.
 */
export async function synchroniserVisiteFacture(facture: Facture): Promise<void> {
  const id = idVisiteDeLaFacture(facture.id);
  const motif = facture.motifVisite?.trim();
  if (facture.categorieDepense !== CATEGORIE_DEPENSE.VETERINAIRE || !facture.visiteVeterinaire || !motif) {
    return retirerVisiteFacture(facture.id);
  }
  const existante = await getVisiteVeterinaire(id);
  await enregistrerVisiteVeterinaire({
    ...existante,
    id,
    factureId: facture.id,
    date: facture.date,
    motif,
    cout: facture.montant,
    espece:
      existante?.espece ??
      (facture.activite && facture.activite !== ACTIVITE_COMMUNE
        ? (facture.activite as EspeceAnimale)
        : undefined),
  });
}

/** Retire la visite d'une facture (supprimée, ou qui n'en demande plus), avec ses fichiers. */
export async function retirerVisiteFacture(factureId: string): Promise<void> {
  const id = idVisiteDeLaFacture(factureId);
  const existante = await getVisiteVeterinaire(id);
  if (!existante) return;
  await Promise.all((existante.fichiers ?? []).map(supprimerPiece));
  await supprimerVisiteVeterinaire(id);
}
