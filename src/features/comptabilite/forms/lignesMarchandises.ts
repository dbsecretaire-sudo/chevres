import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import type { Facture, LigneMarchandise } from '@/features/comptabilite/types';
import { RUBRIQUE_MARCHANDISE, UNITE_MARCHANDISE } from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Une ligne de marchandise telle que saisie dans le formulaire (tout en texte, converti à l'enregistrement). */
export interface LigneMarchandiseForm {
  key: string;
  rubrique: ValeurDe<typeof RUBRIQUE_MARCHANDISE>;
  /** Le nom de la marchandise, choisi dans la liste du stock. */
  marchandise: string;
  quantite: string;
  unite: ValeurDe<typeof UNITE_MARCHANDISE>;
  montant: string;
  /** Dépense offerte : le bouton « Cadeau » de la ligne (faux : elle est facturée ; absent : offerte). */
  offert?: boolean;
}

/** Nouvelle ligne : pour le bar, sans marchandise choisie, en unités. */
export const ligneMarchandiseVide = (
  rubrique: ValeurDe<typeof RUBRIQUE_MARCHANDISE> = RUBRIQUE_MARCHANDISE.BAR,
): LigneMarchandiseForm => ({
  key: generateId(),
  rubrique,
  marchandise: '',
  quantite: '',
  unite: UNITE_MARCHANDISE.PIECE,
  montant: '',
});

export const versLignesMarchandisesForm = (facture: Facture): LigneMarchandiseForm[] =>
  (facture.lignesMarchandises ?? []).map((l) => ({
    key: generateId(),
    rubrique: l.rubrique,
    marchandise: l.marchandise,
    quantite: l.quantite !== undefined ? String(l.quantite).replace('.', ',') : '',
    unite: l.unite ?? UNITE_MARCHANDISE.PIECE,
    montant: String(l.montant).replace('.', ','),
    offert: facture.offert && !l.offert ? false : undefined,
  }));

/**
 * Convertit les lignes saisies en lignes enregistrables : seules celles qui ont un montant sont gardées — ou, dans une dépense offerte
 * (`offerte`), celles dont le bouton « Cadeau » est actif et qui ont une quantité : elles comptent 0 € et entrent quand même au stock.
 */
export const lignesMarchandisesFinales = (lignes: LigneMarchandiseForm[], offerte = false): LigneMarchandise[] =>
  lignes
    .map((l) => {
      const offertee = offerte && l.offert !== false;
      return {
        marchandise: l.marchandise.trim(),
        rubrique: l.rubrique,
        quantite: parseDecimal(l.quantite) || undefined,
        unite: parseDecimal(l.quantite) ? l.unite : undefined,
        montant: offertee ? 0 : parseDecimal(l.montant),
        offert: offertee ? true : undefined,
      };
    })
    .filter((l) => l.montant > 0 || (l.offert && !!l.quantite));
