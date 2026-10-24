import { useRouter } from 'expo-router';
import { VentesSimple } from '@/features/production/simple/VentesSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { TEXTES } from '@/shared/textes';

/** « Ventes » en tuiles : ouvert d'un appui sur la tuile de l'atelier. */
export default function EcranVentesSimple() {
  const router = useRouter();
  return (
    <EcranSimple titre={TEXTES.accueil.ferme.terrain.tuiles.ventes}>
      <VentesSimple onRetour={() => retournerALaPageDAvant(router)} />
    </EcranSimple>
  );
}
