import { useRouter } from 'expo-router';
import { FormulesSimple } from '@/features/commercial/simple/FormulesSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { TEXTES } from '@/shared/textes';

/** Une page simple de l'accueil du public, ouverte d'une tuile. */
export default function EcranFormulesSimple() {
  const router = useRouter();
  return (
    <EcranSimple titre={TEXTES.accueil.ferme.terrain.tuiles.formules}>
      <FormulesSimple onTerminer={() => retournerALaPageDAvant(router)} />
    </EcranSimple>
  );
}
