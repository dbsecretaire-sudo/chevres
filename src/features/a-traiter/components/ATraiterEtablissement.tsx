import { Pressable, Text, View } from 'react-native';
import type { ATraiter } from '@/features/a-traiter/types';
import { styles } from '@/shared/styles/a-traiter/ATraiterEtablissement.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.aTraiter;

interface Props {
  items: ATraiter[];
  onOuvrir: (item: ATraiter) => void;
}

/**
 * Ce qui attend l'utilisateur dans un établissement, sous sa ligne : chaque ligne dit ce qu'il y a à faire, puis (en gris) de
 * quel genre ; seul le retard est en rouge. Un appui ouvre la chose, sur l'écran qui la concerne.
 */
export function ATraiterEtablissement({ items, onOuvrir }: Props) {
  return (
    <View style={styles.liste}>
      {items.map((item) => (
        <Pressable key={item.id} style={styles.ligne} onPress={() => onOuvrir(item)}>
          <View style={[styles.pastille, item.enRetard && styles.pastilleRetard]} />
          <View style={styles.texte}>
            <Text style={styles.libelle}>{item.libelle}</Text>
            <Text style={[styles.detail, item.enRetard && styles.detailRetard]}>{T.genre[item.genre]}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
