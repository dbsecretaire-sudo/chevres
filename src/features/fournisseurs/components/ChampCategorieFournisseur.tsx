import { SelectField } from '@/shared/components/SelectField';
import { categoriesFournisseur } from '@/shared/dictionnaire/categoriesFournisseur';
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
      options={categoriesFournisseur().map((c) => ({ value: c.id, label: c.nom }))}
      aide={TEXTES.fournisseurs.categories.aideChamp}
    />
  );
}
