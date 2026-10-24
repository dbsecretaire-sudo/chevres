import {
  creerChevre,
  declarerStatutChevre,
  numeroBoucleExiste,
} from '@/features/cheptel/repository/chevres';
import { enregistrerFacture } from '@/features/comptabilite/repository/factures';
import { enregistrerVente } from '@/features/comptabilite/repository/ventes';
import {
  controleDesAnimauxAchetes,
  type AnimalAcheteForm,
} from '@/features/comptabilite/forms/animauxAchetes';
import type { ErreurSaisie } from '@/features/comptabilite/forms/construireEcriture';
import type { ActiviteComptable, Facture, TypeFromage, Vente } from '@/features/comptabilite/types';
import { idsDesAnimaux, sortieDesAnimauxDeLaVente } from '@/features/comptabilite/utils/ventes';
import { synchroniserVisiteFacture } from '@/features/sante/services/visitesFacture';
import { lireArchiveStock } from '@/features/stock/repository';
import { fromagesRequis } from '@/features/stock/services/lots';
import {
  articlesDuGenre,
  roleDeLaViande,
  synchroniserStockAlimentation,
  type FiltreStock,
} from '@/features/stock/services/stock';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  CATEGORIES_VENTE_VIANDE,
  SEPARATEUR_ANIMAUX,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { GENRE_ARTICLE, ROLE_VIANDE } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';
import { parseDecimal } from '@/shared/utils/nombres';

/** Ce que les contrôles d'avant l'enregistrement lisent de la saisie. */
export interface SaisieAControler {
  type: string;
  categorieRecette: string;
  categorieDepense: string;
  activite: ActiviteComptable;
  precision: string;
  animaux: string[];
  poidsKg: string;
  venduAuPoids: boolean;
  estProductionVente: boolean;
  typeFromage: TypeFromage;
  typeFromageLibre: string;
  fromages: string[];
  animauxAchetes: AnimalAcheteForm[];
  animauxEnvoyes: string[];
  /** Une dépense « Animaux vivants (vente) » : le lot d'abattoir facturé, et vrai quand son document de circulation manque. */
  lotId?: string;
  lotSansDocument?: boolean;
  /** Le motif d'une réparation ou de l'indemnité d'une assurance, et le véhicule choisi (le motif d'une réparation s'exige quand un véhicule est choisi). */
  motif: string;
  vehiculeId: string;
}

/**
 * Les contrôles de ce que la saisie désigne, avant de construire l'écriture : les animaux (et leur poids) d'une vente d'animaux, les lots
 * d'un fromage ou d'une charcuterie, les animaux achetés ou envoyés d'une dépense. Rend l'erreur à montrer, ou rien quand tout va bien.
 */
export async function controlerAvantEnregistrement(s: SaisieAControler): Promise<ErreurSaisie | undefined> {
  const T = TEXTES.comptabilite.nouvelleEcriture;
  // La réparation d'un véhicule de la flotte et l'indemnité d'une assurance se justifient : le motif est obligatoire.
  const reparationDUnVehicule =
    s.type === TYPE_FACTURE.RECUE && s.categorieDepense === CATEGORIE_DEPENSE.REPARATION && !!s.vehiculeId;
  const indemnite = s.type !== TYPE_FACTURE.RECUE && s.categorieRecette === CATEGORIE_RECETTE.ASSURANCE_VEHICULE;
  if ((reparationDUnVehicule || indemnite) && !s.motif.trim()) {
    return { titre: TEXTES.flotte.motif.requis, message: TEXTES.flotte.motif.requisMessage };
  }
  // Un animal sur pied, vivant ou un petit ne se vend pas sans dire lesquels ni leur poids : les fiches du cheptel et le poids
  // sont obligatoires.
  if ((CATEGORIES_VENTE_VIANDE as readonly string[]).includes(s.categorieRecette)) {
    const archive = await lireArchiveStock();
    const filtre = s.activite === ACTIVITE_COMMUNE ? undefined : (s.activite as FiltreStock);
    const ligne = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, filtre).find((a) => a.libelle === s.precision);
    if (ligne && roleDeLaViande(ligne.cle)) {
      if (s.animaux.length === 0) return { titre: T.animauxRequis, message: T.animauxRequisMessage };
      // Le poids est facultatif pour un animal vivant vendu à la tête ; il est requis pour les autres (au kilo).
      const poidsExige = roleDeLaViande(ligne.cle) !== ROLE_VIANDE.VIVANT || s.venduAuPoids;
      if (poidsExige && !(parseDecimal(s.poidsKg) > 0)) return { titre: T.poidsRequis };
    }
  }
  // Un fromage ou une charcuterie qui a des lots en stock se vend lot par lot : on les désigne.
  if (
    s.estProductionVente &&
    (s.categorieRecette === CATEGORIE_RECETTE.FROMAGE ||
      s.categorieRecette === CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE ||
      s.categorieRecette === CATEGORIE_RECETTE.SAVONS) &&
    fromagesRequis(await lireArchiveStock(), {
      id: '',
      categorie:
        s.categorieRecette === CATEGORIE_RECETTE.FROMAGE
          ? CATEGORIE_VENTE.FROMAGE
          : s.categorieRecette === CATEGORIE_RECETTE.SAVONS
            ? CATEGORIE_VENTE.SAVONS
            : CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE,
      typeFromage: s.typeFromage,
      typeFromageLibre: s.typeFromageLibre,
      precision: s.precision,
      activite: s.activite,
      fromages: s.fromages.join(';'),
    })
  ) {
    return { titre: T.lotsRequis };
  }
  // Un achat d'animaux vivants : chacun a sa date de naissance et une boucle libre ; leurs fiches se créent à l'enregistrement.
  if (s.type === TYPE_FACTURE.RECUE && s.categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS) {
    const A = T.animauxAchetes;
    const controle = controleDesAnimauxAchetes(s.animauxAchetes);
    if (!controle.ok) {
      return { titre: controle.erreur === 'aucun' ? A.aucun : controle.erreur === 'naissance' ? A.naissanceRequise : A.boucleRepetee };
    }
    for (const a of s.animauxAchetes) {
      const boucle = a.boucle.trim();
      if (boucle && (await numeroBoucleExiste(boucle))) return { titre: A.boucleExiste(boucle) };
    }
  }
  // Des animaux vivants qui sont partis : leur lot d'abattoir est créé avant la facture (sans lot, pas de facture), avec son document de circulation.
  if (s.type === TYPE_FACTURE.RECUE && s.categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE) {
    if (!s.lotId) return { titre: T.lotAbattoir.aucun, message: T.lotAbattoir.aucunMessage };
    if (s.lotSansDocument) return { titre: T.lotAbattoir.sansDocument, message: T.lotAbattoir.sansDocumentMessage };
  }
  return undefined;
}

