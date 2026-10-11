import { SelectField } from '@/shared/components/SelectField';
import type { CategorieClient } from '@/features/clients/services/categorie';
import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { LABEL_CATEGORIE_CLIENT } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

const OPTIONS = Object.values(CATEGORIE_CLIENT).map((valeur) => ({
  value: valeur,
  label: LABEL_CATEGORIE_CLIENT[valeur],
}));

/** La catégorie du client (obligatoire, particulier d'office) : liste déroulante. */
export function ChampCategorieClient({
  value,
  onChange,
}: {
  value: CategorieClient;
  onChange: (categorie: CategorieClient) => void;
}) {
  return (
    <SelectField
      label={TEXTES.clients.nouveauClient.categorieDuClient}
      required
      value={value}
      onChange={(v) => onChange(v as CategorieClient)}
      options={OPTIONS}
      aide={TEXTES.clients.nouveauClient.aideCategorie}
    />
  );
}
