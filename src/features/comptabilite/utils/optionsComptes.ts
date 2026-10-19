import { compteProposePour, type CompteComptableEnregistre } from '@/features/comptes-pcg/repository';
import type { ActiviteComptable } from '@/features/comptabilite/types';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { TEXTES } from '@/shared/textes';

/** Préfixes des comptes PCG de charges (6…) et de produits (7…) proposés dans les listes. */
const PREFIXE_COMPTES_DEPENSE = '6';
const PREFIXE_COMPTES_RECETTE = '7';

/** Une ligne d'une liste de comptes : le numéro, son libellé (numéro — nom) et le numéro seul pour la version courte. */
const versOptionCompte = (c: CompteComptableEnregistre) => ({
  value: c.numero,
  label: `${c.numero} — ${c.libelle}`,
  shortLabel: c.numero,
});

/**
 * Les comptes proposés dans une écriture : ceux de charges (dépenses) et de produits (recettes) que l'espèce de l'écriture n'a pas retirés
 * (une écriture commune les garde tous). Pour une dépense, les comptes de l'inventaire viennent d'abord, sous leur titre, pour les retrouver
 * dans toute la liste.
 */
export function optionsDesComptes(
  comptes: CompteComptableEnregistre[],
  activite: ActiviteComptable,
  comptesInventaire: string[],
) {
  const deLActivite = comptes.filter((c) => compteProposePour(c, activite === ACTIVITE_COMMUNE ? [] : [activite]));
  const comptesDepense = deLActivite.filter((c) => c.numero.startsWith(PREFIXE_COMPTES_DEPENSE));
  const comptesRecette = deLActivite.filter((c) => c.numero.startsWith(PREFIXE_COMPTES_RECETTE));
  const optionsCompteDepense = comptesDepense
    .map((c) => ({ ...versOptionCompte(c), inventaire: comptesInventaire.includes(c.numero) }))
    .sort((a, b) => Number(b.inventaire) - Number(a.inventaire))
    .map(({ inventaire, ...option }) => ({
      ...option,
      groupe: inventaire
        ? TEXTES.comptabilite.nouvelleEcriture.groupeInventaire
        : TEXTES.comptabilite.nouvelleEcriture.groupeAutresComptes,
    }));
  const optionsCompteRecette = comptesRecette.map(versOptionCompte);
  return { comptesDepense, comptesRecette, optionsCompteDepense, optionsCompteRecette };
}
