import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ATraiter } from '@/features/a-traiter/types';
import { GENRE_A_TRAITER, LIGNES_A_TRAITER_VISIBLES } from '@/shared/constants/aTraiter';
import { styles } from '@/shared/styles/a-traiter/CarteATraiter.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.aTraiter;

interface Props {
  items: ATraiter[];
  onOuvrir: (item: ATraiter) => void;
}

/**
 * Le haut de l'écran d'accueil : ce qui attend l'utilisateur, tous établissements confondus. Chaque ligne dit ce qu'il y a à
 * faire, puis (en gris) dans quel établissement et de quel genre ; seul le retard est en rouge. Un appui ouvre la chose.
 */
export function CarteATraiter({ items, onOuvrir }: Props) {
  const [toutVoir, setToutVoir] = useState(false);
  if (items.length === 0) return null;
  const visibles = toutVoir ? items : items.slice(0, LIGNES_A_TRAITER_VISIBLES);
  const cachees = items.length - visibles.length;
  return (
    <View style={styles.carte}>
      <Text style={styles.titre}>
        {T.titre} · {items.length}
      </Text>
      {visibles.map((item, index) => {
        const enRetard = item.genre === GENRE_A_TRAITER.TACHE_EN_RETARD;
        return (
          <Pressable
            key={item.id}
            style={[styles.ligne, index > 0 && styles.ligneSeparee]}
            onPress={() => onOuvrir(item)}
          >
            <View style={[styles.pastille, { backgroundColor: enRetard ? colors.danger : colors.border }]} />
            <View style={styles.texte}>
              <Text style={styles.libelle}>{item.libelle}</Text>
              <Text style={[styles.detail, enRetard && styles.detailRetard]}>
                {item.etablissementNom} · {T.genre[item.genre]}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {cachees > 0 || toutVoir ? (
        <Pressable onPress={() => setToutVoir((v) => !v)}>
          <Text style={styles.plus}>{toutVoir ? T.voirMoins : T.voirPlus(cachees)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
