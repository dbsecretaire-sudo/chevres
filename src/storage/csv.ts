import Papa from 'papaparse';
import type { Categorie, LigneAlimentation, LigneCarburant, RecordMap } from '@/types/models';

const COLUMNS: Record<Categorie, string[]> = {
  cheptel: [
    'id', 'numeroBoucle', 'dateBouclage', 'nom', 'sexe', 'dateNaissance',
    'mereId', 'mereNumeroBoucle', 'statut', 'dateStatut', 'renouvellement', 'renouvellementAnnee', 'notes',
  ],
  visites_veterinaire: ['id', 'date', 'chevreId', 'chevreNumeroBoucle', 'motif', 'description', 'cout'],
  factures: [
    'id', 'date', 'type', 'tiers', 'description', 'montant',
    'categorieDepense', 'lignesAlimentation', 'litrage', 'typeCarburant', 'lignesCarburant',
    'categorieRecette', 'imposable', 'typeAide', 'typeAideLibre', 'tauxImposition', 'compteManuel', 'tauxTva',
  ],
  ventes: ['id', 'date', 'categorie', 'typeFromage', 'typeFromageLibre', 'quantite', 'unite', 'prix', 'tauxTva', 'client', 'poidsKg'],
  controles: ['id', 'date', 'chevreId', 'chevreNumeroBoucle', 'type', 'resultat', 'notes'],
};

const NUMBER_FIELDS = new Set(['cout', 'montant', 'quantite', 'prix', 'litrage', 'tauxImposition', 'tauxTva', 'renouvellementAnnee', 'poidsKg']);
/** Booléens simples où "absent" et "faux" sont équivalents (pas besoin de distinguer). */
const BOOLEAN_FIELDS = new Set(['renouvellement']);
/** Booléens tri-état où "faux" doit être distingué de "non renseigné" (ex: imposable par défaut). */
const TRISTATE_BOOLEAN_FIELDS = new Set(['imposable']);
const LIGNES_ALIMENTATION_FIELDS = new Set(['lignesAlimentation']);
const LIGNES_CARBURANT_FIELDS = new Set(['lignesCarburant']);

function serializeValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return '';
  if (BOOLEAN_FIELDS.has(key)) return value ? 'oui' : '';
  if (TRISTATE_BOOLEAN_FIELDS.has(key)) return value ? 'oui' : 'non';
  if (LIGNES_ALIMENTATION_FIELDS.has(key)) {
    return (value as LigneAlimentation[])
      .map(
        (l) =>
          `${l.type}:${l.montant}:${l.quantiteKg ?? ''}:${l.typeLibre ?? ''}:${l.uniteConditionnement ?? ''}:${l.nombreUnitesConditionnement ?? ''}`,
      )
      .join('|');
  }
  if (LIGNES_CARBURANT_FIELDS.has(key)) {
    return (value as LigneCarburant[]).map((l) => `${l.type}:${l.montant}:${l.litrage ?? ''}`).join('|');
  }
  return String(value);
}

function deserializeValue(key: string, raw: string): unknown {
  if (raw === '') return undefined;
  if (BOOLEAN_FIELDS.has(key)) return raw === 'oui' ? true : undefined;
  if (TRISTATE_BOOLEAN_FIELDS.has(key)) return raw === 'oui';
  if (LIGNES_ALIMENTATION_FIELDS.has(key)) {
    const lignes = raw
      .split('|')
      .map((part) => {
        const [type, montant, quantiteKg, typeLibre, uniteConditionnement, nombreUnitesConditionnement] = part.split(':');
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
  if (LIGNES_CARBURANT_FIELDS.has(key)) {
    const lignes = raw
      .split('|')
      .map((part) => {
        const [type, montant, litrage] = part.split(':');
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
  if (NUMBER_FIELDS.has(key)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return raw;
}

export function toCSV<C extends Categorie>(categorie: C, items: RecordMap[C][]): string {
  const columns = COLUMNS[categorie];
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
  const columns = COLUMNS[categorie];
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
  return `${categorie}_${annee}.csv`;
}

export const CATEGORIES: Categorie[] = [
  'cheptel', 'ventes', 'factures', 'visites_veterinaire', 'controles',
];

export const CATEGORIE_LABELS: Record<Categorie, string> = {
  cheptel: 'Cheptel',
  ventes: 'Ventes',
  factures: 'Factures',
  visites_veterinaire: 'Visites vétérinaire',
  controles: 'Contrôles',
};
