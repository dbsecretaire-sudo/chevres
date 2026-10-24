import { SelectField } from '@/shared/components/SelectField';
import { categoriesFournisseur, sansAnciennesInutilisees } from '@/shared/dictionnaire/categoriesFournisseur';
import { TEXTES } from '@/shared/textes';

/** La catégorie du fournisseur (la catégorie d'office à défaut) : liste déroulante des catégories de tiers de l'établissement. */
export function ChampCategorieFournisseur({
  value,
  onChange,
}: {
  value: string;
  onChange: (categorie: string) => void;
}) {
  return (
    <SelectField
      label={TEXTES.fournisseurs.categories.champ}
      value={value}
      onChange={onChange}
      // Une ancienne catégorie ne se propose plus, sauf à la fiche qui la porte déjà.
      options={sansAnciennesInutilisees(categoriesFournisseur(), new Set([value])).map((c) => ({ value: c.id, label: c.nom }))}
      aide={TEXTES.fournisseurs.categories.aideChamp}
    />
  );
}
