import { describe, expect, it } from 'vitest';
import { enregistrerContact, listContacts } from '@/features/contacts/repository';
import { nomDeContactDejaPris } from '@/features/contacts/services/contacts';
import { FORMULAIRE_CONTACT_VIDE } from '@/features/contacts/services/fiche';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

describe('deux contacts n’ont jamais le même nom', () => {
  it('reconnaît un nom déjà pris, sans tenir compte des majuscules, des accents ni des espaces', () => {
    const contacts = [
      { cle: 'a', nom: 'ODARC' },
      { cle: 'b', nom: 'Chambre d’agriculture' },
    ];
    expect(nomDeContactDejaPris(contacts, ' odarc ')).toBe(true);
    expect(nomDeContactDejaPris(contacts, 'Chambre  d’Agriculture')).toBe(true);
    expect(nomDeContactDejaPris(contacts, 'Odarc 2')).toBe(false);
    // Le contact lui-même n'est pas « un autre ».
    expect(nomDeContactDejaPris(contacts, 'ODARC', 'a')).toBe(false);
    expect(nomDeContactDejaPris(contacts, '')).toBe(false);
  });

  it('refuse d’enregistrer un second contact du même nom, et laisse renommer l’existant', async () => {
    const form = {
      ...FORMULAIRE_CONTACT_VIDE,
      nom: 'ODARC',
      categorie: CATEGORIE_FOURNISSEUR.GENERAL,
      recettes: false,
      depenses: true,
    };
    const premier = await enregistrerContact(form);
    expect(premier).toHaveProperty('contact');
    expect(await enregistrerContact({ ...form, nom: 'odarc' })).toEqual({ erreur: 'nomDejaPris' });
    expect((await listContacts()).filter((c) => c.nom.toLowerCase() === 'odarc')).toHaveLength(1);
    // Le contact existant s'enregistre toujours sous son nom ; un autre nom libre passe.
    if (!('contact' in premier)) throw new Error('création attendue');
    expect('contact' in (await enregistrerContact({ ...form, telephone: '0495' }, premier.contact))).toBe(
      true,
    );
    expect('contact' in (await enregistrerContact({ ...form, nom: 'Office de tourisme' }))).toBe(true);
  });
});
