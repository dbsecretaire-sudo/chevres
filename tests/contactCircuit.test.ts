import { describe, expect, it } from 'vitest';
import { enregistrerContact, listContacts } from '@/features/contacts/repository';
import { FORMULAIRE_CONTACT_VIDE, fichesDuFormulaire, formulaireDuContact } from '@/features/contacts/services/fiche';

const formulaire = (extra: Partial<typeof FORMULAIRE_CONTACT_VIDE> = {}) => ({
  ...FORMULAIRE_CONTACT_VIDE,
  nom: 'Angeli',
  prenom: 'Alain',
  categorie: 'particulier',
  ...extra,
});

describe('circuit de vente privilégié d’un contact', () => {
  it('est obligatoire pour un contact qui reçoit des recettes', async () => {
    const resultat = await enregistrerContact(formulaire({ recettes: true, circuit: '' }));
    expect(resultat).toEqual({ erreur: 'circuitRequis' });
  });

  it('n’est pas demandé à un contact qui ne fait que des dépenses', async () => {
    const resultat = await enregistrerContact(formulaire({ nom: 'Garage', recettes: false, depenses: true, circuit: '' }));
    expect('erreur' in resultat).toBe(false);
  });

  it('s’enregistre dans la fiche client et revient dans le formulaire', async () => {
    const resultat = await enregistrerContact(formulaire({ nom: 'Boulanger', circuit: 'marche' }));
    if ('erreur' in resultat) throw new Error(resultat.erreur);
    expect(resultat.contact.client?.circuit).toBe('marche');
    expect(formulaireDuContact(resultat.contact).circuit).toBe('marche');
    const relu = (await listContacts()).find((c) => c.cle === resultat.contact.cle);
    expect(relu?.client?.circuit).toBe('marche');
  });

  it('la fiche garde son circuit tant que le formulaire n’en change pas', () => {
    const fiches = fichesDuFormulaire(formulaire({ circuit: 'ferme' }));
    expect(fiches.client?.circuit).toBe('ferme');
  });
});
