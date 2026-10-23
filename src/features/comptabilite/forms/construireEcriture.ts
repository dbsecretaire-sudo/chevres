import {
  lignesAlimentationFinales,
  type LigneAlimentForm,
} from '@/features/comptabilite/forms/lignesAlimentation';
import {
  lignesMarchandisesFinales,
  type LigneMarchandiseForm,
} from '@/features/comptabilite/forms/lignesMarchandises';
import {
  lignesProductionFinales,
  type LigneProductionForm,
} from '@/features/comptabilite/forms/lignesProduction';
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
  LigneChambre,
  LigneVeterinaire,
  LigneMarchandise,
  LigneProduction,
  LigneCarburant,
  TypeAide,
  TypeFacture,
  TypeFromage,
  UniteVente,
  Vente,
  NatureUrssaf,
} from '@/features/comptabilite/types';
import { lignesChambreFinales, type LigneChambreForm } from '@/features/comptabilite/forms/lignesChambre';
import { lignesVeterinaireRetenues } from '@/features/comptabilite/forms/lignesVeterinaire';
import {
  fraisAbattoirFacturesAuClient,
  fraisAbattoirMemeOfferts,
  numeroFactureLibre,
  prixLibre,
} from '@/features/clients/services/categorie';
import type { Client } from '@/features/clients/types';
import { ATELIER } from '@/shared/constants/ateliers';
import { categorieAvecVehicule } from '@/features/exploitation/services/flotte';
import { MOTIF_NUMERO_FACTURE_NUMERIQUE } from '@/shared/constants/clients';
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
import { reglageEtatAnimaux } from '@/features/comptabilite/utils/ventes';
import { ROLE_VIANDE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
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
  /** Une dépense qui n'a pas été facturée (pas de TVA à déduire). */
  sansFacture?: boolean;
  /** Une dépense offerte par le fournisseur (un cadeau) : ses lignes dont le bouton « Cadeau » est actif comptent 0 €. */
  offertDepense?: boolean;
  /** Dépense offerte sans détail par ligne : le bouton « Cadeau » du montant (faux : il est facturé ; absent : offert). */
  cadeauMontant?: boolean;
  /** Un achat de boucles : le numéro de la première. */
  bouclesDebut?: string;
  /** Une dépense vétérinaire : le motif de la visite, et son inscription dans les visites vétérinaires. */
  motifVisite?: string;
  ajouterVisite?: boolean;
  lignesAlimentation: LigneAlimentForm[];
  /** Le détail des marchandises, quand l'achat est un achat de marchandises d'un gîte. */
  lignesMarchandises?: LigneMarchandiseForm[];
  lignesCarburant: LigneCarburantForm[];
  /** Le détail par fourniture d'un achat de production. */
  lignesProduction?: LigneProductionForm[];
  /** Le détail par article d'une facture de la Chambre d'agriculture (absent : une autre facture). */
  lignesChambre?: LigneChambreForm[];
  /** Une dépense vétérinaire : tout ce qui a été fait lors de la visite (pour le carnet sanitaire). */
  lignesVeterinaire?: LigneVeterinaire[];
  categorieRecette: CategorieRecette;
  typeFromage: TypeFromage;
  typeFromageLibre: string;
  quantite: string;
  unite: UniteVente;
  typeAide: TypeAide;
  typeAideLibre: string;
  tauxImpositionLibre: string;
  compteDepenseAutre: string;
  /** Le nom de la catégorie de dépense ajoutée par l'utilisateur, quand c'est elle qui est choisie (sinon vide). */
  categoriePerso: string;
  compteRecetteAutre: string;
  tauxTvaVente: string;
  tauxTvaAchat: string;
  /** Une vente de viande : les frais d'abattoir refacturés (texte saisi) et leur taux de TVA (vide : celui de la vente). */
  fraisAbattoir: string;
  tauxTvaFrais: string;
  poidsKg: string;
  /** Commentaire facultatif (viande, charcuterie, animal sur pied ou vivant). */
  precision: string;
  /** Pour un animal sur pied ou vivant : vrai si c'est un petit, faux si c'est un adulte. */
  jeune?: boolean;
  /** Vente de viande : l'état des animaux à la remise (vide : à l'abattoir). */
  etatAnimaux?: string;
  /** Le rôle de la ligne de viande choisie (cabris, sur pied, vivant) et un client abattoir : voir reglageEtatAnimaux. */
  roleDuDetail?: string;
  clientAbattoir?: boolean;
  /** Les fiches des animaux vendus (animal sur pied ou vivant). */
  animaux: string[];
  /** Les lots vendus (un fromage ou une charcuterie qui a des lots se vend lot par lot). */
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
  /** L'atelier d'une facture reçue (vide : une charge commune). */
  atelier?: string;
  /** Le véhicule de la flotte d'une réparation ou d'une assurance (vide : aucun). */
  vehiculeId?: string;
  /** Ce qu'une assurance couvre (vide : non précisé). */
  objetAssurance?: string;
  /** Le motif d'une réparation ou de l'indemnité d'une assurance. */
  motif?: string;
  /** Le volet d'une association ou d'une coopérative agricole (vide : non précisé). */
  voletCooperative?: string;
  /** L'élément de l'agritourisme d'une charge de l'atelier Agritourisme (vide : toutes les visites). */
  elementAgri?: string;
  /** Le paiement n'a pas encore eu lieu (faux : payée à la date de l'écriture), et sa date prévue. */
  enAttente?: boolean;
  echeance?: string;
  /** La vente est un réajustement (récolteur) : ni litrage ni numéro de facture. */
  reajustement?: boolean;
  /** La vente est offerte au client : prix à 0 €. */
  offert?: boolean;
  /** Des animaux vivants vendus au poids vif (réforme) : le prix au kilo se saisit. */
  venduAuPoids?: boolean;
  /** Le prix unitaire personnalisé saisi (il remplace celui de l'inventaire pour cette vente). */
  prixUnitairePersonnalise?: number;
  /** Vente offerte : les animaux (la viande) sont offerts ; faux, ils sont facturés (d'office : offerts). */
  cadeauProduit?: boolean;
  /** Vente offerte : les frais d'abattoir sont offerts (non facturés) ; faux, ils sont refacturés. */
  fraisOfferts?: boolean;
  /** Le circuit de vente d'une vente (vide : non précisé). */
  circuit?: string;
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
  if (s.avecFacture && !s.reajustement && !s.numeroFacture.trim()) {
    return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.numeroFactureRequis } };
  }

  // Hors récolteur, le numéro de facture est fait de chiffres (et de tirets, barres, points).
  if (
    s.avecFacture &&
    !s.reajustement &&
    !numeroFactureLibre(s.clientSelectionne) &&
    !MOTIF_NUMERO_FACTURE_NUMERIQUE.test(s.numeroFacture)
  ) {
    return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.numeroFactureNumerique } };
  }

  // Le détail de la vente (la ligne de l'inventaire vendue) est obligatoire pour la viande et la boucherie / charcuterie.
  if ((CATEGORIES_VENTE_AVEC_DETAIL as readonly string[]).includes(categorie) && !s.precision.trim()) {
    return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.detailRequis } };
  }

  // La quantité est toujours obligatoire ; celle d'une vente de viande est le nombre d'animaux choisis.
  const lotsDeFromages =
    categorie === CATEGORIE_VENTE.FROMAGE ||
    categorie === CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE ||
    categorie === CATEGORIE_VENTE.SAVONS
      ? s.fromages.length
      : 0;
  const quantiteNum =
    categorie === CATEGORIE_VENTE.VIANDE
      ? s.animaux.length || parseDecimal(s.quantite)
      : lotsDeFromages || parseDecimal(s.quantite);
  if (!s.reajustement && quantiteNum <= 0) {
    return { erreur: { titre: TEXTES.commun.general.quantiteInvalide } };
  }

  // Le prix total est obligatoire pour toute vente ; quand il vient de l'inventaire, c'est qu'il n'y est pas défini.
  // Une vente offerte : chaque ligne (les animaux, les frais d'abattoir) a son bouton « Cadeau » ; la ligne offerte ne se facture pas.
  const produitOffert = !!s.offert && s.cadeauProduit !== false;
  const prixNum = produitOffert ? 0 : parseDecimal(s.montant);
  if (!produitOffert && (!prixNum || prixNum < 0)) {
    return {
      erreur:
        (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(categorie) &&
        !prixLibre(s.clientSelectionne)
          ? {
              titre: TEXTES.comptabilite.nouvelleEcriture.prixAFixerTitre,
              message: TEXTES.comptabilite.nouvelleEcriture.prixAFixerMessage,
            }
          : { titre: TEXTES.commun.general.prixInvalide },
    };
  }

  const estFromage = s.categorieRecette === CATEGORIE_RECETTE.FROMAGE;
  // Les frais d'abattoir se facturent quand la catégorie du client les facture ; dans une vente offerte, seul le bouton « Cadeau » des frais
  // les offre (d'office : offerts, sauf si la catégorie les facture expressément : Organisation › Catégories de contact).
  const fraisOffertsParDefaut = !fraisAbattoirMemeOfferts(s.clientSelectionne);
  const fraisOfferts = !!s.offert && (s.fraisOfferts ?? fraisOffertsParDefaut);
  const frais =
    categorie === CATEGORIE_VENTE.VIANDE &&
    s.roleDuDetail !== ROLE_VIANDE.VIVANT &&
    fraisAbattoirFacturesAuClient(s.clientSelectionne) &&
    !fraisOfferts
      ? parseDecimal(s.fraisAbattoir)
      : 0;
  return {
    vente: {
      activite: s.activite,
      date: s.date,
      categorie,
      typeFromage: estFromage ? s.typeFromage : undefined,
      typeFromageLibre:
        estFromage && s.typeFromage === TYPE_FROMAGE.AUTRE ? s.typeFromageLibre.trim() : undefined,
      quantite: s.reajustement ? 0 : quantiteNum,
      unite:
        s.categorieRecette === CATEGORIE_RECETTE.LAIT
          ? UNITE_VENTE.LITRES
          : estAnimal || estViande || estFromage || categorie === CATEGORIE_VENTE.OEUFS
            ? UNITE_VENTE.PIECE
            : s.unite,
      // Le prix total comprend les frais d'abattoir refacturés.
      prix: Math.round((prixNum + (frais > 0 ? frais : 0)) * 100) / 100,
      tauxTva: parseDecimal(s.tauxTvaVente),
      fraisAbattoir: frais > 0 ? frais : undefined,
      tauxTvaFrais:
        frais > 0 ? parseDecimal(s.tauxTvaFrais.trim() ? s.tauxTvaFrais : s.tauxTvaVente) : undefined,
      client: s.clientSelectionne ? nomComplet(s.clientSelectionne) : undefined,
      // Un animal vivant vendu à la tête n'a pas de poids ; vendu au poids vif, le poids n'est qu'une estimation (il est gardé).
      poidsKg:
        (estAnimal || estViande) && s.poidsKg.trim() && !(s.roleDuDetail === ROLE_VIANDE.VIVANT && !s.venduAuPoids)
          ? parseDecimal(s.poidsKg) || undefined
          : undefined,
      jeune: estViande && s.jeune ? true : undefined,
      etatAnimaux: !estViande
        ? undefined
        : (() => {
            const reglage = reglageEtatAnimaux({
              clientAbattoir: !!s.clientAbattoir,
              role: s.roleDuDetail as ValeurDe<typeof ROLE_VIANDE> | undefined,
              declaree: s.avecFacture,
            });
            // Un abattoir : vivants ; des adultes : selon la ligne choisie ; des cabris : morts avec facture, au choix (morts par défaut) sans facture.
            return reglage.choix ? (s.etatAnimaux === 'vivants' ? 'vivants' : 'morts') : reglage.etat;
          })(),
      animaux: estViande && s.animaux.length > 0 ? s.animaux.join(SEPARATEUR_ANIMAUX) : undefined,
      fromages: lotsDeFromages > 0 ? s.fromages.join(SEPARATEUR_ANIMAUX) : undefined,
      dateAbattoir:
        estViande &&
        s.avecFacture &&
        s.animaux.length > 0 &&
        s.dateAbattoir &&
        s.dateAbattoir !== s.date &&
        // Un animal vivant n'est pas abattu : il n'a pas de date d'abattoir.
        s.roleDuDetail !== ROLE_VIANDE.VIVANT
          ? s.dateAbattoir
          : undefined,
      precision: (CATEGORIES_VENTE_AVEC_PRECISION as readonly string[]).includes(categorie)
        ? s.precision.trim() || undefined
        : undefined,
      choixFacture: s.avecFacture ? TYPE_CHOIX_FACTURE.AVEC_FACTURE : TYPE_CHOIX_FACTURE.SANS_FACTURE,
      numeroFacture: s.avecFacture && !s.reajustement ? s.numeroFacture.trim() : undefined,
      reajustement: s.reajustement ? true : undefined,
      // Offerte : les animaux le sont ; sinon la vente a son prix (les frais seuls, ou tout, sont facturés).
      offert: produitOffert ? true : undefined,
      venduAuPoids: estViande && s.venduAuPoids && s.roleDuDetail === ROLE_VIANDE.VIVANT ? true : undefined,
      prixUnitairePersonnalise:
        s.prixUnitairePersonnalise && s.prixUnitairePersonnalise > 0 ? s.prixUnitairePersonnalise : undefined,
      payee: s.enAttente ? false : undefined,
      echeance: s.enAttente && s.echeance ? s.echeance : undefined,
      circuit: s.circuit || undefined,
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
  let lignesChambre: LigneChambre[] | undefined;
  let lignesProduction: LigneProduction[] | undefined;
  /** Dépense offerte : la case est cochée et la dépense a des montants que le fournisseur peut offrir (ni la Chambre, ni le carburant). */
  const offerte = estRecue && !!s.offertDepense && !estCarburant && !(s.lignesChambre && s.lignesChambre.length > 0);
  let montantOfferte = false;
  const estProduction =
    estRecue && s.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION && !!s.lignesProduction;

  if (estAlimentation) {
    lignesAlimentation = lignesAlimentationFinales(s.lignesAlimentation, s.activite, offerte);
    if (lignesAlimentation.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        },
      };
    }
    montantFinal = totalMontants(s.lignesAlimentation, offerte);
  } else if (estProduction && s.lignesProduction) {
    lignesProduction = lignesProductionFinales(s.lignesProduction, offerte);
    if (lignesProduction.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        },
      };
    }
    // Une fourniture du stock a sa quantité : c'est elle qui entre dans l'inventaire.
    if (lignesProduction.some((l) => l.article && !(l.quantite && l.quantite > 0))) {
      return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.stockProduction.quantiteRequise } };
    }
    montantFinal = totalMontants(s.lignesProduction, offerte);
  } else if (estRecue && s.lignesChambre) {
    lignesChambre = lignesChambreFinales(s.lignesChambre);
    if (lignesChambre.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        },
      };
    }
    // Une facture de la Chambre peut aussi commander des boucles : elles entrent à l'inventaire avec leurs numéros.
    const boucles = lignesProductionFinales(s.lignesProduction ?? []);
    if (boucles.some((l) => l.article && !(l.quantite && l.quantite > 0))) {
      return { erreur: { titre: TEXTES.comptabilite.nouvelleEcriture.stockProduction.quantiteRequise } };
    }
    lignesProduction = boucles.length > 0 ? boucles : undefined;
    montantFinal = [...lignesChambre, ...boucles].reduce((total, l) => total + l.montant, 0);
  } else if (estRecue && s.lignesMarchandises) {
    lignesMarchandises = lignesMarchandisesFinales(s.lignesMarchandises, offerte);
    if (lignesMarchandises.length === 0) {
      return {
        erreur: {
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        },
      };
    }
    montantFinal = totalMontants(s.lignesMarchandises, offerte);
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
    // Une dépense offerte sans détail par ligne : son bouton « Cadeau » (actif d'office) la compte 0 €.
    montantOfferte = offerte && s.cadeauMontant !== false;
    montantFinal = montantOfferte ? 0 : parseDecimal(s.montant);
    if (!montantOfferte && montantFinal <= 0) return { erreur: { titre: TEXTES.commun.general.montantInvalide } };
  }

  // Un achat classé « Autre » dans une liste de l'inventaire garde son article unique ; la production a son détail par fourniture.
  const stockProduction = estRecue && s.categorieDepense === CATEGORIE_DEPENSE.AUTRE && !!s.stockArticle;
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
      // Offerte : le montant sans détail est offert, ou au moins une ligne l'est.
      offert:
        offerte &&
        (montantOfferte ||
          [...(lignesAlimentation ?? []), ...(lignesProduction ?? []), ...(lignesMarchandises ?? [])].some((l) => l.offert))
          ? true
          : undefined,
      categorieDepense: estRecue ? s.categorieDepense : undefined,
      atelier: estRecue && s.atelier ? s.atelier : undefined,
      vehiculeId:
        s.vehiculeId &&
        categorieAvecVehicule(
          estRecue ? s.categorieDepense : undefined,
          estEmise ? s.categorieRecette : undefined,
          s.objetAssurance,
        )
          ? s.vehiculeId
          : undefined,
      objetAssurance: estRecue && s.categorieDepense === CATEGORIE_DEPENSE.ASSURANCES && s.objetAssurance ? s.objetAssurance : undefined,
      voletCooperative: s.voletCooperative || undefined,
      motif:
        s.motif?.trim() &&
        ((estRecue && s.categorieDepense === CATEGORIE_DEPENSE.REPARATION) ||
          (estEmise && s.categorieRecette === CATEGORIE_RECETTE.ASSURANCE_VEHICULE))
          ? s.motif.trim()
          : undefined,
      elementAgri:
        estRecue && s.atelier === ATELIER.AGRITOURISME && s.elementAgri ? s.elementAgri : undefined,
      payee: s.enAttente ? false : undefined,
      sansFacture: estRecue && s.sansFacture ? true : undefined,
      echeance: s.enAttente && s.echeance ? s.echeance : undefined,
      lignesAlimentation,
      lignesMarchandises,
      lignesChambre,
      lignesVeterinaire: visite
        ? lignesVeterinaireRetenues({
            categorieDepense: s.categorieDepense,
            lignesVeterinaire: s.lignesVeterinaire,
          })
        : undefined,
      lignesProduction,
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
      categoriePerso: estRecue && s.categorieDepense === CATEGORIE_DEPENSE.AUTRE ? s.categoriePerso || undefined : undefined,
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
