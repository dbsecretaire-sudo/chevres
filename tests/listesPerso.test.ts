import { describe, expect, it } from 'vitest';
import {
  avecChoixAjoute,
  avecChoixMasque,
  avecChoixRenomme,
  avecCompteDuChoix,
  choixProposes,
  identifiantDuNouveauChoix,
  nomDuChoix,
  sansChoixAjoute,
} from '@/features/settings/services/listesPerso';

const BASE = [
  { id: 'batiments', nom: 'Bâtiments' },
  { id: 'animaux', nom: 'Animaux' },
  { id: 'vehicule', nom: 'Véhicule' },
];

describe('listes de choix personnalisables', () => {
  it('sans changement, les choix d’office tels quels', () => {
    expect(choixProposes(BASE, undefined).map((c) => c.nom)).toEqual(['Bâtiments', 'Animaux', 'Véhicule']);
  });

  it('un choix ajouté arrive après ceux d’office, avec son compte', () => {
    const perso = avecChoixAjoute(undefined, 'Matériel agricole', '616000');
    const choix = choixProposes(BASE, perso);
    expect(choix.at(-1)).toMatchObject({ nom: 'Matériel agricole', perso: true, compte: '616000' });
    expect(choix.at(-1)?.id.startsWith('perso:')).toBe(true);
  });

  it('un nom vide n’ajoute rien, un nom déjà pris reçoit un numéro', () => {
    expect(avecChoixAjoute(undefined, '   ').ajoutes ?? []).toHaveLength(0);
    const deux = avecChoixAjoute(avecChoixAjoute(undefined, 'Cave'), 'Cave');
    expect(new Set(deux.ajoutes?.map((a) => a.id)).size).toBe(2);
    expect(identifiantDuNouveauChoix('Été & Hiver !', [])).toBe('perso:ete_hiver');
  });

  it('renomme un choix d’office et rend son nom d’origine avec un nom vide', () => {
    const renomme = avecChoixRenomme(undefined, 'animaux', 'Cheptel');
    expect(choixProposes(BASE, renomme)[1].nom).toBe('Cheptel');
    expect(nomDuChoix('animaux', BASE, renomme)).toBe('Cheptel');
    expect(choixProposes(BASE, avecChoixRenomme(renomme, 'animaux', ''))[1].nom).toBe('Animaux');
  });

  it('renomme un choix ajouté et change son compte', () => {
    const ajoute = avecChoixAjoute(undefined, 'Cave', '616000');
    const id = ajoute.ajoutes![0].id;
    const change = avecCompteDuChoix(avecChoixRenomme(ajoute, id, 'Cave à fromages'), id, '615000');
    expect(change.ajoutes![0]).toMatchObject({ nom: 'Cave à fromages', compte: '615000' });
  });

  it('masque un choix d’office, sauf celui déjà choisi dans une écriture', () => {
    const masque = avecChoixMasque(undefined, 'animaux', true);
    expect(choixProposes(BASE, masque).map((c) => c.id)).toEqual(['batiments', 'vehicule']);
    expect(choixProposes(BASE, masque, ['animaux']).map((c) => c.id)).toContain('animaux');
    expect(choixProposes(BASE, avecChoixMasque(masque, 'animaux', false)).map((c) => c.id)).toContain('animaux');
  });

  it('retire un choix ajouté ; le nom d’un choix inconnu se lit dans son identifiant', () => {
    const ajoute = avecChoixAjoute(undefined, 'Cave');
    expect(sansChoixAjoute(ajoute, ajoute.ajoutes![0].id).ajoutes).toEqual([]);
    expect(nomDuChoix('perso:cave', BASE, undefined)).toBe('cave');
    expect(nomDuChoix('autre', BASE, undefined)).toBe('autre');
  });
});

describe('masquer un choix ajouté', () => {
  it('la case décochée masque aussi un choix de l’utilisateur', () => {
    const ajoute = avecChoixAjoute(undefined, 'Cave');
    const id = ajoute.ajoutes![0].id;
    const masque = avecChoixMasque(ajoute, id, true);
    expect(choixProposes(BASE, masque).some((c) => c.id === id)).toBe(false);
    expect(choixProposes(BASE, masque, [id]).some((c) => c.id === id)).toBe(true);
  });
});
