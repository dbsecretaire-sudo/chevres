import { useState } from 'react';
import { FormField } from '@/shared/components/FormField';
import { definirTarif } from '@/features/commercial/repository';
import { TEXTES } from '@/shared/textes';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.commercial.tarifs;

const texte = (valeur: number | undefined): string =>
  valeur === undefined ? '' : String(valeur).replace('.', ',');

/**
 * Le prix d'un article (un fromage, une viande) pour une catégorie de contact : un champ qui s'enregistre en le quittant (vide : le
 * prix de base de l'inventaire). `parKg` : le prix d'une viande se compte au kilo.
 */
export function ChampTarif({
  article,
  categorie,
  nomCategorie,
  valeur,
  prixInventaire,
  parKg,
}: {
  article: string;
  categorie: string;
  nomCategorie: string;
  valeur: number | undefined;
  prixInventaire: number | undefined;
  parKg?: boolean;
}) {
  const [saisie, setSaisie] = useState(texte(valeur));
  const enregistrer = () => {
    const prix = saisie.trim() ? parseDecimal(saisie) : undefined;
    if (prix !== undefined && !(prix >= 0)) return;
    definirTarif(article, categorie, prix);
  };
  return (
    <FormField
      label={parKg ? T.prixKgPour(nomCategorie) : T.prixPour(nomCategorie)}
      value={saisie}
      onChangeText={setSaisie}
      onBlur={enregistrer}
      onEndEditing={enregistrer}
      keyboardType="decimal-pad"
      placeholder={texte(prixInventaire) || '0,00'}
    />
  );
}
