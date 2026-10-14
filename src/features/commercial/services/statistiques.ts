import type { Client } from '@/features/clients/types';
import type { Vente } from '@/features/comptabilite/types';
import { libelleCategorieVente } from '@/features/comptabilite/utils/ventes';
import { CATEGORIE_VENTE, TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import { CIRCUIT_NON_RENSEIGNE } from '@/shared/constants/commercial';
import { HEURE_MIDI, MS_PAR_JOUR } from '@/shared/constants/temps';
import { LABEL_TYPE_FROMAGE, LABEL_UNITE_VENTE_COURT } from '@/shared/textes/libelles';
import { nomComplet } from '@/shared/utils/personne';

const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;
const montantDe = (v: Vente): number => v.prix ?? 0;

/** Le nombre de jours de `debut` à `fin` (deux dates AAAA-MM-JJ) ; négatif si `fin` précède `debut`. */
export function joursEntre(debut: string, fin: string): number {
  return Math.round(
    (new Date(`${fin}${HEURE_MIDI}`).getTime() - new Date(`${debut}${HEURE_MIDI}`).getTime()) / MS_PAR_JOUR,
  );
}

/** Ce qui a été vendu d'un produit : les quantités (dans leur unité) et le montant. */
export interface LigneProduit {
  cle: string;
  libelle: string;
  unite: string;
  quantite: number;
  nombre: number;
  montant: number;
  /** Le prix moyen obtenu à l'unité (€) ; absent quand rien n'est compté en quantité. */
  prixMoyen?: number;
}

/** Ce qu'un client a acheté sur la période. */
export interface LigneClient {
  client: string;
  nombre: number;
  montant: number;
  derniere: string;
}

/** Ce qu'un circuit de vente a rapporté. */
export interface LigneCircuit {
  circuit: string;
  nombre: number;
  montant: number;
  /** La part du chiffre d'affaires (0 à 1). */
  part: number;
  panierMoyen: number;
}

/** Une vente pas encore encaissée, avec son retard (jours depuis son échéance ; 0 quand elle n'est pas échue). */
export interface Impaye {
  vente: Vente;
  retard: number;
}

export interface StatistiquesVentes {
  total: number;
  nombre: number;
  panierMoyen: number;
  /** Le chiffre d'affaires de chaque mois (janvier = 0), pour l'année des dates (celle de la première vente). */
  parMois: number[];
  produits: LigneProduit[];
  clients: LigneClient[];
  circuits: LigneCircuit[];
  impayes: Impaye[];
  totalImpaye: number;
}

/** Le nom du produit d'une vente : le fromage s'appelle par son type (ou le nom libre), le reste par sa catégorie. */
export function produitDeLaVente(v: Vente): { cle: string; libelle: string } {
  if (v.categorie !== CATEGORIE_VENTE.FROMAGE) {
    return { cle: v.categorie, libelle: libelleCategorieVente(v) };
  }
  const type = v.typeFromage ?? TYPE_FROMAGE.AUTRE;
  const libelle =
    type === TYPE_FROMAGE.AUTRE && v.typeFromageLibre?.trim()
      ? v.typeFromageLibre.trim()
      : LABEL_TYPE_FROMAGE[type];
  return { cle: `${v.categorie}:${type}:${libelle.toLowerCase()}`, libelle };
}

/**
 * Les chiffres des ventes d'une période : le total, le panier moyen, le détail par produit, par client, par circuit et par mois,
 * et ce qui reste à encaisser. Un client « sans nom » se regroupe sous `sansClient`.
 */
export function statistiquesVentes(
  ventes: Vente[],
  aujourdhui: string,
  sansClient: string,
): StatistiquesVentes {
  const total = arrondi(ventes.reduce((t, v) => t + montantDe(v), 0));
  const parMois = Array.from({ length: 12 }, () => 0);
  const produits = new Map<string, LigneProduit>();
  const clients = new Map<string, LigneClient>();
  const circuits = new Map<string, LigneCircuit>();
  for (const v of ventes) {
    const mois = Number(v.date.slice(5, 7)) - 1;
    if (mois >= 0 && mois < 12) parMois[mois] += montantDe(v);

    const { cle, libelle } = produitDeLaVente(v);
    const unite = LABEL_UNITE_VENTE_COURT[v.unite] ?? v.unite;
    const cleProduit = `${cle}|${v.unite}`;
    const produit = produits.get(cleProduit) ?? {
      cle: cleProduit,
      libelle,
      unite,
      quantite: 0,
      nombre: 0,
      montant: 0,
    };
    produit.quantite += v.quantite ?? 0;
    produit.nombre += 1;
    produit.montant += montantDe(v);
    produits.set(cleProduit, produit);

    const nomClient = v.client?.trim() || sansClient;
    const client = clients.get(nomClient) ?? { client: nomClient, nombre: 0, montant: 0, derniere: v.date };
    client.nombre += 1;
    client.montant += montantDe(v);
    if (v.date > client.derniere) client.derniere = v.date;
    clients.set(nomClient, client);

    const nomCircuit = v.circuit || CIRCUIT_NON_RENSEIGNE;
    const circuit = circuits.get(nomCircuit) ?? {
      circuit: nomCircuit,
      nombre: 0,
      montant: 0,
      part: 0,
      panierMoyen: 0,
    };
    circuit.nombre += 1;
    circuit.montant += montantDe(v);
    circuits.set(nomCircuit, circuit);
  }
  const impayes: Impaye[] = ventes
    .filter((v) => v.payee === false)
    .map((v) => ({ vente: v, retard: v.echeance ? Math.max(0, joursEntre(v.echeance, aujourdhui)) : 0 }))
    .sort((a, b) => b.retard - a.retard || (a.vente.echeance ?? '').localeCompare(b.vente.echeance ?? ''));
  return {
    total,
    nombre: ventes.length,
    panierMoyen: ventes.length > 0 ? arrondi(total / ventes.length) : 0,
    parMois: parMois.map(arrondi),
    produits: [...produits.values()]
      .map((p) => ({
        ...p,
        montant: arrondi(p.montant),
        prixMoyen: p.quantite > 0 ? arrondi(p.montant / p.quantite) : undefined,
      }))
      .sort((a, b) => b.montant - a.montant),
    clients: [...clients.values()]
      .map((c) => ({ ...c, montant: arrondi(c.montant) }))
      .sort((a, b) => b.montant - a.montant),
    circuits: [...circuits.values()]
      .map((c) => ({
        ...c,
        montant: arrondi(c.montant),
        part: total > 0 ? c.montant / total : 0,
        panierMoyen: c.nombre > 0 ? arrondi(c.montant / c.nombre) : 0,
      }))
      .sort((a, b) => b.montant - a.montant),
    impayes,
    totalImpaye: arrondi(impayes.reduce((t, i) => t + montantDe(i.vente), 0)),
  };
}

/** Un client à relancer : sa dernière vente, le nombre de jours depuis, et ce qu'il a acheté en tout. */
export interface ClientARelancer {
  client: Client;
  nomAffiche: string;
  derniere: string;
  jours: number;
  montant: number;
}

/**
 * Les clients dont la dernière vente date d'au moins `jours` jours (le plus longtemps sans achat d'abord). Un client sans aucune
 * vente n'est pas proposé : il n'a jamais acheté. Les ventes se rattachent à la fiche par le nom affiché du client.
 */
export function clientsARelancer(
  clients: Client[],
  toutesVentes: Vente[],
  aujourdhui: string,
  jours: number,
): ClientARelancer[] {
  const resultat: ClientARelancer[] = [];
  for (const client of clients) {
    const nomAffiche = nomComplet(client);
    const siennes = toutesVentes.filter((v) => v.client === nomAffiche);
    if (siennes.length === 0) continue;
    const derniere = siennes.reduce((d, v) => (v.date > d ? v.date : d), siennes[0].date);
    const ecoule = joursEntre(derniere, aujourdhui);
    if (ecoule < jours) continue;
    resultat.push({
      client,
      nomAffiche,
      derniere,
      jours: ecoule,
      montant: arrondi(siennes.reduce((t, v) => t + montantDe(v), 0)),
    });
  }
  return resultat.sort((a, b) => b.jours - a.jours);
}
