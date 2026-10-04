import { listFactures } from '@/features/comptabilite/repository/factures';
import type { Facture, TypeCarburant } from '@/features/comptabilite/types';
import { TYPE_CARBURANT, TYPE_FACTURE, CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';

export interface BilanCarburantType {
  montant: number;
  litrage: number;
}

export interface BilanCarburant {
  parType: Record<TypeCarburant, BilanCarburantType>;
  total: number;
  totalLitrage: number;
}

/** Ventile les factures reçues catégorisées « Carburant » de l'année par type (gazole, essence, GNR). */
export async function calculerBilanCarburant(
  annee: number,
  /** Ne garde que certaines factures (par exemple celles d'une activité) ; toutes par défaut. */
  garder: (facture: Facture) => boolean = () => true,
): Promise<BilanCarburant> {
  const factures = (await listFactures(annee)).filter(garder);
  const parType: Record<TypeCarburant, BilanCarburantType> = {
    [TYPE_CARBURANT.GAZOIL]: { montant: 0, litrage: 0 },
    [TYPE_CARBURANT.ESSENCE]: { montant: 0, litrage: 0 },
    [TYPE_CARBURANT.GNR]: { montant: 0, litrage: 0 },
    [TYPE_CARBURANT.AUTRE]: { montant: 0, litrage: 0 },
  };
  for (const f of factures) {
    if (f.type !== TYPE_FACTURE.RECUE || f.categorieDepense !== CATEGORIE_DEPENSE.CARBURANT) continue;
    if (f.lignesCarburant && f.lignesCarburant.length > 0) {
      for (const ligne of f.lignesCarburant) {
        parType[ligne.type].montant += ligne.montant;
        parType[ligne.type].litrage += ligne.litrage ?? 0;
      }
    } else if (f.typeCarburant) {
      parType[f.typeCarburant].montant += f.montant;
      parType[f.typeCarburant].litrage += f.litrage ?? 0;
    }
  }
  const total = Object.values(parType).reduce((s, t) => s + t.montant, 0);
  const totalLitrage = Object.values(parType).reduce((s, t) => s + t.litrage, 0);

  return { parType, total, totalLitrage };
}
