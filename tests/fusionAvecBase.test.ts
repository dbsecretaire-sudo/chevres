import { describe, expect, it } from 'vitest';
import { empreintesDe, fusionner, type RapportFusion } from '@/features/drive/fusion';

const rapport = (): RapportFusion => ({ ajoutes: 0, conflits: 0 });
const ids = (v: unknown) => (v as { id: string }[]).map((x) => x.id);

describe('fusion avec l’état de la dernière synchronisation', () => {
  const avant = [
    { id: 'e1', tiers: 'Garage', montant: 100 },
    { id: 'e2', tiers: 'Coop', montant: 50 },
  ];
  const base = empreintesDe(avant);

  it('un élément supprimé ici et resté tel quel sur Drive est supprimé aussi', () => {
    const r = rapport();
    const fusion = fusionner([avant[0]], avant, r, base);
    expect(ids(fusion)).toEqual(['e1']);
    expect(r.supprimes).toBe(1);
    expect(r.ajoutes).toBe(0);
  });

  it('un élément supprimé sur Drive et resté tel quel ici est supprimé aussi', () => {
    expect(ids(fusionner(avant, [avant[0]], rapport(), base))).toEqual(['e1']);
  });

  it('un élément supprimé d’un côté mais modifié de l’autre est gardé (la modification est plus récente)', () => {
    const modifie = { id: 'e2', tiers: 'Coop', montant: 60 };
    expect(ids(fusionner([avant[0]], [avant[0], modifie], rapport(), base))).toEqual(['e1', 'e2']);
    expect(ids(fusionner([avant[0], modifie], [avant[0]], rapport(), base))).toEqual(['e1', 'e2']);
  });

  it('un élément nouveau d’un côté arrive toujours', () => {
    const r = rapport();
    expect(ids(fusionner(avant, [...avant, { id: 'e3', tiers: 'Boucher', montant: 30 }], r, base))).toEqual(['e1', 'e2', 'e3']);
    expect(r.ajoutes).toBe(1);
  });

  it('un élément modifié d’un seul côté prend la version modifiée, d’où qu’elle vienne', () => {
    const modifie = { id: 'e1', tiers: 'Garage', montant: 120 };
    expect(fusionner(avant, [modifie, avant[1]], rapport(), base)).toEqual([modifie, avant[1]]);
    expect(fusionner([modifie, avant[1]], avant, rapport(), base)).toEqual([modifie, avant[1]]);
  });

  it('sans base, une suppression ne se propage pas (comme avant)', () => {
    expect(ids(fusionner([avant[0]], avant, rapport()))).toEqual(['e1', 'e2']);
  });
});

describe('les articles d’une facture (des lignes sans identifiant)', () => {
  const facture = (lignes: { libelle: string; montant: number }[]) => [{ id: 'f1', tiers: 'Chambre', lignesChambre: lignes }];
  const ancienne = facture([
    { libelle: 'Équarrissage ATM 2026', montant: 442.07 },
    { libelle: 'Forfait', montant: 20 },
  ]);
  const base = empreintesDe(ancienne);

  it('une ligne renommée ici remplace l’ancienne au lieu de s’y ajouter', () => {
    const renommee = facture([
      { libelle: 'Équarrissage ATM 2026 — corrigé', montant: 442.07 },
      { libelle: 'Forfait', montant: 20 },
    ]);
    const fusion = fusionner(renommee, ancienne, rapport(), base) as { lignesChambre: unknown[] }[];
    expect(fusion[0].lignesChambre).toEqual(renommee[0].lignesChambre);
  });

  it('une ligne retirée ici n’est pas remise par Drive', () => {
    const sansForfait = facture([{ libelle: 'Équarrissage ATM 2026', montant: 442.07 }]);
    const fusion = fusionner(sansForfait, ancienne, rapport(), base) as { lignesChambre: unknown[] }[];
    expect(fusion[0].lignesChambre).toHaveLength(1);
  });

  it('une ligne ajoutée sur Drive arrive ici', () => {
    const plus = facture([...ancienne[0].lignesChambre, { libelle: 'Conseil', montant: 15 }]);
    const fusion = fusionner(ancienne, plus, rapport(), base) as { lignesChambre: unknown[] }[];
    expect(fusion[0].lignesChambre).toHaveLength(3);
  });

  it('un élément qu’un fichier CSV rend avec des champs vides ou en texte reste le même', () => {
    const viaCsv = [{ id: 'f1', tiers: 'Chambre', description: '', lignesChambre: [{ libelle: 'Équarrissage ATM 2026', montant: '442.07' }, { libelle: 'Forfait', montant: '20' }] }];
    expect(empreintesDe(viaCsv)).toEqual(base);
  });
});
