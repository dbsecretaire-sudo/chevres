import { enregistrerFacture, supprimerFacture } from '@/features/comptabilite/repository/factures';
import type { NatureUrssaf } from '@/features/comptabilite/types';
import type { Client } from '@/features/clients/types';
import {
  enregistrerElement,
  lireArchiveDossiers,
  remplacerArchiveDossiers,
} from '@/features/dossiers/repository';
import type { Element, Facturation } from '@/features/dossiers/types';
import type { InfosEntreprise } from '@/features/settings/settings';
import {
  CATEGORIE_RECETTE,
  TAUX_TVA_RECETTE_ENTREPRISE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { TYPE_FACTURATION } from '@/shared/constants/dossiers';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { generateId } from '@/shared/utils/id';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.dossiers.facturation;

/** Ce qu'on saisit pour facturer un contenu : le montant, la date, la nature, et le numéro de facture (sauf pour la note). */
export interface SaisieFacturation {
  type: Facturation['type'];
  /** Le montant TTC (€). */
  montant: number;
  date: string;
  nature: NatureUrssaf;
  numeroFacture?: string;
}

/** La TVA d'une prestation : celle d'office quand l'entreprise est assujettie, aucune sinon. */
const tvaDesPrestations = (infos?: InfosEntreprise): number | undefined =>
  infos?.tvaApplicable ? TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.PRESTATIONS] : undefined;

/** Inscrit en comptabilité une recette « Prestations de services » facturée au client, avec son numéro de facture. */
async function inscrireFacture(
  client: Client,
  donnees: { montant: number; date: string; nature: NatureUrssaf; description: string },
  infos?: InfosEntreprise,
) {
  return enregistrerFacture({
    activite: ACTIVITE_COMMUNE,
    date: donnees.date,
    type: TYPE_FACTURE.EMISE,
    tiers: nomComplet(client),
    description: donnees.description,
    montant: donnees.montant,
    categorieRecette: CATEGORIE_RECETTE.PRESTATIONS,
    natureUrssaf: donnees.nature,
    tauxTva: tvaDesPrestations(infos),
  });
}

/**
 * Facture un contenu au client de son dossier (une facture ou un acompte, inscrit en comptabilité avec son numéro), ou
 * l'ajoute sur la note du client pour tout facturer ensemble plus tard. Rend le contenu mis à jour.
 */
export async function ajouterFacturation(
  element: Element,
  saisie: SaisieFacturation,
  client: Client,
  infos?: InfosEntreprise,
): Promise<Element> {
  const numero = saisie.numeroFacture?.trim();
  let factureId: string | undefined;
  if (saisie.type !== TYPE_FACTURATION.NOTE) {
    if (!numero) throw new Error(T.numeroRequis);
    const facture = await inscrireFacture(
      client,
      {
        montant: saisie.montant,
        date: saisie.date,
        nature: saisie.nature,
        description:
          saisie.type === TYPE_FACTURATION.ACOMPTE
            ? T.descriptionAcompte(numero, element.titre)
            : T.descriptionFacture(numero, element.titre),
      },
      infos,
    );
    factureId = facture.id;
  }
  const facturation: Facturation = {
    id: generateId(),
    type: saisie.type,
    montant: saisie.montant,
    date: saisie.date,
    nature: saisie.nature,
    numeroFacture: saisie.type === TYPE_FACTURATION.NOTE ? undefined : numero,
    factureId,
  };
  return enregistrerElement({ ...element, facturations: [...(element.facturations ?? []), facturation] });
}

/** Une prestation ajoutée sur la note d'un client, et le contenu qui la porte. */
export interface LigneDeNote {
  element: Element;
  ligne: Facturation;
}

/** Les prestations de la note d'un client : celles ajoutées sur la note et pas encore facturées. */
export function lignesDeLaNote(elements: Element[], clientId: string): LigneDeNote[] {
  return elements
    .filter((e) => e.clientId === clientId)
    .flatMap((element) =>
      (element.facturations ?? [])
        .filter((l) => l.type === TYPE_FACTURATION.NOTE && !l.factureId)
        .map((ligne) => ({ element, ligne })),
    );
}

/** Le montant de la note (€ TTC). */
export const totalDeLaNote = (lignes: LigneDeNote[]): number =>
  Math.round(lignes.reduce((total, l) => total + l.ligne.montant, 0) * 100) / 100;

/**
 * Facture la note du client en une fois, sous un seul numéro de facture : une recette par nature de prestation (l'URSSAF les
 * distingue), toutes au même numéro. Les prestations de la note sont alors facturées. Rend le nombre de recettes créées.
 */
export async function facturerLaNote(
  clientId: string,
  numeroFacture: string,
  date: string,
  client: Client,
  infos?: InfosEntreprise,
): Promise<number> {
  const numero = numeroFacture.trim();
  if (!numero) throw new Error(T.numeroRequis);
  const archive = await lireArchiveDossiers();
  const lignes = lignesDeLaNote(archive.elements, clientId);
  if (lignes.length === 0) return 0;

  const natures = [...new Set(lignes.map((l) => l.ligne.nature))];
  const factures = new Map<NatureUrssaf, string>();
  for (const nature of natures) {
    const deLaNature = lignes.filter((l) => l.ligne.nature === nature);
    const facture = await inscrireFacture(
      client,
      {
        montant: totalDeLaNote(deLaNature),
        date,
        nature,
        description: T.descriptionNote(numero, deLaNature.length),
      },
      infos,
    );
    factures.set(nature, facture.id);
  }

  const identifiants = new Set(lignes.map((l) => l.ligne.id));
  await remplacerArchiveDossiers({
    ...archive,
    elements: archive.elements.map((element) => ({
      ...element,
      facturations: element.facturations?.map((l) =>
        identifiants.has(l.id) ? { ...l, numeroFacture: numero, factureId: factures.get(l.nature) } : l,
      ),
    })),
  });
  return natures.length;
}

/** Une facturation qu'on peut retirer : une facture ou un acompte (sa recette part avec elle), ou une prestation pas encore facturée de la note. */
export const facturationRetirable = (l: Facturation): boolean =>
  l.type !== TYPE_FACTURATION.NOTE || !l.factureId;

/** Retire une facturation d'un contenu ; sa recette en comptabilité est supprimée (une prestation facturée par la note reste). */
export async function retirerFacturation(element: Element, facturationId: string): Promise<Element> {
  const ligne = element.facturations?.find((l) => l.id === facturationId);
  if (!ligne || !facturationRetirable(ligne)) return element;
  if (ligne.factureId) await supprimerFacture(ligne.factureId);
  const restantes = (element.facturations ?? []).filter((l) => l.id !== facturationId);
  return enregistrerElement({ ...element, facturations: restantes.length > 0 ? restantes : undefined });
}
