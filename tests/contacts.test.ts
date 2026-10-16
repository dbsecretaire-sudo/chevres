import { describe, expect, it } from 'vitest';
import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import {
  construireContacts,
  contactDe,
  coordonneesAPartager,
  liensAEnregistrer,
} from '@/features/contacts/services/contacts';

const client = (id: string, nom: string, extra: Partial<Client> = {}): Client => ({ id, nom, ...extra });
const fournisseur = (id: string, nomEntreprise: string, extra: Partial<Fournisseur> = {}): Fournisseur => ({
  id,
  nom: 'Contact',
  nomEntreprise,
  siret: '',
  adressePostale: '',
  ...extra,
});

describe('contacts', () => {
  it('un client et un fournisseur de même nom ne font qu’un contact', () => {
    const contacts = construireContacts(
      [client('c1', 'Chambre d’agriculture'), client('c2', 'Dupont')],
      [fournisseur('f1', ' chambre d’agriculture '), fournisseur('f2', 'ATM')],
    );
    expect(contacts.map((c) => c.nom)).toEqual(['ATM', 'Chambre d’agriculture', 'Dupont']);
    const chambre = contacts.find((c) => c.nom === 'Chambre d’agriculture');
    expect(chambre?.client?.id).toBe('c1');
    expect(chambre?.fournisseur?.id).toBe('f1');
    expect(contacts.find((c) => c.nom === 'Dupont')?.fournisseur).toBeUndefined();
    expect(contacts.find((c) => c.nom === 'ATM')?.client).toBeUndefined();
  });

  it('deux fiches liées restent un contact même si leurs noms diffèrent', () => {
    const contacts = construireContacts(
      [client('c1', 'MSA de Corse', { fournisseurId: 'f1' })],
      [fournisseur('f1', 'MSA')],
    );
    expect(contacts).toHaveLength(1);
    expect(contacts[0].client?.id).toBe('c1');
    expect(contacts[0].fournisseur?.id).toBe('f1');
  });

  it('le lien posé sur la fiche fournisseur suffit aussi', () => {
    const contacts = construireContacts([client('c1', 'MSA de Corse')], [fournisseur('f1', 'MSA', { clientId: 'c1' })]);
    expect(contacts).toHaveLength(1);
  });

  it('un lien vers une fiche supprimée est ignoré', () => {
    const contacts = construireContacts([client('c1', 'Dupont', { fournisseurId: 'absent' })], [fournisseur('f1', 'ATM')]);
    expect(contacts).toHaveLength(2);
  });

  it('un lien explicite l’emporte sur le même nom', () => {
    const contacts = construireContacts(
      [client('c1', 'ATM'), client('c2', 'Autre', { fournisseurId: 'f1' })],
      [fournisseur('f1', 'ATM')],
    );
    expect(contactDe('f1', [client('c1', 'ATM'), client('c2', 'Autre', { fournisseurId: 'f1' })], [fournisseur('f1', 'ATM')])?.client?.id).toBe('c2');
    expect(contacts).toHaveLength(2);
  });

  it('contactDe retrouve le contact depuis l’une ou l’autre fiche', () => {
    const clients = [client('c1', 'Chambre')];
    const fournisseurs = [fournisseur('f1', 'Chambre')];
    expect(contactDe('c1', clients, fournisseurs)?.fournisseur?.id).toBe('f1');
    expect(contactDe('f1', clients, fournisseurs)?.client?.id).toBe('c1');
    expect(contactDe('x', clients, fournisseurs)).toBeUndefined();
  });

  it('liensAEnregistrer ne rend que les paires pas encore liées des deux côtés', () => {
    const liens = liensAEnregistrer(
      [client('c1', 'Chambre'), client('c2', 'MSA', { fournisseurId: 'f2' })],
      [fournisseur('f1', 'Chambre'), fournisseur('f2', 'MSA', { clientId: 'c2' })],
    );
    expect(liens.map((l) => [l.client.id, l.fournisseur.id])).toEqual([['c1', 'f1']]);
  });
});

describe('fiches d’un même contact', () => {
  it('seules les coordonnées remplies se partagent', () => {
    expect(coordonneesAPartager({ adressePostale: ' 1 rue ', telephone: '', email: undefined })).toEqual({
      adressePostale: '1 rue',
    });
  });
});
