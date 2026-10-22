import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { comparerAlphabetique, nomComplet } from '@/shared/utils/personne';

/**
 * Un contact : une personne ou une organisation, avec sa fiche client (elle reçoit des recettes) et/ou sa fiche fournisseur (elle fait
 * des dépenses). Les deux fiches restent distinctes, chacune avec sa catégorie, mais le contact les réunit.
 */
export interface Contact {
  /** L'identifiant de la fiche client, à défaut celui de la fiche fournisseur. */
  cle: string;
  nom: string;
  client?: Client;
  fournisseur?: Fournisseur;
}

const normaliser = (texte: string | undefined) => (texte ?? '').trim().toLowerCase();

/** Le nom sous lequel on retrouve un fournisseur (et ses factures) : celui de son entreprise, à défaut celui de son contact. */
export const nomDuFournisseur = (f: Pick<Fournisseur, 'nomEntreprise' | 'nom'>): string =>
  f.nomEntreprise || f.nom;

/**
 * Les contacts, par ordre alphabétique : chaque fiche client et chaque fiche fournisseur, les deux réunies quand elles sont liées
 * (le lien d'une fiche ou de l'autre) ou, à défaut, qu'elles portent le même nom.
 */
export function construireContacts(clients: Client[], fournisseurs: Fournisseur[]): Contact[] {
  const duClient = new Map<string, Fournisseur>();
  const fournisseursPris = new Set<string>();
  const relier = (client: Client, fournisseur: Fournisseur) => {
    duClient.set(client.id, fournisseur);
    fournisseursPris.add(fournisseur.id);
  };
  // Les liens explicites d'abord : un nom différent n'empêche pas deux fiches liées d'être le même contact.
  for (const client of clients) {
    const fournisseur = client.fournisseurId
      ? fournisseurs.find((f) => f.id === client.fournisseurId)
      : undefined;
    if (fournisseur && !fournisseursPris.has(fournisseur.id)) relier(client, fournisseur);
  }
  for (const fournisseur of fournisseurs) {
    if (fournisseursPris.has(fournisseur.id) || !fournisseur.clientId) continue;
    const client = clients.find((c) => c.id === fournisseur.clientId);
    if (client && !duClient.has(client.id)) relier(client, fournisseur);
  }
  // Puis les fiches de même nom.
  for (const client of clients) {
    if (duClient.has(client.id)) continue;
    const nom = normaliser(nomComplet(client));
    const fournisseur = fournisseurs.find(
      (f) => !fournisseursPris.has(f.id) && normaliser(nomDuFournisseur(f)) === nom,
    );
    if (fournisseur) relier(client, fournisseur);
  }
  const contacts: Contact[] = clients.map((client) => ({
    cle: client.id,
    nom: nomComplet(client),
    client,
    fournisseur: duClient.get(client.id),
  }));
  for (const fournisseur of fournisseurs) {
    if (!fournisseursPris.has(fournisseur.id)) {
      contacts.push({ cle: fournisseur.id, nom: nomDuFournisseur(fournisseur), fournisseur });
    }
  }
  return contacts.sort((a, b) => comparerAlphabetique(a.nom, b.nom));
}

/** Le contact d'une fiche (client ou fournisseur, d'après son identifiant). */
export const contactDe = (id: string, clients: Client[], fournisseurs: Fournisseur[]): Contact | undefined =>
  construireContacts(clients, fournisseurs).find((c) => c.client?.id === id || c.fournisseur?.id === id);

/** Les liens à enregistrer pour que les fiches de même nom, encore non liées, le soient : (client, fournisseur). */
export function liensAEnregistrer(
  clients: Client[],
  fournisseurs: Fournisseur[],
): { client: Client; fournisseur: Fournisseur }[] {
  return construireContacts(clients, fournisseurs)
    .filter(
      (c): c is Contact & { client: Client; fournisseur: Fournisseur } =>
        !!c.client &&
        !!c.fournisseur &&
        (c.client.fournisseurId !== c.fournisseur.id || c.fournisseur.clientId !== c.client.id),
    )
    .map((c) => ({ client: c.client, fournisseur: c.fournisseur }));
}

const rempli = (v: string | undefined): string | undefined => v?.trim() || undefined;

/**
 * Les coordonnées communes (adresse, téléphone, e-mail) que `source` donne à la fiche liée : seules celles qui sont remplies passent,
 * pour qu'une fiche vide n'efface pas ce que l'autre a déjà.
 */
export function coordonneesAPartager(source: {
  adressePostale?: string;
  telephone?: string;
  email?: string;
}): { adressePostale?: string; telephone?: string; email?: string } {
  const partage: { adressePostale?: string; telephone?: string; email?: string } = {};
  const adresse = rempli(source.adressePostale);
  const telephone = rempli(source.telephone);
  const email = rempli(source.email);
  if (adresse) partage.adressePostale = adresse;
  if (telephone) partage.telephone = telephone;
  if (email) partage.email = email;
  return partage;
}
