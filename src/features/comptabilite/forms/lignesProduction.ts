import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { lignesProductionDe } from '@/features/comptabilite/utils/lignesProduction';
import type { Facture, LigneProduction } from '@/features/comptabilite/types';

/** Une fourniture telle que saisie dans le formulaire (tout en texte, converti à l'enregistrement). */
export interface LigneProductionForm {
  key: string;
  /** L'article du stock acheté (vide : l'achat n'entre pas au stock). */
  article: string;
  quantite: string;
  montant: string;
  /** Un achat de boucles : le numéro de la première. */
  bouclesDebut: string;
}

/** Nouvelle fourniture : sans article, sans quantité ni montant. */
export const ligneProductionVide = (): LigneProductionForm => ({
  key: generateId(),
  article: '',
  quantite: '',
  montant: '',
  bouclesDebut: '',
});

/** Les fournitures d'une facture pour le formulaire : le détail, ou l'article unique des anciennes factures (sinon une ligne avec le montant). */
export const versLignesProductionForm = (facture: Facture): LigneProductionForm[] => {
  const lignes = lignesProductionDe(facture);
  if (lignes.length === 0)
    return [{ ...ligneProductionVide(), montant: String(facture.montant).replace('.', ',') }];
  return lignes.map((l) => ({
    key: generateId(),
    article: l.article,
    quantite: l.quantite !== undefined ? String(l.quantite).replace('.', ',') : '',
    montant: String(l.montant).replace('.', ','),
    bouclesDebut: l.bouclesDebut ?? '',
  }));
};

/** Convertit les fournitures saisies en lignes enregistrables : seules celles qui ont un montant sont gardées. */
export const lignesProductionFinales = (lignes: LigneProductionForm[]): LigneProduction[] =>
  lignes
    .map((l) => ({
      article: l.article,
      quantite: l.article ? parseDecimal(l.quantite) || undefined : undefined,
      montant: parseDecimal(l.montant),
      bouclesDebut: l.article && l.bouclesDebut.trim() ? l.bouclesDebut.trim() : undefined,
    }))
    .filter((l) => l.montant > 0);
