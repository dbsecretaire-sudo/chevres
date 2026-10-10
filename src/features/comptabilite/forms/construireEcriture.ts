import {
  lignesAlimentationFinales,
  type LigneAlimentForm,
} from '@/features/comptabilite/forms/lignesAlimentation';
import {
  lignesMarchandisesFinales,
  type LigneMarchandiseForm,
} from '@/features/comptabilite/forms/lignesMarchandises';
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
  LigneMarchandise,
  LigneCarburant,
  TypeAide,
  TypeFacture,
  TypeFromage,
  UniteVente,
  Vente,
  NatureUrssaf,
} from '@/features/comptabilite/types';
import type { Client } from '@/features/clients/types';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_AVEC_PRECISION,
  CATEGORIES_VENTE_AVEC_DETAIL,
  CATEGORIES_VENTE_PRIX_INVENTAIRE,
  CATEGORIES_VENTE_VIANDE,
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  POURCENTAGE_MAX,
  POURCENTAGE_MIN,
  TYPE_AIDE,
  SEPARATEUR_ANIMAUX,
  TYPE_FACTURE,
  TYPE_FROMAGE,
  UNITE_VENTE,
  TYPE_CHOIX_FACTURE,
} from '@/shared/constants/comptabilite';
import { nomComplet } from '@/shared/utils/personne';
import { estDateISO } from '@/shared/utils/dates';
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
  /** Achat de production : l'article du stock acheté (vide : hors stock) et sa quantité. */
  stockArticle?: string;
  stockQuantite?: number;
  /** Un achat de boucles : le numéro de la première. */
  bouclesDebut?: string;
  /** Une dépense vétérinaire : le motif de la visite, et son inscription dans les visites vétérinaires. */
  motifVisite?: string;
  ajouterVisite?: boolean;
  lignesAlimentation: LigneAlimentForm[];
  /** Le détail des marchandises, quand l'achat est un achat de marchandises d'un gîte. */
  lignesMarchandises?: LigneMarchandiseForm[];
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
  /** Commentaire facultatif (viande, charcuterie, animal sur pied ou vivant). */
  precision: string;
  /** Pour un animal sur pied ou vivant : vrai si c'est un petit, faux si c'est un adulte. */
  jeune?: boolean;
  /** Les fiches des animaux vendus (animal sur pied ou vivant). */
  animaux: string[];
  /** Les lots des fromages vendus (un fromage qui a des lots se vend lot par lot). */
  fromages: string[];
  /** La date d'abattoir des animaux d'une vente de viande (vide : la date de la vente). */
  dateAbattoir?: string;
  clientSelectionne?: Client;
  /** Vrai si l'écriture est une vente de production (lait, fromage, cabris) plutôt qu'une facture. */
  estProductionVente: boolean;
  /** Vrai pour une recette d'entreprise assujettie à la TVA : le taux saisi est alors enregistré sur la facture émise. */
  tvaEmise: boolean;
  /** Le client souhaite que la vente soit déclarée (avec facture) : coché d'office. */
  avecFacture: boolean;
  /** La nature de la recette pour l'URSSAF (vide : selon la catégorie). */
  natureUrssaf: string;
  /** Le numéro de la facture d'une vente déclarée (obligatoire quand le client souhaite la déclarer). */
  numeroFacture: string;
}

export interface ErreurSaisie {
  titre: string;
  message?: string;
}

export type ResultatSaisie =
  { erreur: ErreurSaisie } | { vente: Omit<Vente, 'id'> } | { facture: Omit<Facture, 'id'> };

