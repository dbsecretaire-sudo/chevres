import {
  lignesAlimentationFinales,
  type LigneAlimentForm,
} from '@/features/comptabilite/forms/lignesAlimentation';
import {
  lignesCarburantFinales,
  type LigneCarburantForm,
} from '@/features/comptabilite/forms/lignesCarburant';
import type {
  ActiviteComptable,
  CategorieDepense,
  CategorieRecette,
  CategorieVente,
  Facture,
  LigneAlimentation,
  LigneCarburant,
  TypeAide,
  TypeFacture,
  TypeFromage,
  UniteVente,
  Vente,
} from '@/features/comptabilite/types';
import type { Client } from '@/features/clients/types';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  POURCENTAGE_MAX,
  POURCENTAGE_MIN,
  TYPE_AIDE,
  TYPE_FACTURE,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import { nomComplet } from '@/shared/utils/personne';
import { parseDecimal, totalMontants } from '@/shared/utils/nombres';
import { TEXTES } from '@/shared/textes';

/** Toutes les valeurs saisies dans le formulaire « Nouvelle écriture » (tout en texte, converti ici). */
export interface SaisieEcriture {
  activite: ActiviteComptable;
  type: TypeFacture;
  date: string;
  tiers: string;
  description: string;
  montant: string;
  categorieDepense: CategorieDepense;
  lignesAlimentation: LigneAlimentForm[];
  lignesCarburant: LigneCarburantForm[];
  categorieRecette: CategorieRecette;
  typeFromage: TypeFromage;
  typeFromageLibre: string;
  quantite: string;
  unite: UniteVente;
  typeAide: TypeAide;
  typeAideLibre: string;
  tauxImpositionLibre: string;
  compteDepenseAutre: string;
  compteRecetteAutre: string;
  tauxTvaVente: string;
  tauxTvaAchat: string;
  poidsKg: string;
  clientSelectionne?: Client;
  /** Vrai si l'écriture est une vente de production (lait, fromage, cabris) plutôt qu'une facture. */
  estProductionVente: boolean;
}

export interface ErreurSaisie {
  titre: string;
  message?: string;
}

export type ResultatSaisie =
  { erreur: ErreurSaisie } | { vente: Omit<Vente, 'id'> } | { facture: Omit<Facture, 'id'> };

function construireVente(s: SaisieEcriture): ResultatSaisie {
  const quantiteNum = parseDecimal(s.quantite);
  if (quantiteNum <= 0) return { erreur: { titre: TEXTES.commun.general.quantiteInvalide } };

  let prixNum: number | undefined;
  if (s.categorieRecette !== CATEGORIE_RECETTE.LAIT) {
    prixNum = parseDecimal(s.montant);
    if (!prixNum || prixNum < 0) return { erreur: { titre: TEXTES.commun.general.prixInvalide } };
  } else if (s.montant.trim()) {
    prixNum = parseDecimal(s.montant) || undefined;
  }

  const estFromage = s.categorieRecette === CATEGORIE_RECETTE.FROMAGE;
  const estCabris = s.categorieRecette === CATEGORIE_RECETTE.CABRIS;
  return {
    vente: {
      activite: s.activite,
      date: s.date,
      categorie: s.categorieRecette as CategorieVente,
      typeFromage: estFromage ? s.typeFromage : undefined,
      typeFromageLibre:
        estFromage && s.typeFromage === TYPE_FROMAGE.AUTRE ? s.typeFromageLibre.trim() : undefined,
      quantite: quantiteNum,
      unite:
        s.categorieRecette === CATEGORIE_RECETTE.LAIT
          ? UNITE_VENTE.LITRES
          : estCabris
            ? UNITE_VENTE.PIECE
            : s.unite,
      prix: prixNum,
      tauxTva: parseDecimal(s.tauxTvaVente),
      client: s.clientSelectionne ? nomComplet(s.clientSelectionne) : undefined,
      poidsKg: estCabris && s.poidsKg.trim() ? parseDecimal(s.poidsKg) || undefined : undefined,
    },
  };
}

function construireFacture(s: SaisieEcriture): ResultatSaisie {
  const estRecue = s.type === TYPE_FACTURE.RECUE;
  const estEmise = s.type === TYPE_FACTURE.EMISE;

  const tiersFinal = estEmise && s.clientSelectionne ? nomComplet(s.clientSelectionne) : s.tiers.trim();
  if (!tiersFinal) {
    return {
      erreur: {
        titre: estRecue ? TEXTES.commun.general.fournisseurRequis : TEXTES.commun.general.clientRequis,
      },
    };
  }

  const estAlimentation = estRecue && s.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION;
  const estCarburant = estRecue && s.categorieDepense === CATEGORIE_DEPENSE.CARBURANT;
  const estAide = estEmise && s.categorieRecette === CATEGORIE_RECETTE.AIDE;

  let montantFinal: number;
  let lignesAlimentation: LigneAlimentation[] | undefined;
  let lignesCarburant: LigneCarburant[] | undefined;

  if (estAlimentation) {
    lignesAlimentation = lignesAlimentationFinales(s.lignesAlimentation);
    if (lignesAlimentation.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        },
      };
    }
    montantFinal = totalMontants(s.lignesAlimentation);
  } else if (estCarburant) {
    lignesCarburant = lignesCarburantFinales(s.lignesCarburant);
    if (lignesCarburant.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontantPour,
        },
      };
    }
    montantFinal = totalMontants(s.lignesCarburant);
  } else {
    montantFinal = parseDecimal(s.montant);
    if (montantFinal <= 0) return { erreur: { titre: TEXTES.commun.general.montantInvalide } };
  }

  return {
    facture: {
      activite: s.activite,
      date: s.date,
      type: s.type,
      tiers: tiersFinal,
      description: s.description.trim(),
      montant: montantFinal,
      categorieDepense: estRecue ? s.categorieDepense : undefined,
      lignesAlimentation,
      categorieRecette: estEmise ? s.categorieRecette : undefined,
      typeAide: estAide ? s.typeAide : undefined,
      typeAideLibre:
        estAide && s.typeAide === TYPE_AIDE.AUTRE ? s.typeAideLibre.trim() || undefined : undefined,
      tauxImposition: estAide
        ? Math.min(POURCENTAGE_MAX, Math.max(POURCENTAGE_MIN, parseDecimal(s.tauxImpositionLibre)))
        : undefined,
      lignesCarburant,
      compteManuel:
        estRecue && s.categorieDepense === CATEGORIE_DEPENSE.AUTRE
          ? s.compteDepenseAutre
          : estEmise && s.categorieRecette === CATEGORIE_RECETTE.AUTRE
            ? s.compteRecetteAutre
            : undefined,
      tauxTva: estRecue ? parseDecimal(s.tauxTvaAchat) : undefined,
    },
  };
}

/** Valide la saisie et la convertit en vente ou en facture prête à enregistrer (ou renvoie l'erreur à afficher). */
export function construireEcriture(saisie: SaisieEcriture): ResultatSaisie {
  return saisie.estProductionVente ? construireVente(saisie) : construireFacture(saisie);
}
