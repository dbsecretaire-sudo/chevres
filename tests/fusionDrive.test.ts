import { describe, expect, it } from 'vitest';
import { fusionner, type RapportFusion } from '@/features/drive/fusion';

const rapport = (): RapportFusion => ({ ajoutes: 0, conflits: 0 });

describe('fusion des données de deux appareils', () => {
  it('les éléments à identifiant des deux côtés s’additionnent', () => {
    const r = rapport();
    const fusion = fusionner(
      [{ id: 'a', montant: 10 }, { id: 'b', montant: 20 }],
      [{ id: 'b', montant: 20 }, { id: 'c', montant: 30 }],
      r,
    ) as { id: string }[];
    expect(fusion.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(r).toEqual({ ajoutes: 1, conflits: 0 });
  });

  it('un élément modifié des deux côtés garde ce que chacun a de plus ; sur une valeur différente, le local l’emporte', () => {
    const r = rapport();
    const fusion = fusionner(
      [{ id: 'a', tiers: 'Garage', montant: 100 }],
      [{ id: 'a', tiers: 'Garage Martin', montant: 100, motif: 'freins' }],
      r,
    ) as Record<string, unknown>[];
    expect(fusion).toEqual([{ id: 'a', tiers: 'Garage', montant: 100, motif: 'freins' }]);
    expect(r.conflits).toBe(1);
  });

  it('un champ vide d’un côté vient de l’autre, et un champ vide ne vient pas effacer une valeur', () => {
    expect(fusionner({ a: '', b: 'x', c: 3 }, { a: 'y', b: '', c: 3 })).toEqual({ a: 'y', b: 'x', c: 3 });
  });

  it('les listes de textes se réunissent sans doublon, dans l’ordre du local d’abord', () => {
    expect(fusionner({ vues: ['x', 'y'] }, { vues: ['y', 'z'] })).toEqual({ vues: ['x', 'y', 'z'] });
  });

  it('les tableaux d’objets sans identifiant ne sont pas dupliqués', () => {
    const fusion = fusionner([{ nom: 'a' }], [{ nom: 'a' }, { nom: 'b' }]) as unknown[];
    expect(fusion).toHaveLength(2);
  });

  it('les objets se fusionnent champ par champ, en profondeur (un stock : mouvements, prix, noms)', () => {
    const local = { mouvements: [{ id: 'm1', delta: 2 }], prix: { 'fromage:frais': 8 }, noms: { x: 'A' } };
    const distant = { mouvements: [{ id: 'm2', delta: -1 }], prix: { 'fromage:frais': 9, 'fromage:crottin': 5 }, noms: { y: 'B' } };
    const r = rapport();
    expect(fusionner(local, distant, r)).toEqual({
      mouvements: [
        { id: 'm1', delta: 2 },
        { id: 'm2', delta: -1 },
      ],
      prix: { 'fromage:frais': 8, 'fromage:crottin': 5 },
      noms: { x: 'A', y: 'B' },
    });
    expect(r).toEqual({ ajoutes: 1, conflits: 1 });
  });

  it('sans l’un des deux côtés, l’autre reste tel quel', () => {
    expect(fusionner(undefined, [{ id: 'a' }])).toEqual([{ id: 'a' }]);
    expect(fusionner([{ id: 'a' }], undefined)).toEqual([{ id: 'a' }]);
  });
});

describe('deux appareils qui ont travaillé chacun de leur côté', () => {
  const idsTries = (v: unknown) => (v as { id: string }[]).map((x) => x.id).sort();
  const appareilA = [
    { id: 'e1', tiers: 'Garage', montant: 100 },
    { id: 'e2', tiers: 'Coop', montant: 50 },
    { id: 'a1', tiers: 'Vétérinaire', montant: 80 },
  ];
  const appareilB = [
    { id: 'e1', tiers: 'Garage', montant: 100 },
    { id: 'e2', tiers: 'Coop', montant: 50 },
    { id: 'b1', tiers: 'Boucher', montant: 30 },
  ];

  it('fusionner dans un sens ou dans l’autre donne les mêmes écritures', () => {
    expect(idsTries(fusionner(appareilA, appareilB))).toEqual(['a1', 'b1', 'e1', 'e2']);
    expect(idsTries(fusionner(appareilB, appareilA))).toEqual(['a1', 'b1', 'e1', 'e2']);
  });

  it('une seconde fusion ne change plus rien (aucun doublon, aucun ajout)', () => {
    const premiere = fusionner(appareilA, appareilB);
    const r = rapport();
    const seconde = fusionner(premiere, appareilB, r);
    expect(seconde).toEqual(premiere);
    expect(r.ajoutes).toBe(0);
  });

  it('une écriture supprimée sur un seul appareil revient à la fusion (une suppression ne se propage pas)', () => {
    const apresSuppression = appareilA.filter((x) => x.id !== 'e2');
    expect(idsTries(fusionner(apresSuppression, appareilB))).toContain('e2');
  });

  it('une écriture modifiée des deux côtés garde la valeur de l’appareil qui fusionne, et le dit', () => {
    const r = rapport();
    const a = [{ id: 'e1', montant: 120 }];
    const b = [{ id: 'e1', montant: 90 }];
    expect(fusionner(a, b, r)).toEqual([{ id: 'e1', montant: 120 }]);
    expect(r.conflits).toBe(1);
  });

  it('un établissement entier absent d’un côté arrive tel quel', () => {
    expect(fusionner(undefined, { nom: 'Gîte', animaux: ['chevres'] })).toEqual({ nom: 'Gîte', animaux: ['chevres'] });
  });
});

describe('listes de choix personnalisées (réglages de l’exploitation)', () => {
  const telephone = { listesPerso: { circuitsVente: { ajoutes: [{ id: 'perso:gare', nom: 'Vente en gare' }], masques: ['marche'], renommes: { ferme: 'Boutique' } } } };
  const ordinateur = { listesPerso: { circuitsVente: { ajoutes: [{ id: 'perso:cave', nom: 'Cave' }], masques: ['panier'], renommes: { ferme: 'Vente directe' } } } };

  it('les choix ajoutés et les choix masqués des deux appareils se réunissent', () => {
    const r = fusionner(ordinateur, telephone) as typeof telephone;
    const liste = r.listesPerso.circuitsVente;
    expect(liste.ajoutes.map((a) => a.id).sort()).toEqual(['perso:cave', 'perso:gare']);
    expect(liste.masques.sort()).toEqual(['marche', 'panier']);
  });

  it('un renommage différent des deux côtés : celui de l’appareil qui fusionne reste', () => {
    const r = fusionner(ordinateur, telephone) as typeof telephone;
    expect(r.listesPerso.circuitsVente.renommes.ferme).toBe('Vente directe');
  });

  it('un choix démasqué sur un seul appareil redevient masqué à la fusion (une suppression ne se propage pas)', () => {
    const demasque = { listesPerso: { circuitsVente: { masques: [] as string[] } } };
    const r = fusionner(demasque, telephone) as typeof telephone;
    expect(r.listesPerso.circuitsVente.masques).toContain('marche');
  });
});
