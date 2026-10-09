import {
  enregistrerFacture,
  getFacture,
  remplacerFacture,
  supprimerFacture,
} from '@/features/comptabilite/repository/factures';
import type { Facture } from '@/features/comptabilite/types';
import { tvaDuTtc } from '@/features/entreprise/services/fiscaliteEntreprise';
import type { AcompteSejour, AjustementSejour, Sejour } from '@/features/gite/types';
import { tarifDuSejour } from '@/features/gite/services/tarifSejour';
import { nuitsDuSejour } from '@/shared/utils/calendrier';
import { getSettings } from '@/features/settings/settings';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  TAUX_TVA_RECETTE_ENTREPRISE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { NATURE_URSSAF_DE_L_HEBERGEMENT } from '@/shared/constants/entreprise';
import { TYPE_AJUSTEMENT_SEJOUR } from '@/shared/constants/gite';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.gite.sejour;

/** La facture qu'un séjour crée en comptabilité (`factureRepasId` : l'ancienne recette des repas, retirée au passage). */
export interface FacturesSejour {
  factureId?: string;
  factureRepasId?: string;
}

/**
 * Le taux de TVA (%) qui, appliqué au total payé, donne la TVA de l'hébergement et des repas : la taxe de séjour, comprise
 * dans le total, n'en porte pas.
 */
function tauxTvaDuSejour(
  hebergement: number,
  restauration: number,
  total: number,
  tauxHebergement: number,
): number {
  const tva =
    tvaDuTtc(hebergement, tauxHebergement) +
    tvaDuTtc(restauration, TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.RESTAURATION]);
  return total > tva ? Math.round((total / (total - tva) - 1) * 10000) / 100 : 0;
}

/** La part (€) d'un montant payé qui revient à une partie du séjour (les repas, la taxe) : au prorata de ce qui est payé. */
function partDuSejour(partie: number, paye: number, total: number): number | undefined {
  return total > 0 && partie > 0 ? Math.round((partie * paye * 100) / total) / 100 : undefined;
}

/** Le compte et la TVA de l'hébergement du gîte : ceux choisis dans « Modifier l'activité », sinon ceux d'office. */
async function reglagesGite(): Promise<{ compte?: string; taux: number }> {
  const infos = (await getSettings()).exploitation?.entreprise;
  return {
    compte: infos?.giteCompte || undefined,
    taux: infos?.giteTauxTva ?? TAUX_TVA_RECETTE_ENTREPRISE[CATEGORIE_RECETTE.HEBERGEMENT],
  };
}

/**
 * Met la recette du séjour en comptabilité à jour — seulement une fois le paiement validé (sinon elle est retirée) : une
 * seule recette « Hébergement » du total payé (chambres × nuits × prix, taxe de séjour, repas), dont la description
 * donne le détail. Elle est ensuite modifiable en comptabilité ; elle est recréée si on l'y a supprimée.
 */
export async function synchroniserFacturesSejour(sejour: Sejour): Promise<FacturesSejour> {
  if (!sejour.paye) {
    // Pas encore payé : la recette du séjour n'existe pas (l'acompte, lui, reste en comptabilité).
    if (sejour.factureId) await supprimerFacture(sejour.factureId);
    if (sejour.factureRepasId) await supprimerFacture(sejour.factureRepasId);
    return { factureId: undefined, factureRepasId: undefined };
  }
  const settings = await getSettings();
  const tvaApplicable = !!settings.exploitation?.entreprise?.tvaApplicable;
  const gite = await reglagesGite();
  const tarif = tarifDuSejour(sejour);
  const nuits = nuitsDuSejour(sejour.arrivee, sejour.depart).length;
  // Ce qui reste à payer une fois l'acompte versé (il a déjà sa propre écriture).
  const acompte = sejour.acompte?.montant ?? 0;
  const solde = Math.round((tarif.total - acompte) * 100) / 100;

  // Les séjours d'avant le détail du prix n'ont pas de prix par nuit : on n'en donne que le montant.
  const details = [
    sejour.prixNuit !== undefined
      ? T.detailHebergement(sejour.chambres.length, nuits, formatMontant(sejour.prixNuit))
      : T.detailHebergementTotal(formatMontant(tarif.hebergement)),
    ...(tarif.taxe > 0 ? [T.detailTaxe(formatMontant(tarif.taxe))] : []),
    ...(tarif.restauration > 0
      ? [T.detailRepas(sejour.repas ?? 0, formatMontant(sejour.prixRepas ?? 0))]
      : []),
    ...(acompte > 0 ? [T.detailSolde(formatMontant(acompte))] : []),
  ];

  // L'ancienne recette des repas (séjours enregistrés avant le total unique) est retirée.
  if (sejour.factureRepasId) await supprimerFacture(sejour.factureRepasId);

  const existante = sejour.factureId ? await getFacture(sejour.factureId) : undefined;
  if (!(solde > 0)) {
    if (existante) await supprimerFacture(existante.id);
    return { factureId: undefined, factureRepasId: undefined };
  }
  const facture: Facture = {
    id: existante?.id ?? generateId(),
    activite: ACTIVITE_COMMUNE,
    // Une recette compte à la date où on l'encaisse.
    date: sejour.datePaiement ?? sejour.arrivee,
    type: TYPE_FACTURE.EMISE,
    tiers: sejour.nom,
    description: T.descriptionSejour(
      T.chambresListe(sejour.chambres),
      formatDateFR(sejour.arrivee),
      formatDateFR(sejour.depart),
      details,
    ),
    montant: solde,
    categorieRecette: CATEGORIE_RECETTE.HEBERGEMENT,
    // L'URSSAF : une prestation commerciale, dont les repas sont des ventes et la taxe de séjour n'est pas du chiffre d'affaires.
    natureUrssaf: existante?.natureUrssaf ?? NATURE_URSSAF_DE_L_HEBERGEMENT,
    partVenteUrssaf: partDuSejour(tarif.restauration, solde, tarif.total),
    partHorsCaUrssaf: partDuSejour(tarif.taxe, solde, tarif.total),
    // Une recette déjà inscrite garde son compte et son taux de TVA : un changement des réglages ne la modifie pas après coup.
    compteManuel: existante ? existante.compteManuel : gite.compte,
    tauxTva: existante
      ? existante.tauxTva
      : tvaApplicable
        ? tauxTvaDuSejour(tarif.hebergement, tarif.restauration, tarif.total, gite.taux)
        : undefined,
  };
  await remplacerFacture({ ...existante, ...facture });
  return { factureId: facture.id, factureRepasId: undefined };
}

