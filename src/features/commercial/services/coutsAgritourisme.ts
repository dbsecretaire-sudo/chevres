import type { ElementFormule, FormuleAgritourisme, VisiteAgritourisme } from '@/features/commercial/types';
import { coutCarburantDeLaVisite } from '@/features/comptabilite/services/fraisTouristiques';
import type { Facture } from '@/features/comptabilite/types';
import type { Vehicule } from '@/features/settings/settings';
import { tvaDuTtc } from '@/features/entreprise/services/fiscaliteEntreprise';
import { STATUTS_VISITE_COMPTEES } from '@/shared/constants/agritourisme';
import { ATELIER } from '@/shared/constants/ateliers';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';

const T = TEXTES.commercial.agritourisme.couts;

const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;

/** Le regroupement des charges d'agritourisme qui ne concernent aucun élément en particulier : elles se partagent entre toutes les visites. */
export const ELEMENT_COMMUN = '';

/** Une dépense d'un élément (« Assurance tout risque », « Carburant ») et son montant sur l'année. */
export interface PosteCoutAgritourisme {
  libelle: string;
  montant: number;
}

/** Ce que coûte un élément (le 4x4, le repas…) sur l'année, et ce que chaque visite qui le comprend en supporte. */
export interface ComposantCout {
  /** L'identifiant de l'élément (vide : les charges communes à toutes les visites). */
  cle: string;
  libelle?: string;
  total: number;
  /** Le nombre de visites qui comprennent cet élément. */
  visites: number;
  /** La part d'une visite : le total divisé par ses visites. */
  parVisite: number;
  postes: PosteCoutAgritourisme[];
}

/** Ce que coûte une visite d'une formule : la somme de la part de chacun de ses éléments, et des charges communes. */
export interface CoutFormule {
  formule: FormuleAgritourisme;
  /** Les visites faites avec cette formule dans l'année. */
  visites: number;
  coutParVisite: number;
  composants: ComposantCout[];
}

export interface CoutsAgritourisme {
  formules: CoutFormule[];
  /** Les charges rattachées à un élément qu'aucune visite de l'année ne comprend : elles ne sont dans le coût d'aucune formule. */
  nonReparti: number;
  /** Toutes les charges de l'atelier Agritourisme de l'année. */
  total: number;
}

/**
 * Le coût de chaque formule par visite : les charges de l'atelier Agritourisme (les factures reçues avec cet atelier) sont rangées par
 * élément (le 4x4 : assurance tout risque, assurance RC exploitation, gazole…), chaque élément se répartit sur les visites qui le
 * comprennent, et une formule coûte la somme de ses éléments. Les charges sans élément se partagent entre toutes les visites.
 */
export function coutsParFormule(entree: {
  visites: VisiteAgritourisme[];
  formules: FormuleAgritourisme[];
  elements: ElementFormule[];
  factures: Facture[];
  horsTaxes: boolean;
  /** La flotte : le carburant d'une formule se calcule avec la consommation et le prix du litre de son véhicule touristique. */
  vehicules?: readonly Vehicule[];
}): CoutsAgritourisme {
  const { formules, elements, horsTaxes } = entree;
  const comptees = entree.visites.filter((v) => STATUTS_VISITE_COMPTEES.includes(v.statut));
  const montant = (f: Facture) =>
    horsTaxes && f.tauxTva ? f.montant - tvaDuTtc(f.montant, f.tauxTva) : f.montant;

  // Les charges de l'atelier, rangées par élément puis par dépense.
  const groupes = new Map<string, Map<string, number>>();
  for (const f of entree.factures) {
    if (f.type !== TYPE_FACTURE.RECUE || f.atelier !== ATELIER.AGRITOURISME) continue;
    const cle = f.elementAgri ?? ELEMENT_COMMUN;
    const libelle =
      f.description?.trim() ||
      (f.categorieDepense ? LABEL_CATEGORIE_DEPENSE[f.categorieDepense] : '') ||
      f.tiers;
    const postes = groupes.get(cle) ?? new Map<string, number>();
    postes.set(libelle, (postes.get(libelle) ?? 0) + montant(f));
    groupes.set(cle, postes);
  }
  const totalDuGroupe = (cle: string) => [...(groupes.get(cle)?.values() ?? [])].reduce((t, m) => t + m, 0);

  const formuleDe = (v: VisiteAgritourisme) => formules.find((f) => f.id === v.formuleId);
  const visitesAvec = (cle: string): number =>
    cle === ELEMENT_COMMUN
      ? comptees.length
      : comptees.filter((v) => formuleDe(v)?.elements.includes(cle)).length;

  const composantDe = (cle: string): ComposantCout | undefined => {
    const postes = groupes.get(cle);
    if (!postes) return undefined;
    const visites = visitesAvec(cle);
    const total = totalDuGroupe(cle);
    return {
      cle,
      libelle: cle === ELEMENT_COMMUN ? undefined : (elements.find((e) => e.id === cle)?.nom ?? cle),
      total: arrondi(total),
      visites,
      parVisite: visites > 0 ? arrondi(total / visites) : 0,
      postes: [...postes.entries()].map(([libelle, m]) => ({ libelle, montant: arrondi(m) })),
    };
  };

  /** Le carburant d'une visite de la formule : ses kilomètres en charge × la consommation du véhicule × le prix du litre (rien sans véhicule touristique renseigné). */
  const carburantDe = (formule: FormuleAgritourisme): ComposantCout | undefined => {
    const vehicule = entree.vehicules?.find((v) => v.id === formule.vehiculeId);
    const parVisite = coutCarburantDeLaVisite({
      km: formule.km,
      consommation: vehicule?.consommation,
      prixLitre: vehicule?.prixCarburant,
    });
    if (!vehicule || parVisite === undefined) return undefined;
    const visites = comptees.filter((v) => v.formuleId === formule.id).length;
    const total = arrondi(parVisite * visites);
    return {
      cle: `carburant:${formule.id}`,
      libelle: `${T.carburant} ${vehicule.plaque}`,
      total,
      visites,
      parVisite,
      postes: [
        {
          libelle: T.detailCarburant(formule.km ?? 0, vehicule.consommation ?? 0, vehicule.prixCarburant ?? 0),
          montant: total,
        },
      ],
    };
  };

  const resultat: CoutFormule[] = formules.map((formule) => {
    const carburant = carburantDe(formule);
    const composants = [...formule.elements, ELEMENT_COMMUN]
      .map(composantDe)
      .filter((c): c is ComposantCout => !!c)
      .concat(carburant ? [carburant] : []);
    return {
      formule,
      visites: comptees.filter((v) => v.formuleId === formule.id).length,
      coutParVisite: arrondi(composants.reduce((t, c) => t + c.parVisite, 0)),
      composants,
    };
  });

  const carburants = formules.reduce((t, formule) => t + (carburantDe(formule)?.total ?? 0), 0);
  const total = [...groupes.keys()].reduce((t, cle) => t + totalDuGroupe(cle), 0) + carburants;
  const nonReparti = [...groupes.keys()]
    .filter((cle) => visitesAvec(cle) === 0)
    .reduce((t, cle) => t + totalDuGroupe(cle), 0);
  return { formules: resultat, nonReparti: arrondi(nonReparti), total: arrondi(total) };
}
