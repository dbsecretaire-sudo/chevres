import { beforeEach, describe, expect, it } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Facture } from '@/features/comptabilite/types';
import {
  categoriesDeLOrganisation,
  coordonneesClient,
  estClientPartenaire,
  facturesDuClient,
  choixApresCoche,
  estCategoriePartenaire,
  estPartenaire,
  facturesPartenaire,
  naturesDuPartenaire,
  planifierPartenaires,
  sectionDuPartenaire,
} from '@/features/exploitation/services/partenaires';
import { CHOIX_PARTENAIRES_VIDE, choixLu } from '@/features/exploitation/repository/partenaires';
import type { Client } from '@/features/clients/types';
import type { Controle } from '@/features/exploitation/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

const fournisseur = (id: string, nomEntreprise: string, categorie?: string): Fournisseur =>
  ({ id, nom: '', nomEntreprise, siret: '', adressePostale: '', categorie }) as unknown as Fournisseur;

const atm = fournisseur('atm', 'ATM', CATEGORIE_FOURNISSEUR.EQUARRISSAGE);
const msa = fournisseur('msa', 'MSA', CATEGORIE_FOURNISSEUR.ORGANISME);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('catégories de partenaires', () => {
  it('les catégories d’office sont des partenaires, pas les autres', () => {
    for (const c of [
      CATEGORIE_FOURNISSEUR.EQUARRISSAGE,
      CATEGORIE_FOURNISSEUR.ORGANISME,
      CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE,
      CATEGORIE_FOURNISSEUR.ASSUREUR,
    ])
      expect(estCategoriePartenaire(c, CHOIX_PARTENAIRES_VIDE)).toBe(true);
    expect(estCategoriePartenaire(CATEGORIE_FOURNISSEUR.GARAGE, CHOIX_PARTENAIRES_VIDE)).toBe(false);
  });

  it('une catégorie ajoutée est incluse, une catégorie retirée est exclue', () => {
    const ajoute = choixApresCoche(CHOIX_PARTENAIRES_VIDE, CATEGORIE_FOURNISSEUR.GARAGE, true);
    expect(estCategoriePartenaire(CATEGORIE_FOURNISSEUR.GARAGE, ajoute)).toBe(true);
    const retire = choixApresCoche(CHOIX_PARTENAIRES_VIDE, CATEGORIE_FOURNISSEUR.ORGANISME, false);
    expect(estCategoriePartenaire(CATEGORIE_FOURNISSEUR.ORGANISME, retire)).toBe(false);
    // Recocher une catégorie d'office efface l'écart : le choix d'office ne se note pas.
    expect(choixApresCoche(retire, CATEGORIE_FOURNISSEUR.ORGANISME, true)).toEqual(CHOIX_PARTENAIRES_VIDE);
  });

  it('le choix lu d’un stockage abîmé est vide', () => {
    expect(choixLu(undefined)).toEqual(CHOIX_PARTENAIRES_VIDE);
    expect(choixLu({ categoriesAjoutees: 'oups', categoriesRetirees: [1, 'a'] })).toEqual({
      categoriesAjoutees: [],
      categoriesRetirees: ['a'],
    });
  });

  it('un fournisseur est partenaire d’après sa catégorie', () => {
    expect(estPartenaire(atm, CHOIX_PARTENAIRES_VIDE)).toBe(true);
    expect(estPartenaire(fournisseur('g', 'Garage', CATEGORIE_FOURNISSEUR.GARAGE), CHOIX_PARTENAIRES_VIDE)).toBe(false);
  });
});

describe('sections et natures', () => {
  it('range chaque partenaire dans sa section, avec ses natures de contenu', () => {
    expect(sectionDuPartenaire(undefined)).toBe('groupements');
    expect(sectionDuPartenaire(atm)).toBe('equarrisseurs');
    expect(sectionDuPartenaire(msa)).toBe('organismes');
    expect(sectionDuPartenaire(fournisseur('a', 'Groupama', CATEGORIE_FOURNISSEUR.ASSUREUR))).toBe('assureurs');
    expect(naturesDuPartenaire(atm)).toContain('contrat');
    expect(naturesDuPartenaire(atm)).not.toContain('achat_groupe');
    expect(naturesDuPartenaire(undefined)).toContain('achat_groupe');
    // Chaque section propose le courrier / courriel.
    for (const f of [undefined, atm, msa]) expect(naturesDuPartenaire(f)).toContain('courrier_courriel');
  });
});

