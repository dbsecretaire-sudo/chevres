import { useLocalSearchParams } from 'expo-router';
import { LotsViandeSimple } from '@/features/production/simple/LotsViandeSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { TEXTES } from '@/shared/textes';

/** Les lots de viande du mode normal : la viande à facturer ou à vendre, selon l'adresse. */
export default function EcranLotsViandeSimple() {
  const { quoi } = useLocalSearchParams<{ quoi?: string }>();
  const afacturer = quoi === 'afacturer';
  return (
    <EcranSimple titre={afacturer ? TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer : TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre}>
      <LotsViandeSimple quoi={afacturer ? 'afacturer' : 'avendre'} />
    </EcranSimple>
  );
}
