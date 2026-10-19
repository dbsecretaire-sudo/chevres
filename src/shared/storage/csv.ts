import Papa from 'papaparse';
import type { Categorie, RecordMap } from '@/shared/storage/types';
import type { PieceJointe } from '@/features/fichiers/types';
import type { LigneAlimentation, LigneCarburant, LigneMarchandise } from '@/features/comptabilite/types';

import {
  CHAMPS_BOOLEEN,
  CHAMPS_BOOLEEN_TROIS_ETATS,
  CHAMPS_FICHIERS,
  CHAMPS_JSON,
  CHAMPS_LIGNES_ALIMENTATION,
  CHAMPS_LIGNES_CARBURANT,
  CHAMPS_LIGNES_MARCHANDISES,
  CHAMPS_NOMBRE,
  COLONNES_CSV,
  CSV_NON,
  CSV_OUI,
  EXTENSION_CSV,
  GENRE_EQUIPEMENT,
  GENRE_MATERIEL,
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
          // Le genre d'une ligne qui n'est pas un aliment : un matériel, ou un équipement consommable.
          l.materiel ? GENRE_MATERIEL : l.equipement ? GENRE_EQUIPEMENT : '',
          // Le cheptel concerné quand il diffère de celui de la facture (8e champ : absent des anciens fichiers).
          l.activite ?? '',
          // Une ligne offerte par le fournisseur (9e champ : absent des anciens fichiers).
          l.offert ? CSV_OUI : '',
        ].join(SEPARATEUR_CHAMPS),
      )
      .join(SEPARATEUR_LIGNES);
  }
  if (CHAMPS_LIGNES_MARCHANDISES.has(key)) {
    return (value as LigneMarchandise[])
      .map((l) =>
        // Le dernier champ : une ligne offerte par le fournisseur (absent des anciens fichiers).
        [proteger(l.marchandise), l.rubrique, l.quantite ?? '', l.unite ?? '', l.montant, l.offert ? CSV_OUI : ''].join(
          SEPARATEUR_CHAMPS,
        ),
      )
      .join(SEPARATEUR_LIGNES);
  }
  if (CHAMPS_JSON.has(key)) return JSON.stringify(value);
  if (CHAMPS_FICHIERS.has(key)) {
    return (value as PieceJointe[])
      .map((p) => [p.id, proteger(p.nom), p.extension, p.mime, p.ajoutLe].join(SEPARATEUR_CHAMPS))
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
        const [
          type,
          montant,
          quantiteKg,
          typeLibre,
          uniteConditionnement,
          nombreUnitesConditionnement,
          genre,
          activite,
          offert,
        ] = part.split(SEPARATEUR_CHAMPS);
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
          materiel: genre === GENRE_MATERIEL ? true : undefined,
          equipement: genre === GENRE_EQUIPEMENT ? true : undefined,
          activite: activite || undefined,
          offert: offert === CSV_OUI ? true : undefined,
        } as LigneAlimentation;
      })
      .filter((l): l is LigneAlimentation => !!l);
    return lignes.length > 0 ? lignes : undefined;
  }
  if (CHAMPS_LIGNES_MARCHANDISES.has(key)) {
    const lignes = raw
      .split(SEPARATEUR_LIGNES)
      .map((part) => {
        const [marchandise, rubrique, quantite, unite, montant, offert] = part.split(SEPARATEUR_CHAMPS);
        const n = Number(montant);
        if (!rubrique || !Number.isFinite(n)) return undefined;
        const q = Number(quantite);
        return {
          marchandise: marchandise ?? '',
          rubrique,
          quantite: quantite && Number.isFinite(q) ? q : undefined,
          unite: unite || undefined,
          montant: n,
          offert: offert === CSV_OUI ? true : undefined,
        } as LigneMarchandise;
      })
      .filter((l): l is LigneMarchandise => !!l);
    return lignes.length > 0 ? lignes : undefined;
  }
  if (CHAMPS_JSON.has(key)) {
    try {
      const valeur: unknown = JSON.parse(raw);
      // Une liste (non vide) ou un objet (la réservation d'un animal).
      if (Array.isArray(valeur)) return valeur.length > 0 ? valeur : undefined;
      return valeur && typeof valeur === 'object' ? valeur : undefined;
    } catch {
      return undefined;
    }
  }
  if (CHAMPS_FICHIERS.has(key)) {
    const pieces = raw
      .split(SEPARATEUR_LIGNES)
      .map((part) => {
        const [id, nom, extension, mime, ajoutLe] = part.split(SEPARATEUR_CHAMPS);
        return id && extension
          ? ({ id, nom: nom ?? '', extension, mime: mime ?? '', ajoutLe: ajoutLe ?? '' } as PieceJointe)
          : undefined;
      })
      .filter((p): p is PieceJointe => !!p);
    return pieces.length > 0 ? pieces : undefined;
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

/** Le nom du fichier qui réunit toutes les années d'une catégorie (« cheptel.csv »). */
export const fileNameForCategorie = (categorie: Categorie): string => `${categorie}${EXTENSION_CSV}`;

/**
 * Toutes les années d'une catégorie dans un seul fichier : une colonne « annee » dit de quelle année est chaque ligne (l'année ne se déduit pas
 * toujours de la ligne : c'est celle où l'enregistrement est rangé).
 */
export function toCSVParAnnees<C extends Categorie>(
  categorie: C,
  parAnnee: { annee: number; items: RecordMap[C][] }[],
): string {
  const columns = COLONNES_CSV[categorie];
  const rows = parAnnee.flatMap(({ annee, items }) =>
    items.map((item) => {
      const row: Record<string, string> = { annee: String(annee) };
      for (const col of columns) {
        row[col] = serializeValue(col, (item as unknown as Record<string, unknown>)[col]);
      }
      return row;
    }),
  );
  return Papa.unparse({ fields: ['annee', ...columns], data: rows });
}

/** Relit un fichier qui réunit toutes les années d'une catégorie : les lignes, rangées par année. */
export function fromCSVParAnnees<C extends Categorie>(categorie: C, csv: string): Map<number, RecordMap[C][]> {
  const columns = COLONNES_CSV[categorie];
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const parAnnee = new Map<number, RecordMap[C][]>();
  for (const row of parsed.data) {
    const annee = Number(row.annee);
    if (!row.id || !Number.isFinite(annee)) continue;
    const obj: Record<string, unknown> = {};
    for (const col of columns) obj[col] = deserializeValue(col, row[col] ?? '');
    parAnnee.set(annee, [...(parAnnee.get(annee) ?? []), obj as unknown as RecordMap[C]]);
  }
  return parAnnee;
}

export function fileNameFor(categorie: Categorie, annee: number): string {
  return `${categorie}_${annee}${EXTENSION_CSV}`;
}
