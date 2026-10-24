import { useRouter } from 'expo-router';
import { AccueilPublicSimple } from '@/features/commercial/simple/AccueilPublicSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { TEXTES } from '@/shared/textes';

/** Une page simple de l'accueil du public, ouverte d'une tuile. */
export default function EcranAccueilPublicSimple() {
  const router = useRouter();
  return (
    <EcranSimple titre={TEXTES.accueil.ferme.terrain.tuiles.accueilPublic}>
      <AccueilPublicSimple onTerminer={() => retournerALaPageDAvant(router)} />
    </EcranSimple>
  );
}
