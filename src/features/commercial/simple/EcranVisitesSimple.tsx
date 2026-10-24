import { useRouter } from 'expo-router';
import { VisitesSimple } from '@/features/commercial/simple/VisitesSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { TEXTES } from '@/shared/textes';

/** Une page simple de l'accueil du public, ouverte d'une tuile. */
export default function EcranVisitesSimple() {
  const router = useRouter();
  return (
    <EcranSimple titre={TEXTES.accueil.ferme.terrain.tuiles.visites}>
      <VisitesSimple onRetour={() => retournerALaPageDAvant(router)} />
    </EcranSimple>
  );
}
