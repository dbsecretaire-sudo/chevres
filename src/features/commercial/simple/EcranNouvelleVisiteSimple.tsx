import { useRouter } from 'expo-router';
import { NouvelleVisiteSimple } from '@/features/commercial/simple/NouvelleVisiteSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { TEXTES } from '@/shared/textes';

/** Une page simple de l'accueil du public, ouverte d'une tuile. */
export default function EcranNouvelleVisiteSimple() {
  const router = useRouter();
  return (
    <EcranSimple titre={TEXTES.accueil.ferme.terrain.tuiles.nouvelleVisite}>
      <NouvelleVisiteSimple onTerminer={() => retournerALaPageDAvant(router)} />
    </EcranSimple>
  );
}
