import { describe, expect, it } from 'vitest';
import { detaillerSaisie, libelleZone, resumerSaisie } from '@/features/administration/services/resumeSaisie';

const CHEPTEL = 'troupeau:v1:data:cheptel:2026';

const chevre = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  sexe: 'femelle',
  dateNaissance: '2026-03-01',
  statut: 'vivante',
  ...extra,
});

describe('libelleZone', () => {
  it('nomme le cheptel par son année', () => {
    expect(libelleZone(CHEPTEL)).toBe('Cheptel 2026');
  });
  it('garde une zone inconnue lisible', () => {
    expect(libelleZone('troupeau:v1:data:fromages:2026')).toBe('fromages · 2026');
  });
});

describe('resumerSaisie : le cheptel', () => {
  it('compte une naissance avec sa date', () => {
    const actuel = [chevre('a')];
    const nouveau = [chevre('a'), chevre('b', { dateNaissance: '2026-11-10' })];
    expect(resumerSaisie(CHEPTEL, actuel, nouveau)).toEqual(['1 naissance (le 10/11/2026)']);
  });

  it('compte plusieurs naissances sans date', () => {
    const actuel = [chevre('a')];
    const nouveau = [chevre('a'), chevre('b'), chevre('c')];
    expect(resumerSaisie(CHEPTEL, actuel, nouveau)).toEqual(['2 naissances']);
  });

  it('distingue un achat (date d’entrée) d’une naissance', () => {
    const actuel = [chevre('a')];
    const nouveau = [chevre('a'), chevre('b', { dateEntree: '2026-11-10' })];
    expect(resumerSaisie(CHEPTEL, actuel, nouveau)).toEqual(['1 entrée (achat)']);
  });

  it('compte une sortie par statut', () => {
    const actuel = [chevre('a'), chevre('b')];
    const nouveau = [chevre('a', { statut: 'morte', dateStatut: '2026-11-10' }), chevre('b')];
    expect(resumerSaisie(CHEPTEL, actuel, nouveau)).toEqual(['1 sortie (morte)']);
  });

  it('dit qu’une fiche d’animal a seulement changé', () => {
    const actuel = [chevre('a')];
    const nouveau = [chevre('a', { notes: 'boiterie' })];
    expect(resumerSaisie(CHEPTEL, actuel, nouveau)).toEqual(['1 animal modifié']);
  });

  it('signale un animal supprimé de la liste', () => {
    const actuel = [chevre('a'), chevre('b')];
    const nouveau = [chevre('a')];
    expect(resumerSaisie(CHEPTEL, actuel, nouveau)).toEqual(['1 animal supprimé']);
  });
});

describe('resumerSaisie : les autres listes', () => {
  it('compte un nouveau fromage comme un élément ajouté', () => {
    const actuel = [{ id: 'f1', nom: 'Tomme' }];
    const nouveau = [{ id: 'f1', nom: 'Tomme' }, { id: 'f2', nom: 'Brousse' }];
    expect(resumerSaisie('troupeau:v1:data:fromages:2026', actuel, nouveau)).toEqual(['1 élément ajouté']);
  });

  it('compte les éléments modifiés et supprimés', () => {
    const actuel = [{ id: 'f1', nom: 'Tomme' }, { id: 'f2', nom: 'Brousse' }];
    const nouveau = [{ id: 'f1', nom: 'Tomme affinée' }];
    expect(resumerSaisie('troupeau:v1:data:fromages:2026', actuel, nouveau)).toEqual([
      '1 élément modifié',
      '1 élément supprimé',
    ]);
  });
});

describe('resumerSaisie : les fiches qui ne sont pas des listes', () => {
  it('annonce une nouvelle fiche quand il n’y en avait pas', () => {
    expect(resumerSaisie('troupeau:v1:data:settings', null, { nom: 'x' })).toEqual(['Nouvelle fiche']);
  });

  it('annonce une fiche modifiée', () => {
    expect(resumerSaisie('troupeau:v1:data:settings', { a: 1 }, { a: 2 })).toEqual(['Fiche modifiée']);
  });

  it('dit quand rien ne change', () => {
    const liste = [chevre('a')];
    expect(resumerSaisie(CHEPTEL, liste, liste)).toEqual(['Aucune modification']);
  });
});

describe('detaillerSaisie', () => {
  it('montre tous les champs d’un animal ajouté, en français', () => {
    const blocs = detaillerSaisie(
      [chevre('a')],
      [chevre('a'), chevre('b', { numeroBoucle: 'FR123', dateNaissance: '2026-11-10', sexe: 'F', espece: 'chevres', aCompleter: true })],
    );
    expect(blocs).toHaveLength(1);
    expect(blocs[0].titre).toBe('Ajouté : FR123');
    expect(blocs[0].champs).toContainEqual({ nom: 'Date de naissance', apres: '10/11/2026' });
    expect(blocs[0].champs).toContainEqual({ nom: 'Sexe', apres: 'Femelle' });
    expect(blocs[0].champs).toContainEqual({ nom: 'Espèce', apres: 'Chèvres' });
    expect(blocs[0].champs).toContainEqual({ nom: 'À compléter', apres: 'Oui' });
    expect(blocs[0].champs.find((c) => c.nom === 'id')).toBeUndefined();
  });

  it('montre avant et après les champs modifiés seulement, en français', () => {
    const blocs = detaillerSaisie([chevre('a', { nom: 'Mimi' })], [chevre('a', { nom: 'Mimi', notes: 'boiterie', statut: 'morte' })]);
    expect(blocs[0].titre).toBe('Modifié : Mimi');
    expect(blocs[0].champs).toEqual([
      { nom: 'Statut', avant: 'Vivante', apres: 'Morte' },
      { nom: 'Notes', avant: '—', apres: 'boiterie' },
    ]);
  });

  it('montre une fiche qui n’est pas une liste, champ par champ', () => {
    const blocs = detaillerSaisie({ a: 1, b: 'x' }, { a: 2, b: 'x' });
    expect(blocs).toEqual([{ titre: 'Fiche', champs: [{ nom: 'A', avant: '1', apres: '2' }] }]);
  });

  it('ne montre pas les références techniques ni les noms anglais', () => {
    const blocs = detaillerSaisie(null, { id: 'z', mereId: '390f', mereNumeroBoucle: '30005' });
    expect(blocs).toEqual([{ titre: 'Nouvelle fiche', champs: [{ nom: 'Boucle de la mère', apres: '30005' }] }]);
  });
});