function construireVente(s: SaisieEcriture): ResultatSaisie {
  const categorie = s.categorieRecette as CategorieVente;
  const estViande = (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(categorie);
  const estAnimal = (CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(categorie);

  // Le client est obligatoire pour toute vente.
  if (!s.clientSelectionne) return { erreur: { titre: TEXTES.commun.general.clientRequis } };

  // Une vente que le client souhaite déclarer a un numéro de facture.
  if (s.avecFacture && !s.numeroFacture.trim()) {
    return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.numeroFactureRequis } };
  }

  // Le détail de la vente (la ligne de l'inventaire vendue) est obligatoire pour la viande et la boucherie / charcuterie.
  if ((CATEGORIES_VENTE_AVEC_DETAIL as readonly string[]).includes(categorie) && !s.precision.trim()) {
    return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.detailRequis } };
  }

  // La quantité est toujours obligatoire ; celle d'une vente de viande est le nombre d'animaux choisis.
  const lotsDeFromages = categorie === CATEGORIE_VENTE.FROMAGE ? s.fromages.length : 0;
  const quantiteNum =
    categorie === CATEGORIE_VENTE.VIANDE
      ? s.animaux.length || parseDecimal(s.quantite)
      : lotsDeFromages || parseDecimal(s.quantite);
  if (quantiteNum <= 0) return { erreur: { titre: TEXTES.commun.general.quantiteInvalide } };

  // Le prix total est obligatoire pour toute vente ; quand il vient de l'inventaire, c'est qu'il n'y est pas défini.
  const prixNum = parseDecimal(s.montant);
  if (!prixNum || prixNum < 0) {
    return {
      erreur: (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(categorie)
        ? {
            titre: TEXTES.comptabilite.nouvelleEcriture.prixAFixerTitre,
            message: TEXTES.comptabilite.nouvelleEcriture.prixAFixerMessage,
          }
        : { titre: TEXTES.commun.general.prixInvalide },
    };
  }

  const estFromage = s.categorieRecette === CATEGORIE_RECETTE.FROMAGE;
  return {
    vente: {
      activite: s.activite,
      date: s.date,
      categorie,
      typeFromage: estFromage ? s.typeFromage : undefined,
      typeFromageLibre:
        estFromage && s.typeFromage === TYPE_FROMAGE.AUTRE ? s.typeFromageLibre.trim() : undefined,
      quantite: quantiteNum,
      unite:
        s.categorieRecette === CATEGORIE_RECETTE.LAIT
          ? UNITE_VENTE.LITRES
          : estAnimal || estViande || estFromage || categorie === CATEGORIE_VENTE.OEUFS
            ? UNITE_VENTE.PIECE
            : s.unite,
      prix: prixNum,
      tauxTva: parseDecimal(s.tauxTvaVente),
      client: s.clientSelectionne ? nomComplet(s.clientSelectionne) : undefined,
      poidsKg:
        (estAnimal || estViande) && s.poidsKg.trim() ? parseDecimal(s.poidsKg) || undefined : undefined,
      jeune: estViande && s.jeune ? true : undefined,
      animaux: estViande && s.animaux.length > 0 ? s.animaux.join(SEPARATEUR_ANIMAUX) : undefined,
      fromages: lotsDeFromages > 0 ? s.fromages.join(SEPARATEUR_ANIMAUX) : undefined,
      dateAbattoir:
        estViande && s.animaux.length > 0 && s.dateAbattoir && s.dateAbattoir !== s.date
          ? s.dateAbattoir
          : undefined,
      precision: (CATEGORIES_VENTE_AVEC_PRECISION as readonly string[]).includes(categorie)
        ? s.precision.trim() || undefined
        : undefined,
      choixFacture: s.avecFacture ? TYPE_CHOIX_FACTURE.AVEC_FACTURE : TYPE_CHOIX_FACTURE.SANS_FACTURE,
      numeroFacture: s.avecFacture ? s.numeroFacture.trim() : undefined,
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
  let lignesMarchandises: LigneMarchandise[] | undefined;

  if (estAlimentation) {
    lignesAlimentation = lignesAlimentationFinales(s.lignesAlimentation, s.activite);
    if (lignesAlimentation.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        },
      };
    }
    montantFinal = totalMontants(s.lignesAlimentation);
  } else if (estRecue && s.lignesMarchandises) {
    lignesMarchandises = lignesMarchandisesFinales(s.lignesMarchandises);
    if (lignesMarchandises.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        },
      };
    }
    montantFinal = totalMontants(s.lignesMarchandises);
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

  const stockProduction =
    estRecue &&
    (s.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION || s.categorieDepense === CATEGORIE_DEPENSE.AUTRE) &&
    !!s.stockArticle;
  if (stockProduction && !(s.stockQuantite && s.stockQuantite > 0)) {
    return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.stockProduction.quantiteRequise } };
  }

  const visite = estRecue && s.categorieDepense === CATEGORIE_DEPENSE.VETERINAIRE;
  if (visite && s.ajouterVisite && !s.motifVisite?.trim()) {
    return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.visite.motifRequis } };
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
      lignesMarchandises,
      stockArticle: stockProduction ? s.stockArticle : undefined,
      stockQuantite: stockProduction ? s.stockQuantite : undefined,
      bouclesDebut: stockProduction && s.bouclesDebut ? s.bouclesDebut : undefined,
      motifVisite: visite && s.motifVisite?.trim() ? s.motifVisite.trim() : undefined,
      visiteVeterinaire: visite && s.ajouterVisite ? true : undefined,
      categorieRecette: estEmise ? s.categorieRecette : undefined,
      typeAide: estAide ? s.typeAide : undefined,
      typeAideLibre:
        estAide && s.typeAide === TYPE_AIDE.AUTRE ? s.typeAideLibre.trim() || undefined : undefined,
      tauxImposition: estAide
        ? Math.min(POURCENTAGE_MAX, Math.max(POURCENTAGE_MIN, parseDecimal(s.tauxImpositionLibre)))
        : undefined,
      lignesCarburant,
      natureUrssaf: estEmise && s.natureUrssaf ? (s.natureUrssaf as NatureUrssaf) : undefined,
      compteManuel:
        estRecue && s.categorieDepense === CATEGORIE_DEPENSE.AUTRE
          ? s.compteDepenseAutre
          : estEmise && s.categorieRecette === CATEGORIE_RECETTE.AUTRE
            ? s.compteRecetteAutre
            : undefined,
      tauxTva: estRecue
        ? parseDecimal(s.tauxTvaAchat)
        : s.tvaEmise
          ? parseDecimal(s.tauxTvaVente)
          : undefined,
    },
  };
}

/** Valide la saisie et la convertit en vente ou en facture prête à enregistrer (ou renvoie l'erreur à afficher). */
export function construireEcriture(saisie: SaisieEcriture): ResultatSaisie {
  // La date est obligatoire : une année imposée vide (« 2026- » seul) n'est pas une date.
  if (!estDateISO(saisie.date)) return { erreur: { titre: TEXTES.commun.dateField.invalide } };
  return saisie.estProductionVente ? construireVente(saisie) : construireFacture(saisie);
}
