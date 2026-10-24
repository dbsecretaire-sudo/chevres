import { useRouter } from 'expo-router';
import { CadreAtelierSimple } from '@/features/production/simple/CadreAtelierSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { TEXTES } from '@/shared/textes';

/** Le cadre réglementaire de la fromagerie en page simple, ouvert d'une tuile. */
export default function EcranCadreAtelierSimple() {
  const router = useRouter();
  return (
    <EcranSimple titre={TEXTES.accueil.ferme.terrain.tuiles.cadreReglementaire}>
      <CadreAtelierSimple onTerminer={() => retournerALaPageDAvant(router)} />
    </EcranSimple>
  );
}
