import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { ecrituresDuClient, filtrerParClient, type EcritureClient } from '@/features/clients/services/resumeClient';
import { facturesDuFournisseur } from '@/features/fournisseurs/services/resumeFournisseur';
import type { Contact } from '@/features/contacts/services/contacts';
import { SOURCE_TRANSACTION } from '@/shared/constants/comptabilite';
import type { CategorieClientReglage } from '@/shared/dictionnaire/categoriesClient';
import type { CategorieFournisseurReglage } from '@/shared/dictionnaire/categoriesFournisseur';
import { TEXTES } from '@/shared/textes';
import { nomComplet } from '@/shared/utils/personne';

/** Les écritures d'un contact, côté client (ventes, factures émises, remboursements) et côté fournisseur (factures reçues), de la plus récente à la plus ancienne. Une recette est positive, une dépense négative. */
export function ecrituresDuContact(contact: Contact, ventes: Vente[], factures: Facture[]): EcritureClient[] {
  let duClient: EcritureClient[] = [];
  if (contact.client) {
    const siennes = filtrerParClient(nomComplet(contact.client), ventes, factures);
    duClient = ecrituresDuClient(siennes.ventes, siennes.factures);
  }
  // Un remboursement au client est une facture reçue du même nom : il ne se compte qu'une fois.
  const dejaVues = new Set(duClient.map((e) => e.id));
  const duFournisseur: EcritureClient[] = contact.fournisseur
    ? facturesDuFournisseur(contact.fournisseur, factures)
        .filter((f) => !dejaVues.has(f.id))
        .map((f) => ({
          id: f.id,
          date: f.date,
          titre: f.description || TEXTES.commun.general.facture,
          montant: -f.montant,
          source: SOURCE_TRANSACTION.FACTURE,
        }))
    : [];
  return [...duClient, ...duFournisseur].sort((a, b) => b.date.localeCompare(a.date));
}

/** La balance d'un contact : ce qu'il vous a payé moins ce que vous lui avez payé, au centime. */
export const balanceDuContact = (ecritures: Pick<EcritureClient, 'montant'>[]): number =>
  Math.round(ecritures.reduce((somme, e) => somme + e.montant, 0) * 100) / 100;

/** La catégorie d'un contact : une seule, ou le conflit quand ses deux fiches en ont deux différentes (à choisir). */
export interface CategorieDuContact {
  id?: string;
  conflit?: { client: string; fournisseur: string };
}

/**
 * La catégorie du contact : celle que ses fiches ont en commun, ou celle de la seule fiche qui en a une. Quand les deux en ont une
 * différente c'est un conflit, que l'utilisateur tranche contact par contact. Une catégorie retirée des réglages ne compte pas.
 */
export function categorieDuContact(
  contact: Pick<Contact, 'client' | 'fournisseur'>,
  idsConnus?: { client: readonly string[]; fournisseur: readonly string[] },
): CategorieDuContact {
  const deClient = contact.client?.categorie;
  const deFournisseur = contact.fournisseur?.categorie;
  const c = deClient && (!idsConnus || idsConnus.client.includes(deClient)) ? deClient : undefined;
  const f = deFournisseur && (!idsConnus || idsConnus.fournisseur.includes(deFournisseur)) ? deFournisseur : undefined;
  if (c && f && c !== f) return { conflit: { client: c, fournisseur: f } };
  return { id: c ?? f };
}

/** Une catégorie qu'on peut choisir pour un contact : celles des fournisseurs puis celles des clients, une ligne par identifiant. */
export function categoriesDuContact(
  fournisseurs: { id: string; nom: string }[],
  clients: { id: string; nom: string }[],
): { id: string; nom: string }[] {
  const vues = new Set<string>();
  return [...fournisseurs, ...clients]
    .filter((c) => (vues.has(c.id) ? false : (vues.add(c.id), true)))
    .map(({ id, nom }) => ({ id, nom }));
}

/**
 * Les listes de catégories (client et fournisseur) avec celle qu'on vient de choisir pour un contact : si l'une des deux listes ne la
 * connaît pas encore, elle l'ajoute (avec les réglages d'office), pour que la catégorie vaille des deux côtés.
 */
export function listesAvecCategorie(
  categorie: { id: string; nom: string },
  clients: CategorieClientReglage[],
  fournisseurs: CategorieFournisseurReglage[],
): { clients: CategorieClientReglage[]; fournisseurs: CategorieFournisseurReglage[]; modifiees: boolean } {
  const manqueClient = !clients.some((c) => c.id === categorie.id);
  const manqueFournisseur = !fournisseurs.some((c) => c.id === categorie.id);
  return {
    clients: manqueClient ? [...clients, { id: categorie.id, nom: categorie.nom, declaree: true, prixLibre: false }] : clients,
    fournisseurs: manqueFournisseur ? [...fournisseurs, { id: categorie.id, nom: categorie.nom }] : fournisseurs,
    modifiees: manqueClient || manqueFournisseur,
  };
}

