import type { TypeFromage } from '@/features/comptabilite/types';
import type { ArticleAffiche } from '@/features/stock/services/stock';
import { TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import { PREFIXE_FROMAGE_AJOUTE } from '@/shared/constants/stock';
import { LABEL_TYPE_FROMAGE } from '@/shared/textes/libelles';

/** Les types de fromage d'office, quand le stock n'en propose pas (même liste que les types de la vente). */
export const OPTIONS_TYPE_FROMAGE = Object.entries(LABEL_TYPE_FROMAGE).map(([value, label]) => ({
  value: value as string,
  label,
}));

/** La valeur du choix d'un fromage du stock : son code d'office, ou « ajoute: » suivi de son identifiant s'il a été ajouté. */
export const valeurFromage = (fromage: ArticleAffiche): string =>
  fromage.id ? `${PREFIXE_FROMAGE_AJOUTE}${fromage.id}` : fromage.cle.split(':')[1];

/** Les choix du menu des fromages : ceux du stock, ou les types d'office tant que le stock n'en a pas. */
export const optionsFromages = (fromages: ArticleAffiche[]): { value: string; label: string }[] =>
  fromages.length > 0
    ? fromages.map((f) => ({ value: valeurFromage(f), label: f.libelle }))
    : OPTIONS_TYPE_FROMAGE;

/** Le fromage ajouté au stock que la vente a choisi (noté « autre » avec son nom), s'il y en a un. */
export const fromageAjouteChoisi = (
  fromages: ArticleAffiche[],
  typeFromage: TypeFromage | undefined,
  typeFromageLibre: string | undefined,
): ArticleAffiche | undefined =>
  fromages.find(
    (f) =>
      f.id &&
      typeFromage === TYPE_FROMAGE.AUTRE &&
      (typeFromageLibre ?? '').trim().toLowerCase() === f.libelle.trim().toLowerCase(),
  );

/** Ce qu'une vente retient d'un choix du menu : un fromage ajouté se note comme « autre » avec son nom (c'est ainsi que la vente retrouve son stock). */
export function typeDuChoix(
  fromages: ArticleAffiche[],
  valeur: string,
): { typeFromage: TypeFromage; typeFromageLibre: string } {
  if (valeur.startsWith(PREFIXE_FROMAGE_AJOUTE)) {
    const ajoute = fromages.find((f) => f.id === valeur.slice(PREFIXE_FROMAGE_AJOUTE.length));
    return { typeFromage: TYPE_FROMAGE.AUTRE, typeFromageLibre: ajoute?.libelle ?? '' };
  }
  return { typeFromage: valeur as TypeFromage, typeFromageLibre: '' };
}
