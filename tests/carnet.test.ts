import { numerosDeBoucles, repartirEnColonnes } from '@/features/cheptel/utils/numerosBoucles';
import { describe, expect, it } from 'vitest';
import type { Facture } from '@/features/comptabilite/types';
import { lignesVeterinaireRetenues } from '@/features/comptabilite/forms/lignesVeterinaire';
import { bouclesDeLaVisite, lignesDuCarnet, pagesDuCarnet } from '@/features/sante/services/carnetSanitaire';
import type { VisiteVeterinaire } from '@/features/sante/types';
import { carnetHtml, tailleDuTexte } from '@/features/export/documents/carnetSanitairePdf';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';

const facture = (plus: Partial<Facture>): Facture =>
  ({
    id: 'f1',
    date: '2026-08-26',
    type: 'recue',
    tiers: 'OMNIA VET',
    description: '',
    montant: 309.14,
    categorieDepense: CATEGORIE_DEPENSE.VETERINAIRE,
    activite: 'chevres',
    ...plus,
  }) as unknown as Facture;

const visite = (plus: Partial<VisiteVeterinaire>): VisiteVeterinaire =>
  ({ id: 'v1', date: '2026-08-26', motif: 'Prophylaxie', ...plus }) as VisiteVeterinaire;

describe('lignes d’une facture vétérinaire', () => {
  it('garde les actes écrits et retire les champs vides', () => {
    const retenues = lignesVeterinaireRetenues({
      categorieDepense: CATEGORIE_DEPENSE.VETERINAIRE,
      lignesVeterinaire: [
        { id: 'a', libelle: '  Prise de sang ', animal: ' ', dose: '2 mL' },
        { id: 'b', libelle: '   ' },
      ],
    });
    expect(retenues).toEqual([
      {
        id: 'a',
        libelle: 'Prise de sang',
        animal: undefined,
        ordonnance: undefined,
        dateDebut: undefined,
        dateFin: undefined,
        voie: undefined,
        dose: '2 mL',
        rythme: undefined,
        remiseEnVente: undefined,
        observations: undefined,
      },
    ]);
  });

  it('rien pour une autre dépense, ni sans acte', () => {
    expect(lignesVeterinaireRetenues({ categorieDepense: CATEGORIE_DEPENSE.AUTRE, lignesVeterinaire: [{ id: 'a', libelle: 'x' }] })).toBeUndefined();
    expect(lignesVeterinaireRetenues({ categorieDepense: CATEGORIE_DEPENSE.VETERINAIRE, lignesVeterinaire: [] })).toBeUndefined();
  });
});

