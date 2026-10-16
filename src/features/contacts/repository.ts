import {
  creerClient,
  enregistrerClient,
  listClients,
  supprimerClient,
} from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import {
  creerFournisseur,
  enregistrerFournisseur,
  listFournisseurs,
  supprimerFournisseur,
} from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { filtrerParClient } from '@/features/clients/services/resumeClient';
import { facturesDuFournisseur } from '@/features/fournisseurs/services/resumeFournisseur';
import {
  construireContacts,
  contactDe,
  coordonneesAPartager,
  liensAEnregistrer,
  type Contact,
} from '@/features/contacts/services/contacts';
import { fichesDuFormulaire, type FormulaireContact } from '@/features/contacts/services/fiche';
import { nomComplet } from '@/shared/utils/personne';

/** Les contacts de l'établissement actif (fiches client et fournisseur réunies). */
export async function listContacts(): Promise<Contact[]> {
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  return construireContacts(clients, fournisseurs);
}

/** Le contact d'une fiche (client ou fournisseur) : les deux fiches quand il en a deux. */
export async function getContact(id: string): Promise<Contact | undefined> {
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  return contactDe(id, clients, fournisseurs);
}

/**
 * Lie les fiches client et fournisseur qui portent le même nom sans l'être encore : le lien tient alors même si l'une est renommée.
 * Rien n'est supprimé ni modifié d'autre.
 */
export async function lierLesFichesDeMemeNom(): Promise<void> {
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  for (const { client, fournisseur } of liensAEnregistrer(clients, fournisseurs)) {
    if (client.fournisseurId !== fournisseur.id) await enregistrerClient({ ...client, fournisseurId: fournisseur.id });
    if (fournisseur.clientId !== client.id) await enregistrerFournisseur({ ...fournisseur, clientId: client.id });
  }
}

/** Après l'enregistrement d'un client : son adresse, son téléphone et son e-mail passent à sa fiche fournisseur s'il en a une. */
export async function partagerCoordonneesDuClient(client: Client): Promise<void> {
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  const autre = contactDe(client.id, clients, fournisseurs)?.fournisseur;
  if (!autre) return;
  const { adressePostale, telephone, email } = coordonneesAPartager(client);
  await enregistrerFournisseur({
    ...autre,
    adressePostale: adressePostale ?? autre.adressePostale,
    telephone: telephone ?? autre.telephone,
    email: email ?? autre.email,
    clientId: client.id,
  });
}

/** Après l'enregistrement d'un fournisseur : son adresse, son téléphone et son e-mail passent à sa fiche client s'il en a une. */
export async function partagerCoordonneesDuFournisseur(fournisseur: Fournisseur): Promise<void> {
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  const autre = contactDe(fournisseur.id, clients, fournisseurs)?.client;
  if (!autre) return;
  const { adressePostale, telephone, email } = coordonneesAPartager(fournisseur);
  await enregistrerClient({
    ...autre,
    adressePostale: adressePostale ?? autre.adressePostale,
    telephone: telephone ?? autre.telephone,
    email: email ?? autre.email,
    fournisseurId: fournisseur.id,
  });
}

/** Pourquoi un contact ne s'enregistre pas. */
export type ErreurContact = 'nomRequis' | 'rienCoche' | 'ecrituresRecettes' | 'ecrituresDepenses';

/** Vrai si le client a des ventes ou des factures : on ne retire pas son côté « recettes ». */
async function clientAEcritures(client: Client): Promise<boolean> {
  const [ventes, factures] = await Promise.all([listToutesVentes(), listToutesFactures()]);
  const siennes = filtrerParClient(nomComplet(client), ventes, factures);
  return siennes.ventes.length + siennes.factures.length > 0;
}

/** Vrai si le fournisseur a des factures reçues : on ne retire pas son côté « dépenses ». */
async function fournisseurAEcritures(fournisseur: Fournisseur): Promise<boolean> {
  return facturesDuFournisseur(fournisseur, await listToutesFactures()).length > 0;
}

/**
 * Enregistre un contact d'après son formulaire : crée ou met à jour sa fiche client (recettes) et sa fiche fournisseur (dépenses),
 * les lie, et supprime le côté décoché — sauf s'il a déjà des écritures, qui ne doivent pas perdre leur fiche.
 */
export async function enregistrerContact(
  form: FormulaireContact,
  existant?: Contact,
  idsConnus?: { client: readonly string[]; fournisseur: readonly string[] },
): Promise<{ erreur: ErreurContact } | { contact: Contact }> {
  if (!form.nom.trim()) return { erreur: 'nomRequis' };
  if (!form.recettes && !form.depenses) return { erreur: 'rienCoche' };
  if (existant?.client && !form.recettes && (await clientAEcritures(existant.client))) {
    return { erreur: 'ecrituresRecettes' };
  }
  if (existant?.fournisseur && !form.depenses && (await fournisseurAEcritures(existant.fournisseur))) {
    return { erreur: 'ecrituresDepenses' };
  }

  const fiches = fichesDuFormulaire(form, existant, idsConnus);
  let client: Client | undefined;
  let fournisseur: Fournisseur | undefined;
  if (fiches.client) {
    const { id, ...donnees } = fiches.client;
    client = id ? { id, ...donnees } : await creerClient(donnees);
  }
  if (fiches.fournisseur) {
    const { id, ...donnees } = fiches.fournisseur;
    fournisseur = id ? { id, ...donnees } : await creerFournisseur(donnees);
  }
  // Les deux fiches se lient ; une fiche seule n'a plus de lien.
  if (client) client = { ...client, fournisseurId: fournisseur?.id };
  if (fournisseur) fournisseur = { ...fournisseur, clientId: client?.id };
  if (client) await enregistrerClient(client);
  if (fournisseur) await enregistrerFournisseur(fournisseur);
  if (existant?.client && !client) await supprimerClient(existant.client.id);
  if (existant?.fournisseur && !fournisseur) await supprimerFournisseur(existant.fournisseur.id);

  return { contact: { cle: (client ?? fournisseur)!.id, nom: nomComplet(client ?? { nom: fournisseur!.nomEntreprise }), client, fournisseur } };
}

/** Supprime le contact : ses deux fiches (ses ventes et ses factures déjà enregistrées ne sont pas modifiées). */
export async function supprimerContact(contact: Contact): Promise<void> {
  if (contact.client) await supprimerClient(contact.client.id);
  if (contact.fournisseur) await supprimerFournisseur(contact.fournisseur.id);
}
