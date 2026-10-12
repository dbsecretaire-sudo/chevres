import { listFactures } from '@/features/comptabilite/repository/factures';
import { listComptesPcg } from '@/features/comptes-pcg/repository';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { activiteFacture, activiteVente, partsDeFacture } from '@/features/comptabilite/utils/activite';
import { tvaDuTtc } from '@/features/entreprise/services/fiscaliteEntreprise';
import { TOUTES_ACTIVITES, type FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { lireArchiveStock } from '@/features/stock/repository';
import { bilanLait } from '@/features/stock/services/stock';
import { ATELIER, ATELIER_PAR_CATEGORIE_VENTE, type Atelier } from '@/shared/constants/ateliers';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { COMPTE_PAR_DEPENSE } from '@/shared/constants/planComptable';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { yearOf } from '@/shared/utils/dates';

// La rentabilité : les recettes et les charges de l'année, atelier par atelier, d'après les ventes et les factures saisies. Une charge
// commune (sans atelier) se répartit entre les ateliers au prorata de leurs recettes. Une indication de gestion, pas une comptabilité.

/** Les charges qui n'entrent pas dans la rentabilité de l'exploitation : le compte de trading, les remboursements faits à un client. */
const CHARGES_EXCLUES: readonly string[] = [
  CATEGORIE_DEPENSE.RETRAIT,
  CATEGORIE_DEPENSE.PERTES_TRADING,
  CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT,
];

/** Les recettes qui ne sont pas de l'activité : les dépôts sur le compte, les dons. Les aides sont suivies à part. */
const RECETTES_EXCLUES: readonly string[] = [CATEGORIE_RECETTE.DEPOT, CATEGORIE_RECETTE.DONS];

export interface LigneAtelier {
  atelier: Atelier;
  recettes: number;
  /** Les charges rattachées à cet atelier, et sa part des charges communes. */
  chargesDirectes: number;
  chargesCommunes: number;
  charges: number;
  marge: number;
  /** La marge en % des recettes (rien quand l'atelier n'a pas de recettes). */
  tauxMarge?: number;
}

export interface PosteCharges {
  /** La catégorie de dépense ; pour « Autre », le numéro du compte choisi (« autre:645100 »), un poste par compte. */
  categorie: string;
  /** Le nom du compte comptable d'un poste « Autre » (« Cotisations MSA »), quand on le connaît. */
  libelle?: string;
  montant: number;
  /** Sa part des charges totales (0 à 1). */
  part: number;
}

export interface Rentabilite {
  annee: number;
  /** Vrai quand les montants sont hors taxes (régime de TVA réel) : sinon toutes taxes comprises. */
  horsTaxes: boolean;
  ateliers: LigneAtelier[];
  recettes: number;
  charges: number;
  aides: number;
  /** Le résultat avec les aides, et ce qu'il serait sans elles. */
  resultat: number;
  resultatSansAides: number;
  postes: PosteCharges[];
  /** Le lait produit dans l'année (litres), s'il est tenu au stock. */
  litresProduits: number;
  /** Le coût de production d'un litre de lait : toutes les charges par litre produit (rien sans litres ni sans charges). */
  coutParLitre?: number;
  /** Les charges totales par animal présent (rien sans effectif). */
  coutParAnimal?: number;
  /** Les charges d'un poste par animal et par litre, quand l'effectif et les litres sont connus : voir postes. */
  effectif?: number;
}

export interface EntreeRentabilite {
  annee: number;
  ventes: Vente[];
  factures: Facture[];
  filtre: FiltreActivite;
  /** Vrai : les montants s'entendent hors taxes (TVA déduite d'après le taux saisi). */
  horsTaxes: boolean;
  /** Le lait produit dans l'année (litres), et le nombre d'animaux présents (pour les coûts par litre et par animal). */
  litresProduits?: number;
  effectif?: number;
  /** Les noms des comptes comptables par numéro, pour nommer les postes « Autre » d'après leur compte. */
  comptes?: Record<string, string>;
}

/** Ce qui sépare le groupe d'un compte de son détail dans son nom (« Assurance — Multirisques »). */
const SEPARATEUR_GROUPE_COMPTE = ' — ';

const arrondi = (valeur: number) => Math.round(valeur * 100) / 100;

/** La rentabilité d'une année, d'après les ventes et les factures données (calcul pur). */
export function calculerRentabilite(entree: EntreeRentabilite): Rentabilite {
  const { annee, filtre, horsTaxes } = entree;
  const retenue = (activite: string) => filtre === TOUTES_ACTIVITES || activite === filtre;
  /** Un montant TTC, hors taxes quand le régime le veut et que le taux est connu. */
  const montant = (ttc: number, taux?: number) => (horsTaxes && taux ? ttc - tvaDuTtc(ttc, taux) : ttc);

  /** Le nom d'un compte (celui du plan comptable, à défaut son numéro). */
  const nomDuCompte = (numero: string): string =>
    entree.comptes?.[numero] ??
    (numero === COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.AUTRE].numero
      ? COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.AUTRE].libelle
      : numero);
  /** Le groupe d'un compte : ce qui précède « — » dans son nom (« Assurance »), à défaut son numéro. */
  const groupeDuCompte = (numero: string): string => {
    const [debut, suite] = nomDuCompte(numero).split(SEPARATEUR_GROUPE_COMPTE);
    return suite !== undefined && debut.trim() ? debut.trim() : numero;
  };

  const recettes = new Map<Atelier, number>();
  const directes = new Map<Atelier, number>();
  let communes = 0;
  let aides = 0;
  const postes = new Map<string, number>();

  for (const v of entree.ventes) {
    if (!retenue(activiteVente(v))) continue;
    const atelier = ATELIER_PAR_CATEGORIE_VENTE[v.categorie] ?? ATELIER.AUTRES;
    recettes.set(atelier, (recettes.get(atelier) ?? 0) + montant(v.prix ?? 0, v.tauxTva));
  }

  for (const f of entree.factures) {
    if (f.type === TYPE_FACTURE.EMISE) {
      const categorie = f.categorieRecette;
      if (categorie && RECETTES_EXCLUES.includes(categorie)) continue;
      // Une recette d'une autre activité que celle choisie n'est pas comptée ; les aides, suivies à part, non plus dans les recettes.
      if (!retenue(activiteFacture(f))) continue;
      if (categorie === CATEGORIE_RECETTE.AIDE) {
        aides += f.montant;
        continue;
      }
      recettes.set(ATELIER.AUTRES, (recettes.get(ATELIER.AUTRES) ?? 0) + montant(f.montant, f.tauxTva));
      continue;
    }
    if (f.categorieDepense && CHARGES_EXCLUES.includes(f.categorieDepense)) continue;
    for (const part of partsDeFacture(f)) {
      if (!retenue(part.activite)) continue;
      const charge = montant(part.facture.montant, f.tauxTva);
      const categorie = f.categorieDepense ?? CATEGORIE_DEPENSE.AUTRE;
      // Une dépense « Autre » a son compte comptable (celui par défaut, à défaut d'un autre) : chaque compte est un poste à part, et
      // les comptes dont le nom commence pareil avant « — » (« Assurance — Multirisques », « Assurance — Responsabilité civile ») n'en font qu'un.
      const poste =
        categorie === CATEGORIE_DEPENSE.AUTRE
          ? `${categorie}:${groupeDuCompte(f.compteManuel ?? COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.AUTRE].numero)}`
          : categorie;
      postes.set(poste, (postes.get(poste) ?? 0) + charge);
      // L'atelier de la facture ne vaut que pour les lignes de son activité : l'aliment d'un autre cheptel (porcs…) est une charge commune.
      const dansSonActivite = part.activite === activiteFacture(f) || activiteFacture(f) === ACTIVITE_COMMUNE;
      const atelier = dansSonActivite ? (f.atelier as Atelier | undefined) : undefined;
      if (atelier) directes.set(atelier, (directes.get(atelier) ?? 0) + charge);
      else communes += charge;
    }
  }

  // Les charges communes se répartissent entre les ateliers qui ont des recettes, au prorata de ces recettes.
  const recettesTotal = [...recettes.values()].reduce((t, x) => t + x, 0);
  const atelierPresents = new Set<Atelier>([...recettes.keys(), ...directes.keys()]);
  const lignes: LigneAtelier[] = [...atelierPresents].map((atelier) => {
    const rec = recettes.get(atelier) ?? 0;
    const dir = directes.get(atelier) ?? 0;
    const com = recettesTotal > 0 ? (communes * rec) / recettesTotal : 0;
    const charges = dir + com;
    return {
      atelier,
      recettes: arrondi(rec),
      chargesDirectes: arrondi(dir),
      chargesCommunes: arrondi(com),
      charges: arrondi(charges),
      marge: arrondi(rec - charges),
      tauxMarge: rec > 0 ? (rec - charges) / rec : undefined,
    };
  });
  lignes.sort((a, b) => b.recettes - a.recettes);

  // Sans recettes pour les répartir, les charges communes restent à part : elles comptent dans le total.
  const chargesTotal = [...postes.values()].reduce((t, x) => t + x, 0);
  const litresProduits = entree.litresProduits ?? 0;
  /** Le nom d'un poste « Autre » : son groupe (« Assurance »), ou le nom de son compte quand il est seul ; rien pour les autres catégories. */
  const libelleDuCompte = (poste: string): string | undefined => {
    const groupe = poste.split(':')[1];
    return groupe === undefined ? undefined : /^\d+$/.test(groupe) ? nomDuCompte(groupe) : groupe;
  };
  const effectif = entree.effectif && entree.effectif > 0 ? entree.effectif : undefined;

  return {
    annee,
    horsTaxes,
    ateliers: lignes,
    recettes: arrondi(recettesTotal),
    charges: arrondi(chargesTotal),
    aides: arrondi(aides),
    resultat: arrondi(recettesTotal + aides - chargesTotal),
    resultatSansAides: arrondi(recettesTotal - chargesTotal),
    postes: [...postes.entries()]
      .map(([categorie, m]) => ({
        categorie,
        libelle: libelleDuCompte(categorie),
        montant: arrondi(m),
        part: chargesTotal > 0 ? m / chargesTotal : 0,
      }))
      .sort((a, b) => b.montant - a.montant),
    litresProduits,
    coutParLitre: litresProduits > 0 && chargesTotal > 0 ? chargesTotal / litresProduits : undefined,
    coutParAnimal: effectif ? chargesTotal / effectif : undefined,
    effectif,
  };
}

