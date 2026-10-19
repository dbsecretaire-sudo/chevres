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
  /** Dépense offerte : le bouton « Cadeau » de la fourniture (faux : elle est facturée ; absent : offerte). */
  offert?: boolean;
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
    offert: facture.offert && !l.offert ? false : undefined,
  }));
};

/**
 * Convertit les fournitures saisies en lignes enregistrables : seules celles qui ont un montant sont gardées — ou, dans une dépense offerte
 * (`offerte`), celles dont le bouton « Cadeau » est actif et qui ont un article et sa quantité : elles comptent 0 € et entrent quand même au stock.
 */
export const lignesProductionFinales = (lignes: LigneProductionForm[], offerte = false): LigneProduction[] =>
  lignes
    .map((l) => {
      const offertee = offerte && l.offert !== false;
      const quantite = l.article ? parseDecimal(l.quantite) || undefined : undefined;
      return {
        article: l.article,
        quantite,
        montant: offertee ? 0 : parseDecimal(l.montant),
        bouclesDebut: l.article && l.bouclesDebut.trim() ? l.bouclesDebut.trim() : undefined,
        offert: offertee ? true : undefined,
        // Une fourniture offerte se retient par son article et sa quantité.
        aDuContenu: !!l.article && !!quantite,
      };
    })
    .filter((l) => l.montant > 0 || (l.offert && l.aDuContenu))
    .map(({ aDuContenu: _aDuContenu, ...ligne }) => ligne);
