import type { Vente } from '@/features/comptabilite/types';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { CATEGORIE_VENTE, SEPARATEUR_ANIMAUX, TYPE_CHOIX_FACTURE } from '@/shared/constants/comptabilite';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ROLE_VIANDE } from '@/shared/constants/stock';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { capitaliser, especeCourante, vocabulaire } from '@/shared/dictionnaire/animaux';
import { LABEL_CATEGORIE_VENTE } from '@/shared/textes/libelles';

/**
 * Libellé du produit vendu. La vente de petits (cabris, agneaux, veaux…) prend le mot de l'espèce de la
 * vente elle-même, pas de l'espèce affichée en ce moment.
 */
export function libelleCategorieVente(v: Pick<Vente, 'categorie' | 'activite'>): string {
  if (v.categorie !== CATEGORIE_VENTE.CABRIS) return LABEL_CATEGORIE_VENTE[v.categorie];
  const activite = activiteVente(v);
  const espece = activite === ACTIVITE_COMMUNE ? especeCourante() : activite;
  return capitaliser(vocabulaire(espece).petit.pluriel);
}

/**
 * Vrai quand un animal d'une vente supprimée (ou dont on retire l'animal) revient vivant dans le cheptel : un animal « vendu », et un animal
 * « à l'abattoir » quand la vente concernait le transport d'animaux vivants (un client Abattoir : la facture de l'identification et du
 * transport des animaux vivants). Un animal abattu dont la vente portait sur la viande (morts) garde son statut.
 */
export const revientVivantApresLaVente = (
  statut: string | undefined,
  vente: Parameters<typeof documentCirculationRequis>[0],
): boolean =>
  statut === STATUT_CHEVRE.VENDUE || (statut === STATUT_CHEVRE.ABATTOIR && documentCirculationRequis(vente));

/** Les identifiants des fiches du cheptel des animaux d'une vente (aucun pour une vente sans animal choisi). */
export const idsDesAnimaux = (vente: Pick<Vente, 'animaux'>): string[] =>
  vente.animaux ? vente.animaux.split(SEPARATEUR_ANIMAUX).filter(Boolean) : [];

/** Les identifiants des animaux achetés avec une dépense « Animaux vivants » (aucun pour une autre dépense). */
export const idsDesAnimauxAchetes = (facture: { animauxAchetes?: string }): string[] =>
  facture.animauxAchetes ? facture.animauxAchetes.split(SEPARATEUR_ANIMAUX).filter(Boolean) : [];

/** Les identifiants des animaux envoyés avec une dépense « Animaux vivants (vente) » (aucun pour une autre dépense). */
export const idsDesAnimauxEnvoyes = (facture: { animauxEnvoyes?: string }): string[] =>
  facture.animauxEnvoyes ? facture.animauxEnvoyes.split(SEPARATEUR_ANIMAUX).filter(Boolean) : [];

/**
 * Ce que devient un animal du cheptel quand il est vendu : pour une vente de viande, il a forcément été abattu avant. Vente
 * déclarée : son statut est « abattoir », à sa date d'abattoir. Vente non déclarée (le client ne veut pas de facture) : il n'y a pas
 * de date d'abattoir, il passe en « morte » à la date de la vente. Les autres ventes d'animaux le passent en « vendue ».
 */
export const sortieDesAnimauxDeLaVente = (
  vente: Pick<Vente, 'categorie' | 'date' | 'dateAbattoir' | 'choixFacture' | 'etatAnimaux'>,
): { statut: ValeurDe<typeof STATUT_CHEVRE>; date: string } =>
  vente.categorie !== CATEGORIE_VENTE.VIANDE || vente.etatAnimaux
    ? { statut: STATUT_CHEVRE.VENDUE, date: vente.date }
    : venteADeclarer(vente)
      ? { statut: STATUT_CHEVRE.ABATTOIR, date: vente.dateAbattoir || vente.date }
      : { statut: STATUT_CHEVRE.VENDUE, date: vente.date };

/**
 * L'état des animaux d'une vente de viande : un client de catégorie Abattoir les reçoit toujours vivants ; pour des adultes, il suit la ligne
 * choisie (« sur pied » : morts ; « vivants » : vivants) ; pour des cabris, toujours morts avec facture, au choix sans facture (morts par défaut) : le seul choix est celui des cabris.
 */
export type ReglageEtatAnimaux = { choix: true } | { choix: false; etat: 'vivants' | 'morts' | undefined };
export const reglageEtatAnimaux = (o: {
  clientAbattoir: boolean;
  /** La ligne de viande choisie comme détail : cabris (petits), animal sur pied ou animal vivant. */
  role: ValeurDe<typeof ROLE_VIANDE> | undefined;
  declaree: boolean;
}): ReglageEtatAnimaux =>
  o.clientAbattoir
    ? { choix: false, etat: undefined }
    : o.role === ROLE_VIANDE.VIVANT
      ? { choix: false, etat: 'vivants' }
      : o.role === ROLE_VIANDE.SUR_PIED
        ? { choix: false, etat: 'morts' }
        : o.role === ROLE_VIANDE.JEUNE
          ? o.declaree
            ? { choix: false, etat: 'morts' }
            : { choix: true }
          : { choix: false, etat: 'morts' };

/**
 * Un document de circulation est nécessaire quand la vente est déclarée et qu'il y a transport d'animaux vivants : des animaux vendus
 * vivants (au particulier, au professionnel), ou envoyés vivants à l'abattoir. Des animaux déjà morts, ou une vente sans facture : aucun.
 */
export const documentCirculationRequis = (
  vente: Pick<Vente, 'categorie' | 'date' | 'dateAbattoir' | 'choixFacture' | 'etatAnimaux' | 'animaux'>,
): boolean =>
  idsDesAnimaux(vente).length > 0 &&
  venteADeclarer(vente) &&
  // Des animaux remis morts ne voyagent pas vivants ; les autres (vendus vivants, envoyés à l'abattoir) si.
  (vente.categorie !== CATEGORIE_VENTE.VIANDE || vente.etatAnimaux !== 'morts');

/** Les identifiants des lots de fromage d'une vente (aucun pour une vente sans fromage identifié). */
export const idsDesFromages = (vente: Pick<Vente, 'fromages'>): string[] =>
  vente.fromages ? vente.fromages.split(SEPARATEUR_ANIMAUX).filter(Boolean) : [];

/** Vrai quand le client souhaite que la vente soit déclarée (avec facture) : d'office, et pour les ventes d'avant ce choix. */
export const venteADeclarer = (vente: Pick<Vente, 'choixFacture'>): boolean =>
  vente.choixFacture !== TYPE_CHOIX_FACTURE.SANS_FACTURE;

/**
 * Les parts d'une vente à un même taux de TVA : la viande, puis les frais d'abattoir refacturés quand ils ont leur taux (le prix de la
 * vente les comprend). Une vente sans frais n'a qu'une part.
 */
export function partsDeLaVente(
  v: Pick<Vente, 'prix' | 'tauxTva' | 'fraisAbattoir' | 'tauxTvaFrais'>,
): { ttc: number; taux?: number }[] {
  const total = v.prix ?? 0;
  const frais = v.fraisAbattoir && v.fraisAbattoir > 0 ? Math.min(v.fraisAbattoir, total) : 0;
  if (frais === 0) return [{ ttc: total, taux: v.tauxTva }];
  return [
    { ttc: Math.round((total - frais) * 100) / 100, taux: v.tauxTva },
    { ttc: frais, taux: v.tauxTvaFrais ?? v.tauxTva },
  ];
}
