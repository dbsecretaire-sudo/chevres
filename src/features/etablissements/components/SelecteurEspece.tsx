import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

/**
 * Choix de l'espèce dont on gère le cheptel (chèvres, brebis…) : une puce, et la liste des animaux au clic. N'apparaît que
 * pour un établissement qui en élève plusieurs. Le changement recharge l'écran courant avec le vocabulaire et les données
 * de l'espèce.
 */
export function SelecteurEspece() {
  const { especes, espece, changerEspece } = useEtablissement();

  // Sur le téléphone, la capsule du haut de chaque page a déjà le choix de l'animal : il ne se répète pas dans la page.
  if (!estBureau() || especes.length < 2) return null;

  return (
    <ChoixDeroulant
      titre={TEXTES.commun.choix.animal}
      valeur={espece}
      options={especes.map((e) => ({ value: e, label: LABEL_TYPE_ANIMAL_ETABLISSEMENT[e] }))}
      onChoisir={(e) => changerEspece(e)}
    />
  );
}
