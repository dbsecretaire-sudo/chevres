import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { POIDS_UNITE_CONDITIONNEMENT, TYPES_ALIMENT_CONDITIONNES } from '@/shared/constants/planComptable';
import type {
  Facture,
  LigneAlimentation,
  TypeAliment,
  UniteConditionnement,
} from '@/features/comptabilite/types';
import { TYPE_ALIMENT, UNITE_CONDITIONNEMENT } from '@/shared/constants/comptabilite';
import { typesAlimentEspece } from '@/features/comptabilite/utils/alimentation';

/** Une ligne d'aliment telle que saisie dans le formulaire (tout en texte, converti à l'enregistrement). */
export interface LigneAlimentForm {
  key: string;
  type: TypeAliment;
  montant: string;
  quantiteKg: string;
  typeLibre: string;
  uniteConditionnement: UniteConditionnement;
  nombreUnitesConditionnement: string;
}

/** Nouvelle ligne : le premier aliment de l'espèce courante par défaut. */
export const ligneAlimentVide = (type: TypeAliment = typesAlimentEspece()[0]): LigneAlimentForm => ({
  key: generateId(),
  type,
  montant: '',
  quantiteKg: '',
  typeLibre: '',
  uniteConditionnement: UNITE_CONDITIONNEMENT.MATELAS,
  nombreUnitesConditionnement: '',
});

export function versLignesAlimentationForm(facture: Facture): LigneAlimentForm[] {
  return (facture.lignesAlimentation ?? []).map((l) => ({
    key: generateId(),
    type: l.type,
    montant: String(l.montant),
    quantiteKg: l.quantiteKg !== undefined ? String(l.quantiteKg) : '',
    typeLibre: l.typeLibre ?? '',
    uniteConditionnement: l.uniteConditionnement ?? UNITE_CONDITIONNEMENT.MATELAS,
    nombreUnitesConditionnement:
      l.nombreUnitesConditionnement !== undefined ? String(l.nombreUnitesConditionnement) : '',
  }));
}

/**
 * Convertit les lignes saisies en lignes enregistrables : seules les lignes avec un montant sont
 * gardées, et pour luzerne/foin/paille la quantité en kg est dérivée du nombre de matelas/ballots.
 */
export function lignesAlimentationFinales(lignes: LigneAlimentForm[]): LigneAlimentation[] {
  return lignes
    .map((l) => {
      const estConditionne = TYPES_ALIMENT_CONDITIONNES.includes(l.type);
      const nombreUnites = estConditionne
        ? parseDecimal(l.nombreUnitesConditionnement) || undefined
        : undefined;
      return {
        type: l.type,
        montant: parseDecimal(l.montant),
        quantiteKg: estConditionne
          ? nombreUnites
            ? nombreUnites * POIDS_UNITE_CONDITIONNEMENT[l.uniteConditionnement]
            : undefined
          : parseDecimal(l.quantiteKg) || undefined,
        typeLibre: l.type === TYPE_ALIMENT.AUTRE ? l.typeLibre.trim() || undefined : undefined,
        uniteConditionnement: estConditionne ? l.uniteConditionnement : undefined,
        nombreUnitesConditionnement: nombreUnites,
      };
    })
    .filter((l) => l.montant > 0);
}