/** Ce que le formulaire d'un contact saisit : les champs communs, et les cases qui disent s'il est client (recettes) et/ou fournisseur (dépenses). */
export interface FormulaireContact {
  nom: string;
  prenom: string;
  /** La personne à contacter (dans une organisation). */
  personne: string;
  /** Vide : pas de catégorie choisie (elle reste celle de la fiche). */
  categorie: string;
  recettes: boolean;
  depenses: boolean;
  siret: string;
  tva: string;
  rib: string;
  adressePostale: string;
  telephone: string;
  email: string;
}

export const FORMULAIRE_CONTACT_VIDE: FormulaireContact = {
  nom: '',
  prenom: '',
  personne: '',
  categorie: '',
  recettes: true,
  depenses: false,
  siret: '',
  tva: '',
  rib: '',
  adressePostale: '',
  telephone: '',
  email: '',
};

const premier = (...valeurs: (string | undefined)[]): string => valeurs.find((v) => v?.trim())?.trim() ?? '';

/** Le formulaire d'un contact existant : les champs communs pris sur sa fiche client, à défaut sur sa fiche fournisseur. */
export function formulaireDuContact(
  contact: Contact,
  idsConnus?: { client: readonly string[]; fournisseur: readonly string[] },
): FormulaireContact {
  const { client, fournisseur } = contact;
  return {
    nom: client ? client.nom : (fournisseur?.nomEntreprise ?? ''),
    prenom: client?.prenom ?? '',
    personne: fournisseur
      ? [fournisseur.nom, fournisseur.prenom].filter(Boolean).join(' ')
      : (client?.contact ?? ''),
    categorie: categorieDuContact(contact, idsConnus).id ?? '',
    recettes: !!client,
    depenses: !!fournisseur,
    siret: fournisseur?.siret ?? '',
    tva: fournisseur?.tva ?? '',
    rib: fournisseur?.rib ?? '',
    adressePostale: premier(client?.adressePostale, fournisseur?.adressePostale),
    telephone: premier(client?.telephone, fournisseur?.telephone),
    email: premier(client?.email, fournisseur?.email),
  };
}

const ouRien = (v: string): string | undefined => v.trim() || undefined;

/**
 * Les fiches que le formulaire décrit : une fiche client si « recettes » est cochée, une fiche fournisseur si « dépenses » l'est, avec
 * les identifiants de celles qui existent. Les factures retrouvent un contact par son nom : tant que le nom n'est pas modifié dans le
 * formulaire, chaque fiche garde le sien (deux fiches liées peuvent en avoir deux).
 */
export function fichesDuFormulaire(
  form: FormulaireContact,
  existant?: Contact,
  idsConnus?: { client: readonly string[]; fournisseur: readonly string[] },
): { client?: Omit<Client, 'id'> & { id?: string }; fournisseur?: Omit<Fournisseur, 'id'> & { id?: string } } {
  const depart = existant ? formulaireDuContact(existant, idsConnus) : undefined;
  const nomModifie = !depart || form.nom.trim() !== depart.nom.trim() || form.prenom.trim() !== depart.prenom.trim();
  const personneModifiee = !depart || form.personne.trim() !== depart.personne.trim();
  const nom = form.nom.trim();
  const prenom = ouRien(form.prenom);
  const resultat: ReturnType<typeof fichesDuFormulaire> = {};

  if (form.recettes) {
    const base = existant?.client;
    resultat.client = {
      ...base,
      nom: nomModifie || !base ? nom : base.nom,
      prenom: nomModifie || !base ? prenom : base.prenom,
      telephone: ouRien(form.telephone),
      email: ouRien(form.email),
      adressePostale: ouRien(form.adressePostale),
      categorie: form.categorie || base?.categorie,
      contact: personneModifiee || !base ? ouRien(form.personne) : base.contact,
    };
  }
  if (form.depenses) {
    const base = existant?.fournisseur;
    resultat.fournisseur = {
      ...base,
      nomEntreprise: nomModifie || !base ? nomComplet({ nom, prenom }) : base.nomEntreprise,
      nom: personneModifiee || !base ? form.personne.trim() : base.nom,
      prenom: personneModifiee || !base ? undefined : base.prenom,
      siret: form.siret.trim(),
      tva: ouRien(form.tva),
      rib: ouRien(form.rib),
      adressePostale: form.adressePostale.trim(),
      telephone: ouRien(form.telephone),
      email: ouRien(form.email),
      categorie: form.categorie || base?.categorie,
    };
  }
  return resultat;
}
