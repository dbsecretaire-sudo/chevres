import { describe, expect, it } from 'vitest';
import type { Client } from '@/features/clients/types';
import type { Facture, Vente } from '@/features/comptabilite/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import type { Contact } from '@/features/contacts/services/contacts';
import {
  balanceDuContact,
  categorieDuContact,
  categoriesDuContact,
  ecrituresDuContact,
  elementsDuContact,
  fichesDuFormulaire,
  FORMULAIRE_CONTACT_VIDE,
  formulaireDuContact,
  listesAvecCategorie,
} from '@/features/contacts/services/fiche';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';

const client = (extra: Partial<Client> = {}): Client => ({ id: 'c1', nom: 'Chambre d’agriculture', ...extra });
const fournisseur = (extra: Partial<Fournisseur> = {}): Fournisseur => ({
  id: 'f1',
  nom: 'Sandrine Ventura',
  nomEntreprise: 'Chambre d’agriculture',
  siret: '93164182300014',
  adressePostale: 'LD Petraolo',
  ...extra,
});
const contact = (c?: Client, f?: Fournisseur): Contact => ({ cle: (c ?? f)!.id, nom: 'Chambre d’agriculture', client: c, fournisseur: f });
const facture = (extra: Partial<Facture>): Facture =>
  ({ id: 'x', date: '2024-01-01', montant: 100, tiers: 'Chambre d’agriculture', type: TYPE_FACTURE.RECUE, description: 'balance', ...extra }) as Facture;

describe('catégorie d’un contact', () => {
  it('une seule catégorie quand les deux fiches sont d’accord ou qu’une seule en a une', () => {
    expect(categorieDuContact(contact(client({ categorie: 'organisme' }), fournisseur({ categorie: 'organisme' })))).toEqual({
      id: 'organisme',
    });
    expect(categorieDuContact(contact(client(), fournisseur({ categorie: 'organisme' })))).toEqual({ id: 'organisme' });
    expect(categorieDuContact(contact(client(), fournisseur()))).toEqual({ id: undefined });
  });

  it('deux catégories différentes sont un conflit à trancher', () => {
    const c = contact(client({ categorie: 'organisme' }), fournisseur({ categorie: 'chambre_agriculture' }));
    expect(categorieDuContact(c)).toEqual({ conflit: { client: 'organisme', fournisseur: 'chambre_agriculture' } });
  });

  it('une catégorie retirée des réglages ne compte pas', () => {
    const c = contact(client({ categorie: 'disparue' }), fournisseur({ categorie: 'organisme' }));
    expect(categorieDuContact(c, { client: ['organisme'], fournisseur: ['organisme'] })).toEqual({ id: 'organisme' });
  });

  it('la liste à choisir réunit les deux listes, une ligne par identifiant', () => {
    expect(
      categoriesDuContact(
        [{ id: 'organisme', nom: 'Organisme' }, { id: 'garage', nom: 'Garage' }],
        [{ id: 'organisme', nom: 'Organisme (client)' }, { id: 'particulier', nom: 'Particulier' }],
      ).map((c) => c.id),
    ).toEqual(['organisme', 'garage', 'particulier']);
  });

  it('la catégorie choisie est ajoutée à la liste qui ne la connaissait pas', () => {
    const l = listesAvecCategorie(
      { id: 'garage', nom: 'Garage' },
      [{ id: 'particulier', nom: 'Particulier', declaree: false, prixLibre: false }],
      [{ id: 'garage', nom: 'Garage' }],
    );
    expect(l.modifiees).toBe(true);
    expect(l.clients.map((c) => c.id)).toEqual(['particulier', 'garage']);
    expect(l.fournisseurs).toHaveLength(1);
    expect(
      listesAvecCategorie({ id: 'garage', nom: 'Garage' }, l.clients, l.fournisseurs).modifiees,
    ).toBe(false);
  });
});

describe('écritures et balance d’un contact', () => {
  it('réunit les recettes (+) et les dépenses (−), sans compter deux fois une même facture', () => {
    const c = contact(client(), fournisseur());
    const factures = [
      facture({ id: 'a', type: TYPE_FACTURE.EMISE, categorieRecette: CATEGORIE_RECETTE.AIDE, montant: 500, date: '2024-03-01' }),
      facture({ id: 'b', montant: 200, date: '2024-02-01' }),
      // Un remboursement : facture reçue du même nom, déjà comptée du côté client.
      facture({ id: 'r', montant: 50, categorieDepense: CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT, date: '2024-01-15' }),
      facture({ id: 'autre', tiers: 'Autre', montant: 999 }),
    ];
    const ecritures = ecrituresDuContact(c, [] as Vente[], factures);
    expect(ecritures.map((e) => [e.id, e.montant])).toEqual([
      ['a', 500],
      ['b', -200],
      ['r', -50],
    ]);
    expect(balanceDuContact(ecritures)).toBe(250);
  });

  it('un contact client seul ou fournisseur seul a ses seules écritures', () => {
    const factures = [facture({ id: 'b', montant: 200 })];
    expect(ecrituresDuContact(contact(client()), [], factures)).toEqual([]);
    expect(ecrituresDuContact(contact(undefined, fournisseur()), [], factures).map((e) => e.montant)).toEqual([-200]);
  });
});

