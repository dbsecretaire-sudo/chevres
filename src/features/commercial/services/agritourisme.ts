import { enregistrerFacture, supprimerFacture } from '@/features/comptabilite/repository/factures';
import { rentabilite } from '@/features/comptabilite/services/rentabilite';
import { TOUTES_ACTIVITES } from '@/features/comptabilite/services/filtresTransactions';
import { lireArchiveCommercial, remplacerArchiveCommercial } from '@/features/commercial/repository';
import type {
  ArchiveCommercial,
  ElementFormule,
  FormuleAgritourisme,
  VisiteAgritourisme,
} from '@/features/commercial/types';
import {
  COMPTE_AGRITOURISME,
  ELEMENT_AGRITOURISME,
  STATUT_VISITE,
  STATUTS_VISITE_COMPTEES,
  TAUX_TVA_AGRITOURISME,
} from '@/shared/constants/agritourisme';
import { ATELIER } from '@/shared/constants/ateliers';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { TEXTES } from '@/shared/textes';

const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;

/** Ce que rapporte une visite : le nombre de personnes × le prix par personne. */
export const montantVisite = (visite: Pick<VisiteAgritourisme, 'participants' | 'prixParPersonne'>): number =>
  arrondi(visite.participants * visite.prixParPersonne);

export interface BilanAgritourisme {
  /** Les visites comptées (à venir et faites, pas les annulées). */
  sorties: number;
  realisees: number;
  visiteurs: number;
  recettes: number;
  /** Les recettes par visiteur (rien sans visiteurs). */
  parVisiteur?: number;
}

/** Le bilan d'une liste de visites : combien de sorties et de visiteurs, et ce qu'elles rapportent. Les visites annulées ne comptent pas. */
export function bilanAgritourisme(visites: VisiteAgritourisme[]): BilanAgritourisme {
  const comptees = visites.filter((v) => STATUTS_VISITE_COMPTEES.includes(v.statut));
  const recettes = comptees.reduce((t, v) => t + montantVisite(v), 0);
  const visiteurs = comptees.reduce((t, v) => t + v.participants, 0);
  return {
    sorties: comptees.length,
    realisees: comptees.filter((v) => v.statut === STATUT_VISITE.REALISEE).length,
    visiteurs,
    recettes: arrondi(recettes),
    parVisiteur: visiteurs > 0 ? arrondi(recettes / visiteurs) : undefined,
  };
}

/** Ce que l'atelier Agritourisme de la Rentabilité donne pour une année : ses recettes, ses charges (celles qu'on y rattache) et sa marge. */
export interface AtelierAgritourisme {
  recettes: number;
  /** Les charges rattachées à l'atelier (le carburant du 4x4, les ingrédients…), saisies dans les factures avec l'atelier « Agritourisme ». */
  chargesDirectes: number;
  /** Les charges directes et sa part des charges communes (au prorata des recettes). */
  charges: number;
  marge: number;
}

/**
 * Les charges de l'agritourisme d'une année : elles ne se saisissent pas dans les formules mais dans les factures, avec l'atelier
 * « Agritourisme » ; la Rentabilité (marge par atelier) les calcule.
 */
export async function atelierAgritourisme(annee: number, horsTaxes: boolean): Promise<AtelierAgritourisme> {
  const r = await rentabilite(annee, { filtre: TOUTES_ACTIVITES, horsTaxes, laitier: false });
  const a = r.ateliers.find((x) => x.atelier === ATELIER.AGRITOURISME);
  return {
    recettes: a?.recettes ?? 0,
    chargesDirectes: a?.chargesDirectes ?? 0,
    charges: a?.charges ?? 0,
    marge: a?.marge ?? 0,
  };
}

/**
 * Les éléments qu'une formule peut comprendre : ceux que l'utilisateur a modifiés (renommés, ajoutés, retirés), à défaut ceux
 * d'office — visite de la ferme, parcours en 4x4, repas, dégustation de fromages.
 */
export function elementsDeFormule(archive: Pick<ArchiveCommercial, 'elementsFormule'>): ElementFormule[] {
  if (archive.elementsFormule) return archive.elementsFormule;
  const T = TEXTES.commercial.agritourisme;
  return (Object.values(ELEMENT_AGRITOURISME) as (keyof typeof T.elements)[]).map((id) => ({
    id,
    nom: T.elements[id],
    court: T.elementsCourts[id],
  }));
}

