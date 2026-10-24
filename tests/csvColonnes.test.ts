import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fromCSV, toCSV } from '@/shared/storage/csv';

/**
 * Les fichiers de Drive (CSV) n'écrivent que les colonnes qu'on leur a déclarées : un champ ajouté à un enregistrement sans colonne se perd à la synchronisation
 * (l'autre appareil ne le reçoit jamais, et « Récupérer » l'efface). Ce test relit les types et les colonnes pour que l'oubli se voie tout de suite.
 */
const LIRE = (chemin: string) => readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
const CSV = LIRE('src/shared/constants/csv.ts');

/** Les colonnes déclarées d'une catégorie. */
function colonnes(categorie: string): Set<string> {
  const debut = CSV.indexOf(`[CATEGORIE_STOCKAGE.${categorie}]: [`);
  const fin = CSV.indexOf('],', debut);
  return new Set([...CSV.slice(debut, fin).matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
}

/** Les champs de premier niveau d'une interface (le corps entre ses accolades, sans ce qui est imbriqué). */
function champs(fichier: string, nom: string): string[] {
  const source = LIRE(fichier);
  const a = source.indexOf(`export interface ${nom}`);
  if (a < 0) throw new Error(`${nom} introuvable dans ${fichier}`);
  let profondeur = 0;
  let j = source.indexOf('{', a);
  const i = j;
  for (; j < source.length; j++) {
    if (source[j] === '{') profondeur++;
    if (source[j] === '}' && --profondeur === 0) break;
  }
  const resultat: string[] = [];
  let niveau = 0;
  for (const ligne of source.slice(i + 1, j).split('\n')) {
    if (niveau === 0) {
      const m = ligne.match(/^\s{2}([a-zA-Z0-9_]+)\??:/);
      if (m) resultat.push(m[1]);
    }
    niveau = Math.max(0, niveau + (ligne.match(/[{(\[]/g) ?? []).length - (ligne.match(/[})\]]/g) ?? []).length);
  }
  return resultat;
}

/** Les champs qu'on n'enregistre jamais (propres au formulaire). */
const NON_ENREGISTRES: Record<string, string[]> = { FACTURES: ['cadeauMontant'] };

const CATEGORIES: [string, string, string][] = [
  ['CHEPTEL', 'src/features/cheptel/types.ts', 'Chevre'],
  ['VENTES', 'src/features/comptabilite/types.ts', 'Vente'],
  ['FACTURES', 'src/features/comptabilite/types.ts', 'Facture'],
  ['VISITES_VETERINAIRE', 'src/features/sante/types.ts', 'VisiteVeterinaire'],
  ['TRAITEMENTS', 'src/features/sante/types.ts', 'Traitement'],
  ['CONTROLES', 'src/features/exploitation/types.ts', 'Controle'],
];

describe('fichiers de Drive : chaque champ enregistré a sa colonne', () => {
  for (const [categorie, fichier, nom] of CATEGORIES) {
    it(`${nom} : aucun champ sans colonne`, () => {
      const declarees = colonnes(categorie);
      const manquants = champs(fichier, nom).filter((c) => !declarees.has(c) && !(NON_ENREGISTRES[categorie] ?? []).includes(c));
      expect(manquants, `colonnes à ajouter pour ${nom} (shared/constants/csv.ts)`).toEqual([]);
    });
  }
});

describe('fichiers de Drive : les dossiers des tiers font l’aller-retour', () => {
  it('l’entrée d’un contact garde ses dossiers, son lien avec la fiche et ses contenus', () => {
    const entree = {
      id: 'e1',
      famille: 'groupement',
      date: '2026-03-01',
      type: 'AXA',
      fournisseurId: 'f42',
      dossiers: [
        { id: 'd1', nom: 'MON AUTO' },
        { id: 'd2', nom: 'Contrats', parentId: 'd1', touristique: true },
      ],
      contenus: [{ id: 'c1', titre: 'Contrat 2026', dossierId: 'd1' }],
    } as never;
    const [relue] = fromCSV('controles', toCSV('controles', [entree])) as unknown as Record<string, unknown>[];
    expect(relue.fournisseurId).toBe('f42');
    expect(relue.dossiers).toEqual([
      { id: 'd1', nom: 'MON AUTO' },
      { id: 'd2', nom: 'Contrats', parentId: 'd1', touristique: true },
    ]);
    expect(relue.contenus).toHaveLength(1);
  });

  it('un client partenaire garde aussi son lien', () => {
    const [relue] = fromCSV('controles', toCSV('controles', [{ id: 'e2', date: '2026-03-01', type: 'x', clientId: 'c7' } as never])) as unknown as Record<string, unknown>[];
    expect(relue.clientId).toBe('c7');
  });
});

describe('fichiers de Drive : une dépense d’assurance garde ce qu’elle couvre', () => {
  it('l’objet, le véhicule, le motif, le volet, le lot et la catégorie ajoutée', () => {
    const facture = {
      id: 'f1',
      date: '2026-03-01',
      type: 'recue',
      tiers: 'AXA',
      description: 'Contrat',
      montant: 120,
      objetAssurance: 'vehicule',
      vehiculeId: 'v1',
      motif: 'accident',
      voletCooperative: 'achats',
      lotId: 'l1',
      categoriePerso: 'Cotisations syndicales',
      lignesVeterinaire: [{ id: 'x', acte: 'vaccin' }],
    } as never;
    const [relue] = fromCSV('factures', toCSV('factures', [facture])) as unknown as Record<string, unknown>[];
    expect(relue).toMatchObject({
      objetAssurance: 'vehicule',
      vehiculeId: 'v1',
      motif: 'accident',
      voletCooperative: 'achats',
      lotId: 'l1',
      categoriePerso: 'Cotisations syndicales',
    });
    expect(relue.lignesVeterinaire).toEqual([{ id: 'x', acte: 'vaccin' }]);
  });

  it('une vente garde son lot et ce qui est offert', () => {
    const vente = { id: 'v1', date: '2026-03-01', categorie: 'viande', quantite: 1, unite: 'piece', prix: 0, tauxTva: 10, lotId: 'l9', cadeauProduit: true, cadeauFrais: true } as never;
    const [relue] = fromCSV('ventes', toCSV('ventes', [vente])) as unknown as Record<string, unknown>[];
    expect(relue).toMatchObject({ lotId: 'l9', cadeauProduit: true, cadeauFrais: true });
  });
});
