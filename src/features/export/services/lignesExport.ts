import type { Chevre } from '@/features/cheptel/types';
import type { Controle, VisiteVeterinaire } from '@/features/exploitation/types';
import type { Facture, Vente } from '@/features/comptabilite/types';
import {
  LABEL_ACTIVITE_COMPTABLE,
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
} from '@/shared/textes/libelles';
import { formatDateShortFR } from '@/shared/utils/dates';
import { especeDe } from '@/features/cheptel/utils/espece';
import { activiteVente, activitesFacture } from '@/features/comptabilite/utils/activite';
import { venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { plusieursEspeces, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { COMPTE_PAR_DEPENSE, COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  TYPE_FACTURE,
  TYPE_FROMAGE,
} from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';

/** L'indicatif de marquage d'une espèce (voir indicatifMarquagePar), pour des exports qui mélangent plusieurs espèces. */
export type IndicatifParEspece = (espece: EspeceAnimale) => string | undefined;

/** Fait précéder un n° de boucle de l'indicatif de marquage du troupeau, quand il est renseigné. */
export function avecIndicatif(numero: string | undefined, indicatif: string | undefined): string {
  if (!numero) return '';
  return indicatif ? `${indicatif}${numero}` : numero;
}

export function chevreRow(c: Chevre, indicatif?: IndicatifParEspece) {
  return {
    ...(plusieursEspeces() ? { [TEXTES.export.colonnes.espece]: LABEL_ACTIVITE_COMPTABLE[especeDe(c)] } : {}),
    [TEXTES.export.colonnes.nBoucle]: avecIndicatif(c.numeroBoucle, indicatif?.(especeDe(c))),
    [TEXTES.export.colonnes.dateDeBouclage]: formatDateShortFR(c.dateBouclage),
    [TEXTES.export.colonnes.nom]: c.nom ?? '',
    [TEXTES.export.colonnes.sexe]: c.sexe,
    [TEXTES.export.colonnes.dateDeNaissance]: formatDateShortFR(c.dateNaissance),
    [TEXTES.export.colonnes.mereNBoucle]: avecIndicatif(c.mereNumeroBoucle, indicatif?.(especeDe(c))),
    [TEXTES.export.colonnes.statut]: c.statut,
    [TEXTES.export.colonnes.dateMort]: formatDateShortFR(c.dateStatut),
    [TEXTES.export.colonnes.renouvellement]: c.renouvellement
      ? TEXTES.export.xlsxExport.ouiValeur(c.renouvellementAnnee ?? '—')
      : '',
    [TEXTES.export.colonnes.notes]: c.notes ?? '',
  };
}

export function venteRow(v: Vente) {
  return {
    ...(plusieursEspeces()
      ? { [TEXTES.export.colonnes.activite]: LABEL_ACTIVITE_COMPTABLE[activiteVente(v)] }
      : {}),
    [TEXTES.export.colonnes.date]: formatDateShortFR(v.date),
    [TEXTES.export.colonnes.categorie]: v.categorie,
    [TEXTES.export.colonnes.typeFromage]:
      v.typeFromage === TYPE_FROMAGE.AUTRE ? v.typeFromageLibre : (v.typeFromage ?? ''),
    [TEXTES.export.colonnes.quantite]: v.quantite,
    [TEXTES.export.colonnes.unite]: v.unite,
    [TEXTES.export.colonnes.prix]: v.prix,
    [TEXTES.export.colonnes.precision]: v.precision ?? '',
    [TEXTES.export.colonnes.declaree]: venteADeclarer(v)
      ? TEXTES.export.colonnes.oui
      : TEXTES.export.colonnes.non,
    [TEXTES.export.colonnes.nFacture]: v.numeroFacture ?? '',
  };
}

export function compteDeFacture(f: Facture): { numero: string; libelle: string } | undefined {
  if (f.type === TYPE_FACTURE.RECUE && f.categorieDepense === CATEGORIE_DEPENSE.AUTRE && f.compteManuel) {
    const trouve = Object.values(COMPTE_PAR_DEPENSE).find((c) => c.numero === f.compteManuel);
    if (trouve) return trouve;
  }
  // « Autre recette », une activité annexe ou l'hébergement du gîte : le compte choisi à la main l'emporte sur celui d'office.
  if (
    f.type === TYPE_FACTURE.EMISE &&
    (f.categorieRecette === CATEGORIE_RECETTE.AUTRE ||
      f.categorieRecette === CATEGORIE_RECETTE.HEBERGEMENT) &&
    f.compteManuel
  ) {
    const trouve = Object.values(COMPTE_PAR_RECETTE).find((c) => c.numero === f.compteManuel);
    return trouve ?? { numero: f.compteManuel, libelle: COMPTE_PAR_RECETTE[f.categorieRecette].libelle };
  }
  if (f.type === TYPE_FACTURE.RECUE && f.categorieDepense) return COMPTE_PAR_DEPENSE[f.categorieDepense];
  if (f.type === TYPE_FACTURE.EMISE && f.categorieRecette) return COMPTE_PAR_RECETTE[f.categorieRecette];
  return undefined;
}

export function factureRow(f: Facture) {
  const compte = compteDeFacture(f);
  return {
    ...(plusieursEspeces()
      ? {
          [TEXTES.export.colonnes.activite]: activitesFacture(f)
            .map((a) => LABEL_ACTIVITE_COMPTABLE[a])
            .join(TEXTES.commun.general.separateurListe),
        }
      : {}),
    [TEXTES.export.colonnes.date]: formatDateShortFR(f.date),
    [TEXTES.export.colonnes.type]:
      f.type === TYPE_FACTURE.RECUE ? TEXTES.commun.general.debit : TEXTES.commun.general.credit,
    [TEXTES.export.colonnes.fournisseurClient]: f.tiers,
    [TEXTES.export.colonnes.note]: f.description,
    [TEXTES.export.colonnes.categorie]:
      f.type === TYPE_FACTURE.RECUE
        ? f.categorieDepense
          ? LABEL_CATEGORIE_DEPENSE[f.categorieDepense]
          : ''
        : f.categorieRecette
          ? LABEL_CATEGORIE_RECETTE[f.categorieRecette]
          : '',
    [TEXTES.export.colonnes.nComptePcg]: compte?.numero ?? '',
    [TEXTES.export.colonnes.libelleCompte]: compte?.libelle ?? '',
    [TEXTES.export.colonnes.montant]: f.montant,
  };
}

export function visiteRow(v: VisiteVeterinaire, indicatif?: IndicatifParEspece) {
  return {
    ...(plusieursEspeces() ? { [TEXTES.export.colonnes.espece]: LABEL_ACTIVITE_COMPTABLE[especeDe(v)] } : {}),
    [TEXTES.export.colonnes.date]: formatDateShortFR(v.date),
    [TEXTES.export.colonnes.nBoucle]: v.chevreNumeroBoucle
      ? avecIndicatif(v.chevreNumeroBoucle, indicatif?.(especeDe(v)))
      : TEXTES.commun.general.troupeauEntier,
    [TEXTES.export.colonnes.motif]: v.motif,
    [TEXTES.export.colonnes.description]: v.description ?? '',
    [TEXTES.export.colonnes.cout]: v.cout ?? '',
  };
}

export function controleRow(c: Controle, indicatif?: IndicatifParEspece) {
  return {
    ...(plusieursEspeces() ? { [TEXTES.export.colonnes.espece]: LABEL_ACTIVITE_COMPTABLE[especeDe(c)] } : {}),
    [TEXTES.export.colonnes.date]: formatDateShortFR(c.date),
    [TEXTES.export.colonnes.nBoucle]: c.chevreNumeroBoucle
      ? avecIndicatif(c.chevreNumeroBoucle, indicatif?.(especeDe(c)))
      : TEXTES.commun.general.troupeauEntier,
    [TEXTES.export.colonnes.type]: c.type,
    [TEXTES.export.colonnes.resultat]: c.resultat ?? '',
    [TEXTES.export.colonnes.notes]: c.notes ?? '',
  };
}