describe('carnet sanitaire', () => {
  it('une ligne par acte de la facture, avec le vétérinaire comme intervenant', () => {
    const lignes = lignesDuCarnet(
      [
        facture({
          lignesVeterinaire: [
            { id: 'a', libelle: 'Prise de sang', animal: '12345', voie: 'sous-cutanée', dose: '2 mL', rythme: 'une fois', remiseEnVente: '2026-09-02', observations: 'Prophylaxie' },
            { id: 'b', libelle: 'Bilan sanitaire' },
          ],
        }),
      ],
      [],
      'chevres',
    );
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toMatchObject({ animal: '12345', voie: 'sous-cutanée', remise: '2026-09-02', medicament: 'Prise de sang', motif: 'Prophylaxie', intervenant: 'OMNIA VET' });
    expect(lignes[1].animal).toBe('');
  });

  it('une visite dont la facture est détaillée ne compte qu’une fois', () => {
    const f = facture({ lignesVeterinaire: [{ id: 'a', libelle: 'Vaccin' }] });
    const lignes = lignesDuCarnet([f], [visite({ factureId: 'f1' })], 'chevres');
    expect(lignes).toHaveLength(1);
    expect(lignes[0].medicament).toBe('Vaccin');
  });

  it('une visite sans détail figure avec son motif', () => {
    const lignes = lignesDuCarnet([facture({})], [visite({ factureId: 'f1' }), visite({ id: 'v2', date: '2026-01-10', motif: 'Écho' })], 'chevres');
    expect(lignes.map((l) => l.motif)).toEqual(['Écho', 'Prophylaxie']);
    expect(lignes[1].intervenant).toBe('OMNIA VET');
  });

  it('une ligne par animal quand la visite en concerne plusieurs', () => {
    const lignes = lignesDuCarnet([], [visite({ chevreNumeroBoucle: '00462, 00464 10005' })], 'chevres');
    expect(lignes.map((l) => l.animal)).toEqual(['00462', '00464', '10005']);
    expect(new Set(lignes.map((l) => l.motif))).toEqual(new Set(['Prophylaxie']));
  });

  it('un acte de facture sur plusieurs animaux : une ligne chacun ; un lot reste d’une pièce', () => {
    const lignes = lignesDuCarnet(
      [facture({ lignesVeterinaire: [{ id: 'a', libelle: 'Vaccin', animal: '123, 456' }, { id: 'b', libelle: 'Soin', animal: 'Lot 60 chèvres' }] })],
      [],
      'chevres',
    );
    expect(lignes.map((l) => l.animal)).toEqual(['123', '456', 'Lot 60 chèvres']);
  });

  it('ignore les dépenses d’une autre espèce et les autres catégories', () => {
    const lignes = lignesDuCarnet(
      [
        facture({ id: 'x', activite: 'brebis', lignesVeterinaire: [{ id: 'a', libelle: 'Autre espèce' }] }),
        facture({ id: 'y', categorieDepense: CATEGORIE_DEPENSE.AUTRE, lignesVeterinaire: [{ id: 'b', libelle: 'Pas vétérinaire' }] }),
      ],
      [],
      'chevres',
    );
    expect(lignes).toEqual([]);
  });

  it('range les lignes en pages de neuf, avec des lignes vides pour finir', () => {
    expect(pagesDuCarnet([])).toHaveLength(1);
    const dix = Array.from({ length: 10 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}` })) as never[];
    const pages = pagesDuCarnet(dix);
    expect(pages).toHaveLength(2);
    expect(pages[0].filter(Boolean)).toHaveLength(9);
    expect(pages[1].filter(Boolean)).toHaveLength(1);
    expect(pages[1]).toHaveLength(9);
  });

  it('neuf lignes sur chaque page, quelle que soit la longueur des textes', () => {
    const longue = { date: '2026-01-01', animal: 'x'.repeat(80), ordonnance: '', motif: 'y'.repeat(500), intervenant: 'OMNIA VET' } as never;
    const pages = pagesDuCarnet(Array.from({ length: 20 }, () => longue));
    expect(pages).toHaveLength(3);
    for (const page of pages) expect(page).toHaveLength(9);
  });

  it('un texte long s’écrit plus petit dans sa case', () => {
    expect(tailleDuTexte('court', 40, 4)).toBe('');
    expect(tailleDuTexte('y'.repeat(170), 40, 4)).toBe('t2');
    expect(tailleDuTexte('y'.repeat(400), 40, 4)).toBe('t3');
  });

  it('chaque page est une feuille entière en paysage, avec ses neuf lignes', () => {
    const lignes = Array.from({ length: 20 }, (_, i) => ({ date: '2026-01-01', animal: String(i), ordonnance: '', debut: '', fin: '', medicament: '', voie: '', dose: '', rythme: '', remise: '', motif: '', intervenant: '' }));
    const html = carnetHtml(lignes, 'Chèvres', '20213003');
    expect(html).toContain('@page { size: A4 landscape; margin: 0; }');
    expect(html.split('<section class="page">')).toHaveLength(4);
    expect(html.split('<tr class="entree">')).toHaveLength(3 * 9 + 1);
    for (const n of [1, 2, 3]) expect(html).toContain('PAGE N° ' + n);
  });

  describe('boucles proposées pour les actes de la visite', () => {
    const animal = (numeroBoucle: string, plus: Record<string, string> = {}) =>
      ({ numeroBoucle, dateNaissance: '2020-01-01', statut: 'vivante', ...plus }) as never;
    const jour = '2026-08-26';

    it('celles des animaux présents ce jour-là et contrôlés ce jour-là, par ordre croissant', () => {
      const animaux = [
        animal('20002'),
        animal('00462'),
        animal('10005'),
        animal('30001', { dateNaissance: '2027-01-01' }),
        animal('40001', { statut: 'abattoir', dateStatut: '2026-03-01' }),
        animal('50001', { statut: 'vendue', dateStatut: '2026-09-15' }),
        animal('60001'),
      ];
      const visites = [
        { date: jour, chevreNumeroBoucle: '50001, 20002, 00462 10005 30001 40001 99999' },
        { date: '2025-01-01', chevreNumeroBoucle: '60001' },
      ] as never[];
      // 30001 n'est pas encore né, 40001 est parti avant, 99999 n'est pas au cheptel, 60001 n'a pas été contrôlé ce jour-là ;
      // 50001, vendue après la visite, était bien là.
      expect(bouclesDeLaVisite(jour, animaux, visites)).toEqual(['00462', '10005', '20002', '50001']);
    });

    it('sans visite ce jour-là, ou sans boucle dans la visite, aucune boucle : les numéros s’ajoutent d’abord à la visite', () => {
      const animaux = [animal('10'), animal('9')];
      expect(bouclesDeLaVisite(jour, animaux, [])).toEqual([]);
      expect(bouclesDeLaVisite(jour, animaux, [{ date: jour, chevreNumeroBoucle: '' }] as never[])).toEqual([]);
      expect(bouclesDeLaVisite(jour, animaux, [{ date: jour, chevreNumeroBoucle: '10' }] as never[])).toEqual(['10']);
    });
  });

  it('les boucles d’une visite se répartissent en cinq colonnes qui se lisent de haut en bas', () => {
    const numeros = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const colonnes = repartirEnColonnes(numeros);
    expect(colonnes).toHaveLength(5);
    expect(colonnes[0]).toEqual(['1', '2', '3']);
    expect(colonnes[3]).toEqual(['10', '11', '12']);
    expect(colonnes[4]).toEqual([]);
    expect(colonnes.flat()).toEqual(numeros);
    expect(repartirEnColonnes([])).toEqual([[], [], [], [], []]);
    expect(numerosDeBoucles('10001, 10006 20002;30001')).toHaveLength(4);
  });
});
