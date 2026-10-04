import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

/**
 * Choix de l'espèce dont on gère le cheptel (chèvres, brebis…), sur une ligne qui défile. N'apparaît que pour un
 * établissement qui en élève plusieurs. Le changement recharge l'écran courant avec le vocabulaire et les données de l'espèce.
 */
export function SelecteurEspece() {
  const { especes, espece, changerEspece } = useEtablissement();

  if (especes.length < 2) return null;

  return (
    <PucesDefilantes
      puces={especes.map((e) => ({ valeur: e, label: LABEL_TYPE_ANIMAL_ETABLISSEMENT[e] }))}
      valeur={espece}
      onChoisir={(e) => changerEspece(e)}
    />
  );
}
