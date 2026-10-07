import type { Facture } from '@/features/comptabilite/types';
import type { BilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { compteDeFacture } from '@/features/export/services/lignesExport';
import { TYPE_ALIMENT, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { LABEL_TYPE_ALIMENT } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

export interface RecapCompte {
  numero: string;
  libelle: string;
  total: number;
  count: number;
}

/** Regroupe les factures par compte PCG (débit en négatif, crédit en positif), triées par n° de compte. */
export function recapParCompte(factures: Facture[]): RecapCompte[] {
  const parCompte = new Map<string, Omit<RecapCompte, 'numero'>>();
  for (const f of factures) {
    const compte = compteDeFacture(f);
    if (!compte) continue;
    const existant = parCompte.get(compte.numero) ?? { libelle: compte.libelle, total: 0, count: 0 };
    existant.total += f.type === TYPE_FACTURE.RECUE ? -f.montant : f.montant;
    existant.count += 1;
    parCompte.set(compte.numero, existant);
  }
  return Array.from(parCompte.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([numero, v]) => ({ numero, ...v }));
}

/**
 * Les factures rangées par n° de compte du plan comptable, puis par date (la plus ancienne d'abord) : celles qui n'ont pas de
 * compte viennent à la fin.
 */
export function facturesParCompteEtDate(factures: Facture[]): Facture[] {
  // Sans compte : après tous les autres (« ~ » vient après les chiffres).
  const numero = (f: Facture) => compteDeFacture(f)?.numero ?? '~';
  return [...factures].sort((a, b) => numero(a).localeCompare(numero(b)) || a.date.localeCompare(b.date));
}

/** Lignes du récapitulatif par compte ; `formaterSolde` adapte la valeur au format (nombre brut ou texte). */
export function lignesRecapCompte(recap: RecapCompte[], formaterSolde: (total: number) => string | number) {
  return recap.map((r) => ({
    [TEXTES.export.colonnes.nCompte]: r.numero,
    [TEXTES.export.colonnes.libelle]: r.libelle,
    [TEXTES.export.colonnes.nombreDeFactures]: r.count,
    [TEXTES.export.colonnes.soldeEur]: formaterSolde(r.total),
  }));
}

/** Une ligne par type d'aliment, puis le total hors « autre » ; `vide` remplace les valeurs absentes. */
export function lignesAlimentation(alimentation: BilanAlimentation, vide: string) {
  return [
    ...alimentation.lignes.map((ligne) => ({
      [TEXTES.export.colonnes.aliment]: ligne.libelle,
      [TEXTES.export.colonnes.montant]: ligne.montant,
      [TEXTES.export.colonnes.quantiteKg]: ligne.quantiteKg,
      [TEXTES.export.colonnes.kgParAnimal]: ligne.kgParAnimal ?? vide,
    })),
    {
      [TEXTES.export.colonnes.aliment]: LABEL_TYPE_ALIMENT[TYPE_ALIMENT.AUTRE],
      [TEXTES.export.colonnes.montant]: alimentation.autre.montant,
      [TEXTES.export.colonnes.quantiteKg]: alimentation.autre.quantiteKg,
      [TEXTES.export.colonnes.kgParAnimal]: vide,
    },
    {
      [TEXTES.export.colonnes.aliment]: TEXTES.commun.general.totalHorsAutre,
      [TEXTES.export.colonnes.montant]: alimentation.total,
      [TEXTES.export.colonnes.quantiteKg]: alimentation.totalKg,
      [TEXTES.export.colonnes.kgParAnimal]: vide,
    },
  ];
}
