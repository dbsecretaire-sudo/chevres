import { SelectField } from '@/shared/components/SelectField';
import { categoriesClient } from '@/shared/dictionnaire/categoriesClient';
import { TEXTES } from '@/shared/textes';

/** La catégorie du client (obligatoire, particulier d'office) : liste déroulante des catégories de l'établissement. */
export function ChampCategorieClient({
  value,
  onChange,
}: {
  value: string;
  onChange: (categorie: string) => void;
}) {
  return (
    <SelectField
      label={TEXTES.clients.nouveauClient.categorieDuClient}
      required
      value={value}
      onChange={onChange}
      options={categoriesClient().map((c) => ({ value: c.id, label: c.nom }))}
      aide={TEXTES.clients.nouveauClient.aideCategorie}
    />
  );
}
