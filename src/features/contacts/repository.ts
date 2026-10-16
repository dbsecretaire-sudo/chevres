import { creerClient, enregistrerClient, listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { creerFournisseur, enregistrerFournisseur, listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import {
  clientPourFournisseur,
  construireContacts,
  contactDe,
  coordonneesAPartager,
  fournisseurPourClient,
  liensAEnregistrer,
} from '@/features/contacts/services/contacts';

/** Les contacts de l'établissement actif (fiches client et fournisseur réunies). */
export async function listContacts() {
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  return construireContacts(clients, fournisseurs);
}

/** Le contact d'une fiche (client ou fournisseur) : les deux fiches quand il en a deux. */
export async function getContact(id: string) {
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  return contactDe(id, clients, fournisseurs);
}

/** Ajoute le client aussi comme fournisseur : une nouvelle fiche fournisseur, liée à la sienne. */
export async function ajouterCommeFournisseur(client: Client): Promise<Fournisseur> {
  const fournisseur = await creerFournisseur(fournisseurPourClient(client));
  await enregistrerClient({ ...client, fournisseurId: fournisseur.id });
  return fournisseur;
}

/** Ajoute le fournisseur aussi comme client : une nouvelle fiche client, liée à la sienne. */
export async function ajouterCommeClient(fournisseur: Fournisseur): Promise<Client> {
  const client = await creerClient(clientPourFournisseur(fournisseur));
  await enregistrerFournisseur({ ...fournisseur, clientId: client.id });
  return client;
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
