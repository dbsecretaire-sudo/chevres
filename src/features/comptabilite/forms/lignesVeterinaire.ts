import type { Facture, LigneVeterinaire } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { generateId } from '@/shared/utils/id';

/** Une ligne vide, pour en ajouter une à la facture vétérinaire. */
export const ligneVeterinaireVide = (): LigneVeterinaire => ({ id: generateId(), libelle: '' });

const net = (v: string | undefined): string | undefined => v?.trim() || undefined;

/**
 * Les lignes à enregistrer d'une facture : celles qui disent ce qui a été fait (une ligne sans acte ni traitement est ignorée), les
 * champs vides retirés. Rien pour une facture qui n'est pas une dépense vétérinaire.
 */
export function lignesVeterinaireRetenues(
  facture: Pick<Facture, 'categorieDepense' | 'lignesVeterinaire'>,
): LigneVeterinaire[] | undefined {
  if (facture.categorieDepense !== CATEGORIE_DEPENSE.VETERINAIRE) return undefined;
  const lignes = (facture.lignesVeterinaire ?? [])
    .filter((l) => l.libelle.trim())
    .map(
      (l): LigneVeterinaire => ({
        id: l.id,
        libelle: l.libelle.trim(),
        animal: net(l.animal),
        ordonnance: net(l.ordonnance),
        dateDebut: net(l.dateDebut),
        dateFin: net(l.dateFin),
        voie: net(l.voie),
        dose: net(l.dose),
        rythme: net(l.rythme),
        remiseEnVente: net(l.remiseEnVente),
        observations: net(l.observations),
      }),
    );
  return lignes.length > 0 ? lignes : undefined;
}
