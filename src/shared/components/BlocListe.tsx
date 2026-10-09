import { Children, createContext, useContext, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { styles } from '@/shared/styles/components/BlocListe.styles';

const BlocListeContext = createContext(false);

/** Vrai pour une ligne posée dans un bloc de liste : elle n'a alors ni cadre ni fond propres (c'est ceux du bloc). */
export const useDansBloc = (): boolean => useContext(BlocListeContext);

/**
 * Une liste en un seul bloc blanc : les lignes se suivent sans espace, séparées par un fin trait (`separationBloc` à poser sur
 * chaque ligne sauf la première).
 */
export function BlocListe({ children }: PropsWithChildren) {
  return (
    <BlocListeContext.Provider value>
      <View style={styles.bloc}>{children}</View>
    </BlocListeContext.Provider>
  );
}

export const separationBloc = styles.separation;

/** Un bloc blanc dont chaque enfant est une ligne : les traits qui les séparent se posent seuls (les enfants vides sont ignorés). */
export function BlocLignes({ children }: PropsWithChildren) {
  return (
    <BlocListe>
      {Children.toArray(children).map((ligne, i) => (
        <View key={i} style={i > 0 ? separationBloc : undefined}>
          {ligne}
        </View>
      ))}
    </BlocListe>
  );
}

/**
 * Une ligne d'une liste défilante (FlatList) présentée comme un seul bloc blanc : la première ligne arrondit le haut, la dernière
 * le bas, un fin trait sépare chacune de la suivante. À poser dans `renderItem`, avec le rang de la ligne et leur nombre.
 */
export function LigneDeBloc({ index, total, children }: PropsWithChildren<{ index: number; total: number }>) {
  return (
    <BlocListeContext.Provider value>
      <View
        style={[styles.ligneDeBloc, index === 0 && styles.premiere, index === total - 1 && styles.derniere]}
      >
        {children}
      </View>
    </BlocListeContext.Provider>
  );
}
