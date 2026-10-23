import { describe, expect, it } from 'vitest';
import { estSauvegardeComplete, etablissementDeLEntree, sommeDesCompteurs } from '@/features/sauvegarde/formatSauvegarde';

describe('sauvegarde de tous les établissements', () => {
  it('reconnaît une sauvegarde complète, pas l’ancien format', () => {
    expect(estSauvegardeComplete({ etablissements: [{ id: 'a', nom: 'Ferme', sauvegarde: { donnees: {} } }] })).toBe(true);
    expect(estSauvegardeComplete({ donnees: {} })).toBe(false);
    expect(estSauvegardeComplete({ etablissements: [] })).toBe(false);
    expect(estSauvegardeComplete({ etablissements: [{ id: 'a', nom: 'Ferme' }] })).toBe(false);
    expect(estSauvegardeComplete(null)).toBe(false);
  });

  it('retrouve l’établissement local par identifiant, puis par nom', () => {
    const locaux = [
      { id: 'defaut', nom: 'Mon exploitation' },
      { id: 'x1', nom: 'Gîte du Col' },
    ];
    expect(etablissementDeLEntree(locaux, { id: 'x1', nom: 'autre nom' })?.id).toBe('x1');
    expect(etablissementDeLEntree(locaux, { id: 'nouveau', nom: ' gîte du col ' })?.id).toBe('x1');
    expect(etablissementDeLEntree(locaux, { id: 'z', nom: 'Inconnu' })).toBeUndefined();
  });

  it('additionne les compteurs de chaque établissement', () => {
    const vide = { annule: false, animaux: 0, misAJour: 0 };
    const somme = sommeDesCompteurs(
      [
        { annule: false, animaux: 3, misAJour: 2 },
        { annule: false, animaux: 4, misAJour: 1 },
      ],
      vide,
    );
    expect(somme).toEqual({ annule: false, animaux: 7, misAJour: 3 });
  });
});