describe('factures d’un partenaire', () => {
  const recue = (plus: Partial<Facture>): Facture =>
    ({ id: 'f', date: '2026-02-01', type: 'recue', tiers: 'Autre', description: '', montant: 0, ...plus }) as unknown as Facture;

  it('reprend les lignes d’équarrissage des factures de la Chambre, avec le montant de ces lignes seulement', () => {
    const chambre = recue({
      id: 'ch1',
      tiers: 'Chambre d’agriculture',
      montant: 300,
      lignesChambre: [
        { libelle: 'Forfait conseil', montant: 100 },
        { libelle: 'Équarrissage ATM', montant: 200 },
      ],
    } as never);
    const resultat = facturesPartenaire(atm, [chambre], true, 'Équarrissage (Chambre)', 'Facture');
    expect(resultat).toEqual([{ id: 'ch1', description: 'Équarrissage (Chambre)', date: '2026-02-01', montant: 200 }]);
  });

  it('avec plusieurs équarrisseurs, une ligne non liée n’est à aucun d’eux', () => {
    const chambre = recue({
      id: 'ch2',
      tiers: 'Chambre',
      lignesChambre: [{ libelle: 'Équarrissage', montant: 50 }],
    } as never);
    expect(facturesPartenaire(atm, [chambre], false, 'x', 'Facture')).toEqual([]);
  });

  it('une ligne liée à un équarrisseur lui revient, même avec plusieurs', () => {
    const chambre = recue({
      id: 'ch3',
      tiers: 'Chambre',
      lignesChambre: [{ libelle: 'Équarrissage', montant: 50, equarrisseurId: 'atm' }],
    } as never);
    expect(facturesPartenaire(atm, [chambre], false, 'x', 'Facture')).toHaveLength(1);
    expect(facturesPartenaire(fournisseur('autre', 'Autre', CATEGORIE_FOURNISSEUR.EQUARRISSAGE), [chambre], false, 'x', 'Facture')).toEqual([]);
  });
});

describe('clients partenaires et catégories fusionnées', () => {
  it('une catégorie qui existe pour les fournisseurs et les clients n’a qu’une ligne, sans les particuliers', () => {
    const lignes = categoriesDeLOrganisation(
      [{ id: 'organisme', nom: 'Organisme' }, { id: 'groupement', nom: 'Groupement' }, { id: 'banque', nom: 'Banque' }],
      [{ id: 'particulier', nom: 'Particulier' }, { id: 'organisme', nom: 'Organisme' }, { id: 'groupement', nom: 'Groupement' }, { id: 'entreprise', nom: 'Entreprise' }],
    );
    expect(lignes.map((l) => l.id)).toEqual(['organisme', 'groupement', 'banque', 'entreprise']);
  });

  it('un client est partenaire quand sa catégorie est incluse, jamais un particulier', () => {
    const choix = choixApresCoche(choixApresCoche(CHOIX_PARTENAIRES_VIDE, 'entreprise', true), 'particulier', true);
    expect(estClientPartenaire({ categorie: 'entreprise' }, choix)).toBe(true);
    expect(estClientPartenaire({ categorie: 'recolteur' }, choix)).toBe(false);
    expect(estClientPartenaire({ categorie: 'particulier' }, choix)).toBe(false);
    expect(estClientPartenaire({ categorie: undefined }, choix)).toBe(false);
  });

  it('range un client dans sa section : groupement, organisme ou clients', () => {
    const client = (categorie: string) => ({ id: 'c', nom: 'X', categorie }) as never;
    expect(sectionDuPartenaire(undefined, client('groupement'))).toBe('groupements');
    expect(sectionDuPartenaire(undefined, client('organisme'))).toBe('organismes');
    expect(sectionDuPartenaire(undefined, client('entreprise'))).toBe('clients');
    expect(naturesDuPartenaire(undefined, client('entreprise'))).toContain('courrier_courriel');
  });

  it('les factures d’un client sont celles qu’on lui a émises, de la plus récente à la plus ancienne', () => {
    const emise = (id: string, tiers: string, date: string, montant: number) =>
      ({ id, type: 'emise', tiers, date, montant, description: '' }) as never;
    const factures = [emise('a', 'Dupont Anne', '2026-01-01', 10), emise('b', 'dupont anne', '2026-03-01', 20), emise('c', 'Autre', '2026-02-01', 5)];
    const res = facturesDuClient({ id: 'c', nom: 'Dupont', prenom: 'Anne' } as never, factures, 'Facture');
    expect(res.map((f) => f.id)).toEqual(['b', 'a']);
    const adresse = ['1 rue', '20000 Ajaccio'].join(String.fromCharCode(10));
    expect(coordonneesClient({ id: 'c', nom: 'D', telephone: '0601', adressePostale: adresse } as never)).toEqual([
      '0601',
      '1 rue, 20000 Ajaccio',
    ]);
  });
});