/** Enregistre la vente (liée à sa commande s'il y en a une) : renvoie la vente enregistrée, avec son identifiant. */
export const enregistrerLaVente = (vente: Omit<Vente, 'id'>, commandeId?: string): Promise<Vente> =>
  enregistrerVente({ ...vente, commandeId });

/** Les animaux vendus quittent le cheptel : leur fiche passe en « abattoir » (vente de viande déclarée, à la date d'abattoir), en « morte » (non déclarée) ou en « vendue ». */
export async function sortirLesAnimauxDeLaVente(vente: Vente): Promise<void> {
  const sortie = sortieDesAnimauxDeLaVente(vente);
  for (const id of idsDesAnimaux(vente)) await declarerStatutChevre(id, sortie.statut, sortie.date);
}

/** Ce que l'enregistrement d'une dépense lit de la saisie. */
export interface DepenseAEnregistrer {
  date: string;
  tiers: string;
  /** Une dépense « Animaux vivants » : les animaux achetés entrent au cheptel (une fiche chacun). */
  achatAnimaux: boolean;
  animauxAchetes: AnimalAcheteForm[];
  /** Une dépense « Animaux vivants (vente) » : les animaux envoyés quittent le cheptel (leur fiche passe à « abattoir »). */
  envoiAnimaux: boolean;
  animauxEnvoyes: string[];
  /** Le lot d'abattoir facturé : ses animaux sont déjà sortis du cheptel (à la date du départ), la dépense ne les touche pas. */
  lotId?: string;
}

/** Enregistre la dépense avec ce qu'elle entraîne : les fiches des animaux achetés ou envoyés, le stock acheté, la visite du vétérinaire. */
export async function enregistrerLaDepense(facture: Omit<Facture, 'id'>, d: DepenseAEnregistrer): Promise<Facture> {
  // Les animaux achetés entrent au cheptel : une fiche chacun, à la date de naissance saisie.
  let animauxCrees: string | undefined;
  if (d.achatAnimaux) {
    const ids: string[] = [];
    for (const a of d.animauxAchetes) {
      const fiche = await creerChevre({
        numeroBoucle: a.boucle.trim() || undefined,
        sexe: a.sexe,
        dateNaissance: a.naissance,
        // L'animal entre dans l'exploitation à la date de l'achat : le suivi des mouvements l'y compte en « achat », chez ce vendeur.
        dateEntree: d.date,
        vendeur: d.tiers,
        notes: TEXTES.comptabilite.nouvelleEcriture.animauxAchetes.achetePar(d.tiers, formatDateFR(d.date)),
      });
      ids.push(fiche.id);
    }
    animauxCrees = ids.join(SEPARATEUR_ANIMAUX);
  }
  // Sans lot (l'ancienne saisie) : les animaux envoyés quittent le cheptel, leur fiche passe à « abattoir », à la date de la dépense. Avec un lot, ils sont
  // déjà sortis, à la date du départ : la facture, émise plus tard, n'y change rien.
  if (d.envoiAnimaux && !d.lotId) for (const id of d.animauxEnvoyes) await declarerStatutChevre(id, STATUT_CHEVRE.ABATTOIR, d.date);
  const enregistree = await enregistrerFacture({
    ...facture,
    animauxAchetes: animauxCrees,
    animauxEnvoyes: d.envoiAnimaux ? d.animauxEnvoyes.join(SEPARATEUR_ANIMAUX) : undefined,
    lotId: d.envoiAnimaux ? d.lotId : undefined,
  });
  // Une facture d'alimentation augmente le stock des aliments.
  await synchroniserStockAlimentation(enregistree);
  // Une dépense vétérinaire peut inscrire sa visite dans les visites vétérinaires.
  await synchroniserVisiteFacture(enregistree);
  return enregistree;
}
