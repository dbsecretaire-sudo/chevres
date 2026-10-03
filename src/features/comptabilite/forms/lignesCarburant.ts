import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import type { Facture, LigneCarburant, TypeCarburant } from '@/features/comptabilite/types';
import { TYPE_CARBURANT } from '@/shared/constants/comptabilite';

/** Une ligne de carburant telle que saisie dans le formulaire (tout en texte, converti à l'enregistrement). */
export interface LigneCarburantForm {
  key: string;
  type: TypeCarburant;
  montant: string;
  litrage: string;
}

export const ligneCarburantVide = (): LigneCarburantForm => ({
  key: generateId(),
  type: TYPE_CARBURANT.GAZOIL,
  montant: '',
  litrage: '',
});

/** Gère aussi l'ancien format (une facture = un seul type de carburant, sans tableau de lignes). */
export function versLignesCarburantForm(facture: Facture): LigneCarburantForm[] {
  if (facture.lignesCarburant && facture.lignesCarburant.length > 0) {
    return facture.lignesCarburant.map((l) => ({
      key: generateId(),
      type: l.type,
      montant: String(l.montant),
      litrage: l.litrage !== undefined ? String(l.litrage) : '',
    }));
  }
  if (facture.typeCarburant) {
    return [
      {
        key: generateId(),
        type: facture.typeCarburant,
        montant: String(facture.montant),
        litrage: facture.litrage !== undefined ? String(facture.litrage) : '',
      },
    ];
  }
  return [ligneCarburantVide()];
}

/** Seules les lignes avec un montant sont gardées. */
export function lignesCarburantFinales(lignes: LigneCarburantForm[]): LigneCarburant[] {
  return lignes
    .map((l) => ({
      type: l.type,
      montant: parseDecimal(l.montant),
      litrage: parseDecimal(l.litrage) || undefined,
    }))
    .filter((l) => l.montant > 0);
}
