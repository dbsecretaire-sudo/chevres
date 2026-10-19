import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { POIDS_UNITE_CONDITIONNEMENT, TYPES_ALIMENT_CONDITIONNES } from '@/shared/constants/planComptable';
import type {
  ActiviteComptable,
  Facture,
  LigneAlimentation,
  TypeAliment,
  UniteConditionnement,
} from '@/features/comptabilite/types';
import { TYPE_ALIMENT, UNITE_CONDITIONNEMENT } from '@/shared/constants/comptabilite';
import { typesAlimentEspece } from '@/features/comptabilite/utils/alimentation';
import { activiteFacture } from '@/features/comptabilite/utils/activite';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';

/** Une ligne d'aliment telle que saisie dans le formulaire (tout en texte, converti à l'enregistrement). */
export interface LigneAlimentForm {
  key: string;
  type: TypeAliment;
  /** Cheptel concerné ('' = celui de la facture). */
  activite: EspeceAnimale | '';
  montant: string;
  quantiteKg: string;
  typeLibre: string;
  uniteConditionnement: UniteConditionnement;
  nombreUnitesConditionnement: string;
  /** La ligne est un achat de matériel (choisi dans la liste des cheptels) : sa liste ne propose que le matériel. Pas enregistré. */
  materiel?: boolean;
  /** La ligne est un achat d'équipement (consommable) : sa liste ne propose que l'équipement. Pas enregistré tel quel. */
  equipement?: boolean;
  /** Dépense offerte : le bouton « Cadeau » de la ligne (faux : elle est facturée ; absent : offerte). */
  offert?: boolean;
}

/** Nouvelle ligne : le premier aliment de l'espèce courante par défaut. */
export const ligneAlimentVide = (type: TypeAliment = typesAlimentEspece()[0]): LigneAlimentForm => ({
  key: generateId(),
  type,
  activite: '',
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
    activite: l.activite && l.activite !== activiteFacture(facture) ? (l.activite as EspeceAnimale) : '',
    montant: String(l.montant),
    quantiteKg: l.quantiteKg !== undefined ? String(l.quantiteKg) : '',
    typeLibre: l.typeLibre ?? '',
    materiel: l.materiel,
    equipement: l.equipement,
    // Dans une dépense offerte, une ligne sans cadeau garde son montant : son bouton est désactivé.
    offert: facture.offert && !l.offert ? false : undefined,
    uniteConditionnement: l.uniteConditionnement ?? UNITE_CONDITIONNEMENT.MATELAS,
    nombreUnitesConditionnement:
      l.nombreUnitesConditionnement !== undefined ? String(l.nombreUnitesConditionnement) : '',
  }));
}

/**
 * Convertit les lignes saisies en lignes enregistrables : seules les lignes avec un montant sont
 * gardées, et pour luzerne/foin/paille la quantité en kg est dérivée du nombre de matelas/ballots.
 */
export function lignesAlimentationFinales(
  lignes: LigneAlimentForm[],
  /** Activité de la facture : une ligne n'enregistre son cheptel que s'il en diffère. */
  activiteDeLaFacture: ActiviteComptable,
  /** La dépense est offerte : une ligne dont le bouton « Cadeau » est actif compte 0 € et reste, avec sa quantité. */
  offerte = false,
): LigneAlimentation[] {
  return lignes
    .map((l) => {
      const estConditionne = TYPES_ALIMENT_CONDITIONNES.includes(l.type);
      const nombreUnites = estConditionne
        ? parseDecimal(l.nombreUnitesConditionnement) || undefined
        : undefined;
      const offertee = offerte && l.offert !== false;
      return {
        type: l.type,
        activite: l.activite && l.activite !== activiteDeLaFacture ? l.activite : undefined,
        montant: offertee ? 0 : parseDecimal(l.montant),
        offert: offertee ? true : undefined,
        // Ce que dit une ligne offerte : une quantité ou un montant indicatif (sinon la ligne est vide).
        indicatif: parseDecimal(l.montant) > 0,
        quantiteKg: estConditionne
          ? nombreUnites
            ? nombreUnites * POIDS_UNITE_CONDITIONNEMENT[l.uniteConditionnement]
            : undefined
          : parseDecimal(l.quantiteKg) || undefined,
        typeLibre: l.type === TYPE_ALIMENT.AUTRE ? l.typeLibre.trim() || undefined : undefined,
        uniteConditionnement: estConditionne ? l.uniteConditionnement : undefined,
        nombreUnitesConditionnement: nombreUnites,
        materiel: l.materiel || undefined,
        equipement: l.equipement || undefined,
      };
    })
    .filter((l) => l.montant > 0 || (l.offert && (l.indicatif || !!l.quantiteKg)))
    .map(({ indicatif: _indicatif, ...ligne }) => ligne);
}
