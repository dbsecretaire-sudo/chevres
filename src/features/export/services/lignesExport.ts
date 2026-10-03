import type { Chevre } from '@/features/cheptel/types';
import type { Controle, VisiteVeterinaire } from '@/features/exploitation/types';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { LABEL_CATEGORIE_DEPENSE, LABEL_CATEGORIE_RECETTE } from '@/shared/textes/libelles';
import { formatDateShortFR } from '@/shared/utils/dates';
import { COMPTE_PAR_DEPENSE, COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  TYPE_FACTURE,
  TYPE_FROMAGE,
} from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';

/** Fait précéder un n° de boucle de l'indicatif de marquage du troupeau, quand il est renseigné. */
export function avecIndicatif(numero: string | undefined, indicatif: string | undefined): string {
  if (!numero) return '';
  return indicatif ? `${indicatif}${numero}` : numero;
}

export function chevreRow(c: Chevre, indicatif?: string) {
  return {
    [TEXTES.export.colonnes.nBoucle]: avecIndicatif(c.numeroBoucle, indicatif),
    [TEXTES.export.colonnes.dateDeBouclage]: formatDateShortFR(c.dateBouclage),
    [TEXTES.export.colonnes.nom]: c.nom ?? '',
    [TEXTES.export.colonnes.sexe]: c.sexe,
    [TEXTES.export.colonnes.dateDeNaissance]: formatDateShortFR(c.dateNaissance),
    [TEXTES.export.colonnes.mereNBoucle]: avecIndicatif(c.mereNumeroBoucle, indicatif),
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
    [TEXTES.export.colonnes.date]: formatDateShortFR(v.date),
    [TEXTES.export.colonnes.categorie]: v.categorie,
    [TEXTES.export.colonnes.typeFromage]:
      v.typeFromage === TYPE_FROMAGE.AUTRE ? v.typeFromageLibre : (v.typeFromage ?? ''),
    [TEXTES.export.colonnes.quantite]: v.quantite,
    [TEXTES.export.colonnes.unite]: v.unite,
    [TEXTES.export.colonnes.prix]: v.prix,
  };
}

export function compteDeFacture(f: Facture): { numero: string; libelle: string } | undefined {
  if (f.type === TYPE_FACTURE.RECUE && f.categorieDepense === CATEGORIE_DEPENSE.AUTRE && f.compteManuel) {
    const trouve = Object.values(COMPTE_PAR_DEPENSE).find((c) => c.numero === f.compteManuel);
    if (trouve) return trouve;
  }
  if (f.type === TYPE_FACTURE.EMISE && f.categorieRecette === CATEGORIE_RECETTE.AUTRE && f.compteManuel) {
    const trouve = Object.values(COMPTE_PAR_RECETTE).find((c) => c.numero === f.compteManuel);
    if (trouve) return trouve;
  }
  if (f.type === TYPE_FACTURE.RECUE && f.categorieDepense) return COMPTE_PAR_DEPENSE[f.categorieDepense];
  if (f.type === TYPE_FACTURE.EMISE && f.categorieRecette) return COMPTE_PAR_RECETTE[f.categorieRecette];
  return undefined;
}

export function factureRow(f: Facture) {
  const compte = compteDeFacture(f);
  return {
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

export function visiteRow(v: VisiteVeterinaire, indicatif?: string) {
  return {
    [TEXTES.export.colonnes.date]: formatDateShortFR(v.date),
    [TEXTES.export.colonnes.nBoucle]: v.chevreNumeroBoucle
      ? avecIndicatif(v.chevreNumeroBoucle, indicatif)
      : TEXTES.commun.general.troupeauEntier,
    [TEXTES.export.colonnes.motif]: v.motif,
    [TEXTES.export.colonnes.description]: v.description ?? '',
    [TEXTES.export.colonnes.cout]: v.cout ?? '',
  };
}

export function controleRow(c: Controle, indicatif?: string) {
  return {
    [TEXTES.export.colonnes.date]: formatDateShortFR(c.date),
    [TEXTES.export.colonnes.nBoucle]: c.chevreNumeroBoucle
      ? avecIndicatif(c.chevreNumeroBoucle, indicatif)
      : TEXTES.commun.general.troupeauEntier,
    [TEXTES.export.colonnes.type]: c.type,
    [TEXTES.export.colonnes.resultat]: c.resultat ?? '',
    [TEXTES.export.colonnes.notes]: c.notes ?? '',
  };
}