/**
 * Inscrit en comptabilité l'acompte d'un séjour (recette « Hébergement » à la date de l'acompte), une seule fois : il n'est
 * jamais réécrit ensuite, toute modification se fait en comptabilité. Rend l'acompte avec l'identifiant de son écriture.
 */
export async function synchroniserAcompte(sejour: Sejour): Promise<AcompteSejour | undefined> {
  const acompte = sejour.acompte;
  if (!acompte) return undefined;
  if (acompte.factureId && (await getFacture(acompte.factureId))) return acompte;
  const settings = await getSettings();
  const tvaApplicable = !!settings.exploitation?.entreprise?.tvaApplicable;
  const gite = await reglagesGite();
  const tarif = tarifDuSejour(sejour);
  const sejourDu = T.sejourDu(
    T.chambresListe(sejour.chambres),
    formatDateFR(sejour.arrivee),
    formatDateFR(sejour.depart),
  );
  const facture = await enregistrerFacture({
    activite: ACTIVITE_COMMUNE,
    date: acompte.date,
    type: TYPE_FACTURE.EMISE,
    tiers: sejour.nom,
    description: T.descriptionAcompte(sejourDu),
    montant: acompte.montant,
    categorieRecette: CATEGORIE_RECETTE.HEBERGEMENT,
    natureUrssaf: NATURE_URSSAF_DE_L_HEBERGEMENT,
    partVenteUrssaf: partDuSejour(tarif.restauration, acompte.montant, tarif.total),
    partHorsCaUrssaf: partDuSejour(tarif.taxe, acompte.montant, tarif.total),
    compteManuel: gite.compte,
    tauxTva: tvaApplicable
      ? tauxTvaDuSejour(tarif.hebergement, tarif.restauration, tarif.total, gite.taux)
      : undefined,
  });
  return { ...acompte, factureId: facture.id };
}

/**
 * Inscrit en comptabilité un remboursement (dépense « Remboursement client ») ou une prestation supplémentaire (recette
 * « Hébergement ») d'un séjour payé, à la date donnée ; rend l'ajustement avec l'identifiant de son écriture.
 */
export async function creerFactureAjustement(
  sejour: Sejour,
  ajustement: Omit<AjustementSejour, 'id' | 'factureId'>,
): Promise<AjustementSejour> {
  const remboursement = ajustement.type === TYPE_AJUSTEMENT_SEJOUR.REMBOURSEMENT;
  const settings = await getSettings();
  const tvaApplicable = !!settings.exploitation?.entreprise?.tvaApplicable;
  const gite = await reglagesGite();
  const sejourDu = T.sejourDu(
    T.chambresListe(sejour.chambres),
    formatDateFR(sejour.arrivee),
    formatDateFR(sejour.depart),
  );
  const base: Pick<Facture, 'activite' | 'date' | 'tiers' | 'montant'> = {
    activite: ACTIVITE_COMMUNE,
    date: ajustement.date,
    tiers: sejour.nom,
    montant: ajustement.montant,
  };
  const facture = await enregistrerFacture(
    remboursement
      ? {
          ...base,
          type: TYPE_FACTURE.RECUE,
          categorieDepense: CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT,
          natureUrssaf: NATURE_URSSAF_DE_L_HEBERGEMENT,
          description: T.descriptionRemboursement(sejourDu, !!ajustement.maintenue),
        }
      : {
          ...base,
          type: TYPE_FACTURE.EMISE,
          categorieRecette: CATEGORIE_RECETTE.HEBERGEMENT,
          natureUrssaf: NATURE_URSSAF_DE_L_HEBERGEMENT,
          description: T.descriptionPrestation(sejourDu),
          compteManuel: gite.compte,
          tauxTva: tvaApplicable ? gite.taux : undefined,
        },
  );
  return { ...ajustement, id: generateId(), factureId: facture.id };
}

/** Supprime la ou les factures d'un séjour supprimé, avec celles de ses remboursements et prestations. */
export async function supprimerFacturesSejour(sejour: Sejour): Promise<void> {
  if (sejour.factureId) await supprimerFacture(sejour.factureId);
  if (sejour.factureRepasId) await supprimerFacture(sejour.factureRepasId);
  if (sejour.acompte?.factureId) await supprimerFacture(sejour.acompte.factureId);
  for (const a of sejour.ajustements ?? []) if (a.factureId) await supprimerFacture(a.factureId);
}