/**
 * Le lait produit dans l'année (litres), comme l'inventaire le compte : les litres notés, ou au moins ce qui a servi aux
 * fabrications et ce qui s'est vendu (le lait vendu ou utilisé a forcément été produit).
 */
export async function litresProduitsDeLAnnee(annee: number, ventes: Vente[]): Promise<number> {
  const archive = await lireArchiveStock();
  const deLAnnee = (date: string) => yearOf(date) === annee;
  const litresVendus = ventes
    .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT && deLAnnee(v.date))
    .reduce((t, v) => t + (v.quantite ?? 0), 0);
  return bilanLait(
    {
      ...archive,
      lait: (archive.lait ?? []).filter((l) => deLAnnee(l.date)),
      mouvements: archive.mouvements.filter((m) => deLAnnee(m.date)),
    },
    litresVendus,
  ).produit;
}

/** La rentabilité d'une année, d'après les ventes et factures enregistrées. */
export async function rentabilite(
  annee: number,
  options: { filtre: FiltreActivite; horsTaxes: boolean; effectif?: number; laitier?: boolean },
): Promise<Rentabilite> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);
  // Pas de lait pour une espèce qui n'en produit pas (cochons, poules) : le coût du litre n'a pas de sens.
  const litresProduits = options.laitier === false ? 0 : await litresProduitsDeLAnnee(annee, ventes);
  const comptes = Object.fromEntries((await listComptesPcg()).map((c) => [c.numero, c.libelle]));
  return calculerRentabilite({ annee, ventes, factures, litresProduits, comptes, ...options });
}
