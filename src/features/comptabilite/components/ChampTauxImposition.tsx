import { ChampListeModifiable } from '@/shared/components/ChampListeModifiable';
import { useListePersonnalisee } from '@/features/settings/hooks/useListePersonnalisee';
import { libelleTauxTva } from '@/features/comptabilite/utils/tva';
import { POURCENTAGE_MAX, POURCENTAGE_MIN, TAUX_IMPOSITION_PROPOSES } from '@/shared/constants/comptabilite';
import { CLE_LISTE_PERSONNALISEE } from '@/shared/constants/controles';
import { parseDecimal } from '@/shared/utils/nombres';
import { TEXTES } from '@/shared/textes';

const valeursParDefaut = TAUX_IMPOSITION_PROPOSES.map(String);

/** Les taux saisis dans la liste : des nombres de 0 à 100, sans doublon, du plus petit au plus grand ; le reste est écarté. */
const taux = (saisies: string[]): string[] =>
  [...new Set(saisies.map((v) => parseDecimal(v)))]
    .filter((n) => Number.isFinite(n) && n >= POURCENTAGE_MIN && n <= POURCENTAGE_MAX)
    .sort((a, b) => a - b)
    .map(String);

/**
 * Le taux d'imposition d'une aide (la part du montant incluse dans les recettes imposables) : une liste déroulante dont le crayon
 * modifie les taux proposés. Un taux déjà enregistré qui n'y est plus reste proposé.
 */
export function ChampTauxImposition({
  value,
  onChange,
  label = TEXTES.comptabilite.nouvelleEcriture.tauxDImposition,
}: {
  /** Le titre du champ : « Taux d'imposition » d'office, ou le type d'aide dans les réglages. */
  label?: string;
  /** Le taux en texte (« 100 », « 33.3 »). */
  value: string;
  onChange: (taux: string) => void;
}) {
  const [liste, enregistrerListe] = useListePersonnalisee(
    CLE_LISTE_PERSONNALISEE.TAUX_IMPOSITION,
    valeursParDefaut,
  );
  return (
    <ChampListeModifiable
      label={label}
      value={value}
      onChange={onChange}
      valeurs={liste}
      valeursParDefaut={valeursParDefaut}
      onChangerValeurs={(valeurs) => enregistrerListe(taux(valeurs))}
      titreListe={TEXTES.comptabilite.nouvelleEcriture.titreTauxImposition}
      formater={(v) => libelleTauxTva(Number(v))}
    />
  );
}
