import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ListeAnimauxCliquables } from '@/features/cheptel/components/ListeAnimauxCliquables';
import { getChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { idsDesAnimauxEnvoyes } from '@/features/comptabilite/utils/ventes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.animauxEnvoyes;

/** Les animaux envoyés avec une dépense « Animaux vivants (sortie) » : leur nombre, puis chacun (un appui ouvre sa fiche). Rien pour une autre dépense. */
export function AnimauxEnvoyesListe({ facture }: { facture: { animauxEnvoyes?: string } }) {
  const ids = idsDesAnimauxEnvoyes(facture);
  const cle = ids.join(',');
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  useEffect(() => {
    if (!cle) return;
    Promise.all(cle.split(',').map(getChevre))
      .then((trouves) => setAnimaux(trouves.filter((a): a is Chevre => !!a)))
      .catch(() => undefined);
  }, [cle]);
  if (ids.length === 0) return null;
  return (
    <View style={commonStyles.gap8}>
      <Text style={commonStyles.lineSemiBold}>{T.nAnimaux(ids.length)}</Text>
      <ListeAnimauxCliquables animaux={animaux} />
    </View>
  );
}
