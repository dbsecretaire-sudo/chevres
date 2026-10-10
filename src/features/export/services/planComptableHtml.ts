import type { Facture } from '@/features/comptabilite/types';
import { compteDeFacture } from '@/features/export/services/lignesExport';
import { echapper } from '@/features/export/services/htmlPdf';
import { facturesParCompteEtDate } from '@/features/export/services/syntheses';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.export.pdf.planComptable;

/**
 * Le détail des factures de l'année, compte par compte : un titre par compte (numéro et libellé), ses factures du plus ancien au
 * plus récent (débit à gauche, crédit à droite), puis son total. Les factures sans compte viennent à la fin.
 */
export function detailParCompteHtml(factures: Facture[], messageVide: string): string {
  if (factures.length === 0) return `<p class="vide">${echapper(messageVide)}</p>`;
  const groupes = new Map<string, { titre: string; factures: Facture[] }>();
  for (const f of facturesParCompteEtDate(factures)) {
    const compte = compteDeFacture(f);
    const cle = compte?.numero ?? '';
    if (!groupes.has(cle)) {
      groupes.set(cle, {
        titre: compte ? `${compte.numero} — ${compte.libelle}` : T.sansCompte,
        factures: [],
      });
    }
    groupes.get(cle)?.factures.push(f);
  }
  const montant = (n: number) => (n === 0 ? '' : formatMontant(n));
  const corps = [...groupes.values()]
    .map((g) => {
      const debit = g.factures
        .filter((f) => f.type === TYPE_FACTURE.RECUE)
        .reduce((t, f) => t + f.montant, 0);
      const credit = g.factures
        .filter((f) => f.type === TYPE_FACTURE.EMISE)
        .reduce((t, f) => t + f.montant, 0);
      const lignes = g.factures
        .map(
          (f) =>
            `<tr><td>${echapper(formatDateShortFR(f.date))}</td><td>${echapper(f.tiers)}</td><td>${echapper(f.description)}</td>` +
            `<td class="num">${f.type === TYPE_FACTURE.RECUE ? echapper(formatMontant(f.montant)) : ''}</td>` +
            `<td class="num">${f.type === TYPE_FACTURE.EMISE ? echapper(formatMontant(f.montant)) : ''}</td></tr>`,
        )
        .join('');
      return (
        `<tr class="groupe"><td colspan="5">${echapper(g.titre)}</td></tr>${lignes}` +
        `<tr class="total"><td colspan="3">${echapper(T.totalDuCompte)}</td><td class="num">${echapper(montant(debit))}</td><td class="num">${echapper(montant(credit))}</td></tr>`
      );
    })
    .join('');
  const c = TEXTES.export.colonnes;
  return (
    `<table><thead><tr><th>${echapper(c.date)}</th><th>${echapper(c.fournisseurClient)}</th><th>${echapper(c.note)}</th>` +
    `<th class="num">${echapper(T.debit)}</th><th class="num">${echapper(T.credit)}</th></tr></thead><tbody>${corps}</tbody></table>`
  );
}