/** Ajoute un élément, ou renomme celui de même identifiant (le catalogue d'office devient alors celui de l'utilisateur). */
export async function enregistrerElementFormule(element: ElementFormule): Promise<void> {
  const archive = await lireArchiveCommercial();
  const actuels = elementsDeFormule(archive);
  const elementsFormule = actuels.some((e) => e.id === element.id)
    ? actuels.map((e) => (e.id === element.id ? { ...e, ...element } : e))
    : [...actuels, element];
  await remplacerArchiveCommercial({ ...archive, elementsFormule });
}

/** Retire un élément du catalogue, et des formules qui le comprenaient. */
export async function supprimerElementFormule(id: string): Promise<void> {
  const archive = await lireArchiveCommercial();
  await remplacerArchiveCommercial({
    ...archive,
    elementsFormule: elementsDeFormule(archive).filter((e) => e.id !== id),
    formules: archive.formules.map((f) => ({ ...f, elements: f.elements.filter((e) => e !== id) })),
  });
}

/** Enregistre une formule (la crée ou remplace celle de même identifiant). */
export async function enregistrerFormule(formule: FormuleAgritourisme): Promise<void> {
  const archive = await lireArchiveCommercial();
  const formules = archive.formules.some((f) => f.id === formule.id)
    ? archive.formules.map((f) => (f.id === formule.id ? formule : f))
    : [...archive.formules, formule];
  await remplacerArchiveCommercial({ ...archive, formules });
}

/** Supprime une formule : refusé (rien ne change) quand des visites s'y rapportent ; rend vrai si elle est supprimée. */
export async function supprimerFormule(id: string): Promise<boolean> {
  const archive = await lireArchiveCommercial();
  if (archive.visites.some((v) => v.formuleId === id)) return false;
  await remplacerArchiveCommercial({ ...archive, formules: archive.formules.filter((f) => f.id !== id) });
  return true;
}

/** Enregistre une visite (la crée ou remplace celle de même identifiant). */
export async function enregistrerVisite(visite: VisiteAgritourisme): Promise<void> {
  const archive = await lireArchiveCommercial();
  const visites = archive.visites.some((v) => v.id === visite.id)
    ? archive.visites.map((v) => (v.id === visite.id ? visite : v))
    : [...archive.visites, visite];
  await remplacerArchiveCommercial({ ...archive, visites });
}

/** Supprime une visite ; sa recette en comptabilité, s'il y en a une, est supprimée avec elle. */
export async function supprimerVisite(id: string): Promise<void> {
  const archive = await lireArchiveCommercial();
  const visite = archive.visites.find((v) => v.id === id);
  if (visite?.factureId) await supprimerFacture(visite.factureId);
  await remplacerArchiveCommercial({ ...archive, visites: archive.visites.filter((v) => v.id !== id) });
}

/**
 * Marque une visite comme réalisée : sa recette (personnes × prix) est inscrite en comptabilité, comme une « autre recette » du
 * compte d'agritourisme, rangée dans l'atelier Agritourisme de la rentabilité.
 */
export async function realiserVisite(
  visite: VisiteAgritourisme,
  formule: FormuleAgritourisme | undefined,
): Promise<VisiteAgritourisme> {
  const T = TEXTES.commercial.agritourisme;
  const facture = await enregistrerFacture({
    date: visite.date,
    type: TYPE_FACTURE.EMISE,
    tiers: visite.client,
    activite: ACTIVITE_COMMUNE,
    description: T.descriptionRecette(visite.formule, visite.participants),
    montant: montantVisite(visite),
    categorieRecette: CATEGORIE_RECETTE.AUTRE,
    compteManuel: COMPTE_AGRITOURISME.numero,
    atelier: ATELIER.AGRITOURISME,
    tauxTva: formule?.tauxTva ?? TAUX_TVA_AGRITOURISME,
    payee: visite.enAttente ? false : undefined,
    echeance: visite.enAttente && visite.echeance ? visite.echeance : undefined,
  });
  const realisee: VisiteAgritourisme = { ...visite, statut: STATUT_VISITE.REALISEE, factureId: facture.id };
  await enregistrerVisite(realisee);
  return realisee;
}

/** Défait la réalisation d'une visite : sa recette est supprimée et la visite redevient « à venir ». */
export async function defaireVisite(visite: VisiteAgritourisme): Promise<VisiteAgritourisme> {
  if (visite.factureId) await supprimerFacture(visite.factureId);
  const prevue: VisiteAgritourisme = { ...visite, statut: STATUT_VISITE.PREVUE, factureId: undefined };
  await enregistrerVisite(prevue);
  return prevue;
}