describe('un fournisseur et un client de même nom', () => {
  const chambre = fournisseur('f1', 'Chambre d’agriculture', CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE);
  const chambreClient = {
    id: 'c1',
    nom: 'Chambre d’agriculture',
    categorie: 'organisme',
  } as unknown as Client;
  const entree = (id: string, extra: Partial<Controle>): Controle =>
    ({ id, chevreId: 'x', famille: 'groupement', date: '2026-01-01', type: 'Chambre d’agriculture', ...extra }) as Controle;
  const contenu = (id: string) => ({ id, titre: id, date: '2026-01-02' }) as never;

  it('n’ont qu’une entrée, créée avec les deux fiches', () => {
    const plan = planifierPartenaires([chambre], [chambreClient], [], CHOIX_PARTENAIRES_VIDE, '2026-02-01');
    expect(plan.aSupprimer).toEqual([]);
    expect(plan.aEnregistrer).toHaveLength(1);
    expect(plan.aEnregistrer[0]).toMatchObject({ fournisseurId: 'f1', clientId: 'c1' });
  });

  it('les deux entrées déjà créées sont fusionnées, leurs contenus réunis', () => {
    const controles = [
      entree('e1', { fournisseurId: 'f1', contenus: [contenu('a')] }),
      entree('e2', { clientId: 'c1', contenus: [contenu('b'), contenu('a')] }),
    ];
    const plan = planifierPartenaires([chambre], [chambreClient], controles, CHOIX_PARTENAIRES_VIDE, '2026-02-01');
    expect(plan.aSupprimer).toEqual(['e2']);
    expect(plan.aEnregistrer).toHaveLength(1);
    expect(plan.aEnregistrer[0]).toMatchObject({ id: 'e1', fournisseurId: 'f1', clientId: 'c1' });
    expect(plan.aEnregistrer[0].contenus?.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('l’entrée du client seul devient celle du fournisseur', () => {
    const controles = [entree('e2', { clientId: 'c1', contenus: [contenu('b')] })];
    const plan = planifierPartenaires([chambre], [chambreClient], controles, CHOIX_PARTENAIRES_VIDE, '2026-02-01');
    expect(plan.aSupprimer).toEqual([]);
    expect(plan.aEnregistrer).toHaveLength(1);
    expect(plan.aEnregistrer[0]).toMatchObject({ id: 'e2', fournisseurId: 'f1', clientId: 'c1' });
  });

  it('des noms différents restent deux partenaires', () => {
    const autre = { ...chambreClient, id: 'c2', nom: 'Chambre de Corse' } as Client;
    const plan = planifierPartenaires([chambre], [autre], [], CHOIX_PARTENAIRES_VIDE, '2026-02-01');
    expect(plan.aEnregistrer).toHaveLength(2);
  });
});

describe('fiche fournisseur', () => {
  it('le contact, le SIRET et l’adresse sont facultatifs, l’entreprise reste requise', async () => {
    const { nettoyerFournisseur } = await import('@/features/fournisseurs/services/resumeFournisseur');
    const messages = { entreprise: 'Entreprise requise' };
    const sansSiret = nettoyerFournisseur(
      { id: 'f', nom: ' Dupont ', nomEntreprise: ' Chambre ', siret: '  ', adressePostale: '' },
      messages,
    );
    expect('fournisseur' in sansSiret && sansSiret.fournisseur).toMatchObject({
      nom: 'Dupont',
      nomEntreprise: 'Chambre',
      siret: '',
      adressePostale: '',
    });
    expect(nettoyerFournisseur({ id: 'f', nom: '', nomEntreprise: ' ', siret: '', adressePostale: '' }, messages)).toEqual({
      erreur: 'Entreprise requise',
    });
  });
});

describe('un contact lié à ses deux fiches', () => {
  it('n’a qu’une entrée même si les noms de ses fiches diffèrent', () => {
    const f = { ...fournisseur('f1', 'MSA', CATEGORIE_FOURNISSEUR.ORGANISME), clientId: 'c1' } as Fournisseur;
    const c = { id: 'c1', nom: 'MSA de Corse', categorie: 'organisme', fournisseurId: 'f1' } as unknown as Client;
    const plan = planifierPartenaires([f], [c], [], CHOIX_PARTENAIRES_VIDE, '2026-02-01');
    expect(plan.aEnregistrer).toHaveLength(1);
    expect(plan.aEnregistrer[0]).toMatchObject({ fournisseurId: 'f1', clientId: 'c1', type: 'MSA' });
  });
});