describe('formulaire d’un contact', () => {
  it('reprend les champs communs, et le SIRET/RIB du côté fournisseur', () => {
    const form = formulaireDuContact(
      contact(client({ email: 'a@b.fr' }), fournisseur({ rib: 'FR76', telephone: '04' })),
    );
    expect(form).toMatchObject({
      nom: 'Chambre d’agriculture',
      personne: 'Sandrine Ventura',
      recettes: true,
      depenses: true,
      siret: '93164182300014',
      rib: 'FR76',
      email: 'a@b.fr',
      telephone: '04',
      adressePostale: 'LD Petraolo',
    });
  });

  it('un nom non modifié laisse à chaque fiche le sien', () => {
    const c = contact(client({ nom: 'MSA de Corse' }), fournisseur({ nomEntreprise: 'MSA' }));
    const fiches = fichesDuFormulaire({ ...formulaireDuContact(c), adressePostale: '1 rue' }, c);
    expect(fiches.client?.nom).toBe('MSA de Corse');
    expect(fiches.fournisseur?.nomEntreprise).toBe('MSA');
    expect(fiches.client?.adressePostale).toBe('1 rue');
    expect(fiches.fournisseur?.adressePostale).toBe('1 rue');
    expect(fiches.client?.id).toBe('c1');
    expect(fiches.fournisseur?.id).toBe('f1');
  });

  it('un nom modifié passe aux deux fiches', () => {
    const c = contact(client(), fournisseur());
    const fiches = fichesDuFormulaire({ ...formulaireDuContact(c), nom: 'Chambre de Corse' }, c);
    expect(fiches.client?.nom).toBe('Chambre de Corse');
    expect(fiches.fournisseur?.nomEntreprise).toBe('Chambre de Corse');
  });

  it('seule la case cochée donne une fiche, et la catégorie vaut pour les deux', () => {
    const f = fichesDuFormulaire({ ...FORMULAIRE_CONTACT_VIDE, nom: 'Dupont', recettes: true, depenses: true, categorie: 'organisme' });
    expect(f.client).toMatchObject({ nom: 'Dupont', categorie: 'organisme' });
    expect(f.fournisseur).toMatchObject({ nomEntreprise: 'Dupont', categorie: 'organisme', siret: '', adressePostale: '' });
    const seul = fichesDuFormulaire({ ...FORMULAIRE_CONTACT_VIDE, nom: 'Dupont', recettes: false, depenses: true });
    expect(seul.client).toBeUndefined();
    expect(seul.fournisseur?.nomEntreprise).toBe('Dupont');
  });

  it('la personne à contacter va au fournisseur (nom) et au client (contact)', () => {
    const f = fichesDuFormulaire({ ...FORMULAIRE_CONTACT_VIDE, nom: 'X', personne: 'Anne Martin', recettes: true, depenses: true });
    expect(f.fournisseur?.nom).toBe('Anne Martin');
    expect(f.client?.contact).toBe('Anne Martin');
  });
});

describe('éléments liés à un contact', () => {
  const piece = { id: 'p', nom: 'a.pdf', extension: 'pdf', mime: 'application/pdf', ajoutLe: '2024-01-01' };
  const entree = (id: string, extra: Record<string, unknown>) =>
    ({ id, chevreId: 'x', famille: 'groupement', date: '2024-01-01', type: 'Chambre', ...extra }) as never;

  it('réunit les contenus de son entrée Partenaires et ceux de son dossier, du plus récent au plus ancien', () => {
    const c = contact(client(), fournisseur());
    const controles = [
      entree('e1', {
        fournisseurId: 'f1',
        contenus: [
          { id: 'a', titre: 'Aide 2024', date: '2024-05-01', fichiers: [piece] },
          { id: 'b', titre: 'Courrier', date: '2024-03-01' },
        ],
      }),
      entree('e2', { fournisseurId: 'autre', contenus: [{ id: 'z', titre: 'Pas lui', date: '2024-09-01' }] }),
    ];
    const archive = {
      sousDossiers: [],
      elements: [
        { id: 'd1', clientId: 'c1', dossierId: 's', titre: 'Note', date: '2024-04-01' },
        { id: 'd2', clientId: 'autre', dossierId: 's', titre: 'Pas lui', date: '2024-04-02' },
      ],
    };
    const liste = elementsDuContact(c, controles, archive);
    expect(liste.map((x) => x.titre)).toEqual(['Aide 2024', 'Note', 'Courrier']);
    expect(liste.filter((x) => x.fichiers > 0).map((x) => x.titre)).toEqual(['Aide 2024']);
    expect(liste[0]).toMatchObject({ origine: 'partenaire', groupementId: 'e1', contenuId: 'a' });
    expect(liste[1]).toMatchObject({ origine: 'dossier', elementId: 'd1' });
  });

  it('une entrée liée à la fiche client compte aussi, et un contact sans client n’a pas de dossier', () => {
    const controles = [entree('e3', { clientId: 'c1', contenus: [{ id: 'k', titre: 'Note', date: '2024-01-02' }] })];
    expect(elementsDuContact(contact(client()), controles, { sousDossiers: [], elements: [] })).toHaveLength(1);
    const archive = { sousDossiers: [], elements: [{ id: 'd1', clientId: 'c1', dossierId: 's', titre: 'N', date: '2024-01-01' }] };
    expect(elementsDuContact(contact(undefined, fournisseur()), [], archive)).toEqual([]);
  });
});
