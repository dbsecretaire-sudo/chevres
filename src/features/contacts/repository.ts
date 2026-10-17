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
import { enregistrerControle, listTousControles } from '@/features/exploitation/repository/controles';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { todayISO } from '@/shared/utils/dates';
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
export type ErreurContact = 'nomRequis' | 'categorieRequise' | 'rienCoche' | 'ecrituresRecettes' | 'ecrituresDepenses';

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
  if (!form.categorie) return { erreur: 'categorieRequise' };
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

const memeNom = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * L'entrée où se rangent les documents d'un contact (ses courriers, contrats, aides, notes…) : celle qui est liée à sa fiche, sinon un
 * groupement saisi à la main du même nom (adopté), sinon une entrée neuve. Renvoie son identifiant.
 */
export async function assurerEntreeDuContact(contact: Contact): Promise<string> {
  const entrees = (await listTousControles()).filter((c) => c.famille === FAMILLE_CONTROLE.GROUPEMENT);
  const fournisseurId = contact.fournisseur?.id;
  const clientId = contact.client?.id;
  const lie = entrees.find(
    (c) => (!!fournisseurId && c.fournisseurId === fournisseurId) || (!!clientId && c.clientId === clientId),
  );
  const adoptee =
    lie ?? entrees.find((c) => !c.fournisseurId && !c.clientId && memeNom(c.type, contact.nom));
  if (adoptee) {
    if (adoptee.fournisseurId !== fournisseurId || adoptee.clientId !== clientId) {
      await enregistrerControle({ ...adoptee, fournisseurId, clientId });
    }
    return adoptee.id;
  }
  const creee = await enregistrerControle({
    famille: FAMILLE_CONTROLE.GROUPEMENT,
    date: todayISO(),
    type: contact.nom,
    fournisseurId,
    clientId,
  });
  return creee.id;
}

/**
 * Les groupements saisis à la main (GDS, achat groupé…) n'ont ni fiche client ni fiche fournisseur : chacun devient un contact qui fait
 * des dépenses (la case « recettes » se coche à part), avec ses contenus. S'il existe déjà un contact du même nom, c'est à lui qu'il est
 * lié. Sans effet sur ce qui est déjà converti.
 */
export async function convertirGroupementsEnContacts(): Promise<void> {
  const controles = await listTousControles();
  const orphelins = controles.filter(
    (c) => c.famille === FAMILLE_CONTROLE.GROUPEMENT && !c.fournisseurId && !c.clientId,
  );
  if (orphelins.length === 0) return;
  const [clients, fournisseurs] = await Promise.all([listClients(), listFournisseurs()]);
  for (const entree of orphelins) {
    const fournisseur = fournisseurs.find((f) => memeNom(f.nomEntreprise, entree.type));
    const client = clients.find((c) => memeNom(nomComplet(c), entree.type));
    if (fournisseur) {
      await enregistrerControle({ ...entree, fournisseurId: fournisseur.id, clientId: client?.id });
    } else if (client) {
      await enregistrerControle({ ...entree, clientId: client.id });
    } else {
      const cree = await creerFournisseur({
        nom: '',
        nomEntreprise: entree.type,
        siret: '',
        adressePostale: '',
        categorie: CATEGORIE_FOURNISSEUR.GROUPEMENT,
      });
      await enregistrerControle({ ...entree, fournisseurId: cree.id });
    }
  }
}
