import Papa from 'papaparse';
import type { Categorie, RecordMap } from '@/shared/storage/types';
import type { LigneAlimentation, LigneCarburant, LigneMarchandise } from '@/features/comptabilite/types';

import {
  CHAMPS_BOOLEEN,
  CHAMPS_BOOLEEN_TROIS_ETATS,
  CHAMPS_LIGNES_ALIMENTATION,
  CHAMPS_LIGNES_CARBURANT,
  CHAMPS_LIGNES_MARCHANDISES,
  CHAMPS_NOMBRE,
  COLONNES_CSV,
  CSV_NON,
  CSV_OUI,
  EXTENSION_CSV,
  SEPARATEUR_CHAMPS,
  SEPARATEUR_LIGNES,
} from '@/shared/constants/csv';

/** Un texte libre dans une ligne : les séparateurs du fichier y sont remplacés par une espace (ils casseraient la ligne). */
const proteger = (texte: string): string => texte.replace(/[|:]/g, ' ');

function serializeValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return '';
  if (CHAMPS_BOOLEEN.has(key)) return value ? CSV_OUI : '';
  if (CHAMPS_BOOLEEN_TROIS_ETATS.has(key)) return value ? CSV_OUI : CSV_NON;
  if (CHAMPS_LIGNES_ALIMENTATION.has(key)) {
    return (value as LigneAlimentation[])
      .map((l) =>
        [
          l.type,
          l.montant,
          l.quantiteKg ?? '',
          proteger(l.typeLibre ?? ''),
          l.uniteConditionnement ?? '',
          l.nombreUnitesConditionnement ?? '',
        ].join(SEPARATEUR_CHAMPS),
      )
      .join(SEPARATEUR_LIGNES);
  }
  if (CHAMPS_LIGNES_MARCHANDISES.has(key)) {
    return (value as LigneMarchandise[])
      .map((l) =>
        [proteger(l.marchandise), l.rubrique, l.quantite ?? '', l.unite ?? '', l.montant].join(
          SEPARATEUR_CHAMPS,
        ),
      )
      .join(SEPARATEUR_LIGNES);
  }
  if (CHAMPS_LIGNES_CARBURANT.has(key)) {
    return (value as LigneCarburant[])
      .map((l) => [l.type, l.montant, l.litrage ?? ''].join(SEPARATEUR_CHAMPS))
      .join(SEPARATEUR_LIGNES);
  }
  return String(value);
}

function deserializeValue(key: string, raw: string): unknown {
  if (raw === '') return undefined;
  if (CHAMPS_BOOLEEN.has(key)) return raw === CSV_OUI ? true : undefined;
  if (CHAMPS_BOOLEEN_TROIS_ETATS.has(key)) return raw === CSV_OUI;
  if (CHAMPS_LIGNES_ALIMENTATION.has(key)) {
    const lignes = raw
      .split(SEPARATEUR_LIGNES)
      .map((part) => {
        const [type, montant, quantiteKg, typeLibre, uniteConditionnement, nombreUnitesConditionnement] =
          part.split(SEPARATEUR_CHAMPS);
        const n = Number(montant);
        if (!type || !Number.isFinite(n)) return undefined;
        const kg = Number(quantiteKg);
        const nombreUnites = Number(nombreUnitesConditionnement);
        return {
          type,
          montant: n,
          quantiteKg: quantiteKg && Number.isFinite(kg) ? kg : undefined,
          typeLibre: typeLibre || undefined,
          uniteConditionnement: uniteConditionnement || undefined,
          nombreUnitesConditionnement:
            nombreUnitesConditionnement && Number.isFinite(nombreUnites) ? nombreUnites : undefined,
        } as LigneAlimentation;
      })
      .filter((l): l is LigneAlimentation => !!l);
    return lignes.length > 0 ? lignes : undefined;
  }
  if (CHAMPS_LIGNES_MARCHANDISES.has(key)) {
    const lignes = raw
      .split(SEPARATEUR_LIGNES)
      .map((part) => {
        const [marchandise, rubrique, quantite, unite, montant] = part.split(SEPARATEUR_CHAMPS);
        const n = Number(montant);
        if (!rubrique || !Number.isFinite(n)) return undefined;
        const q = Number(quantite);
        return {
          marchandise: marchandise ?? '',
          rubrique,
          quantite: quantite && Number.isFinite(q) ? q : undefined,
          unite: unite || undefined,
          montant: n,
        } as LigneMarchandise;
      })
      .filter((l): l is LigneMarchandise => !!l);
    return lignes.length > 0 ? lignes : undefined;
  }
  if (CHAMPS_LIGNES_CARBURANT.has(key)) {
    const lignes = raw
      .split(SEPARATEUR_LIGNES)
      .map((part) => {
        const [type, montant, litrage] = part.split(SEPARATEUR_CHAMPS);
        const n = Number(montant);
        if (!type || !Number.isFinite(n)) return undefined;
        const l = Number(litrage);
        return {
          type,
          montant: n,
          litrage: litrage && Number.isFinite(l) ? l : undefined,
        } as LigneCarburant;
      })
      .filter((l): l is LigneCarburant => !!l);
    return lignes.length > 0 ? lignes : undefined;
  }
  if (CHAMPS_NOMBRE.has(key)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return raw;
}

export function toCSV<C extends Categorie>(categorie: C, items: RecordMap[C][]): string {
  const columns = COLONNES_CSV[categorie];
  const rows = items.map((item) => {
    const row: Record<string, string> = {};
    for (const col of columns) {
      row[col] = serializeValue(col, (item as unknown as Record<string, unknown>)[col]);
    }
    return row;
  });
  return Papa.unparse({ fields: columns, data: rows });
}

export function fromCSV<C extends Categorie>(categorie: C, csv: string): RecordMap[C][] {
  const columns = COLONNES_CSV[categorie];
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return parsed.data
    .filter((row) => row.id)
    .map((row) => {
      const obj: Record<string, unknown> = {};
      for (const col of columns) {
        obj[col] = deserializeValue(col, row[col] ?? '');
      }
      return obj as unknown as RecordMap[C];
    });
}

export function fileNameFor(categorie: Categorie, annee: number): string {
  return `${categorie}_${annee}${EXTENSION_CSV}`;
}
