import { ScrollView, Text, View } from 'react-native';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/comptabilite/RepartitionLait.styles';

export interface ColonneTableau {
  cle: string;
  titre: string;
  /** La largeur de la colonne (px). */
  largeur: number;
}

export interface LigneTableau {
  cle: string;
  /** Le texte de chaque cellule, par clé de colonne. */
  cellules: Record<string, string>;
  /** La ligne de total : un trait au-dessus, en gras. */
  total?: boolean;
}

/** Un tableau de textes, de simples vues : un en-tête, des lignes et éventuellement un total ; il défile en largeur sur un écran étroit. */
export function TableauSimple({ colonnes, lignes }: { colonnes: ColonneTableau[]; lignes: LigneTableau[] }) {
  const cellule = (texte: string, largeur: number, gras?: boolean) => (
    <Text
      style={[
        commonStyles.line,
        styles.cellule,
        { width: largeur },
        gras ? commonStyles.lineBold : undefined,
      ]}
    >
      {texte}
    </Text>
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <View style={[styles.ligne, styles.entete]}>
          {colonnes.map((c) => (
            <View key={c.cle}>{cellule(c.titre, c.largeur, true)}</View>
          ))}
        </View>
        {lignes.map((l) => (
          <View key={l.cle} style={[styles.ligne, l.total ? styles.total : undefined]}>
            {colonnes.map((c) => (
              <View key={c.cle}>{cellule(l.cellules[c.cle] ?? '', c.largeur, l.total)}</View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
