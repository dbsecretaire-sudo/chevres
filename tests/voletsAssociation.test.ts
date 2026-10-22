import { describe, expect, it } from 'vitest';
import {
  fichesDuFormulaire,
  FORMULAIRE_CONTACT_VIDE,
  formulaireDuContact,
} from '@/features/contacts/services/fiche';
import { VOLET_COOPERATIVE } from '@/shared/constants/comptabilite';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';

const formulaire = (extra: Partial<typeof FORMULAIRE_CONTACT_VIDE>) => ({
  ...FORMULAIRE_CONTACT_VIDE,
  nom: 'Casgiu Casanu',
  circuit: 'marche',
  recettes: true,
  depenses: true,
  ...extra,
});

describe('volets d’une association ou d’une coopérative agricole', () => {
  it('range les volets cochés sur les deux fiches du contact', () => {
    const fiches = fichesDuFormulaire(
      formulaire({
        categorie: CATEGORIE_FOURNISSEUR.GROUPEMENT,
        volets: [VOLET_COOPERATIVE.VENTE_GROUPEE, VOLET_COOPERATIVE.TRANSPORTS],
      }),
    );
    expect(fiches.client?.volets).toEqual([VOLET_COOPERATIVE.VENTE_GROUPEE, VOLET_COOPERATIVE.TRANSPORTS]);
    expect(fiches.fournisseur?.volets).toEqual([VOLET_COOPERATIVE.VENTE_GROUPEE, VOLET_COOPERATIVE.TRANSPORTS]);
  });

  it('ne garde aucun volet quand rien n’est coché, ni pour une autre catégorie', () => {
    const sansVolet = fichesDuFormulaire(formulaire({ categorie: CATEGORIE_FOURNISSEUR.GROUPEMENT }));
    expect(sansVolet.client?.volets).toBeUndefined();
    const autre = fichesDuFormulaire(
      formulaire({ categorie: CATEGORIE_FOURNISSEUR.ASSUREUR, volets: [VOLET_COOPERATIVE.EXPERTS] }),
    );
    expect(autre.fournisseur?.volets).toBeUndefined();
  });

  it('relit les volets d’un contact dans son formulaire', () => {
    const fiches = fichesDuFormulaire(
      formulaire({ categorie: CATEGORIE_FOURNISSEUR.GROUPEMENT, volets: [VOLET_COOPERATIVE.ACHAT_GROUPE] }),
    );
    const contact = {
      cle: 'c1',
      nom: 'Illoc',
      client: { id: 'c1', nom: 'Illoc', ...fiches.client },
      fournisseur: undefined,
    };
    expect(formulaireDuContact(contact).volets).toEqual([VOLET_COOPERATIVE.ACHAT_GROUPE]);
  });
});
