import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

/** Une colonne d'un tableau : son titre, sa largeur relative, et comment lire (tri) et écrire (affichage) sa valeur dans chaque ligne. */
export interface ColonneDuTableau<T> {
  cle: string;
  titre: string;
  /** La largeur relative (1 par défaut) : les colonnes se partagent la largeur du tableau. */
  poids?: number;
  aligne?: 'gauche' | 'droite' | 'centre';
  /** La valeur de la ligne : elle sert au tri (un nombre se trie comme un nombre) et s'affiche telle quelle sans `texte` ni `rendu`. */
  valeur: (ligne: T) => string | number | undefined;
  /** Ce qui s'écrit dans la cellule quand ce n'est pas la valeur brute (un montant formaté, une date en français). */
  texte?: (ligne: T) => string;
  /** Une cellule faite à la main (un bouton, une pastille) ; elle n'ouvre pas la ligne. */
  rendu?: (ligne: T) => ReactNode;
  /** Faux : la colonne ne se trie pas. */
  triable?: boolean;
}

interface Props<T> {
  colonnes: readonly ColonneDuTableau<T>[];
  lignes: readonly T[];
  cleDeLaLigne: (ligne: T) => string;
  onLigne?: (ligne: T) => void;
  /** Ce qui s'écrit quand il n'y a aucune ligne. */
  vide: string;
  /** Une ligne de totaux sous le tableau (un solde, un effectif). */
  pied?: ReactNode;
  /** L'ordre de départ : la colonne et son sens. */
  tri?: { cle: string; decroissant?: boolean };
  /** Vrai : le tableau est posé dans un écran qui défile déjà (l'inventaire) ; il prend sa hauteur et n'a pas de liste virtualisée. */
  integre?: boolean;
}

const comparer = (a: string | number | undefined, b: string | number | undefined): number => {
  if (a === undefined || a === '') return b === undefined || b === '' ? 0 : 1;
  if (b === undefined || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' });
};

/**
 * Un tableau de données comme dans un logiciel de comptabilité : un en-tête qui reste en haut, des colonnes qu'on trie d'un clic sur leur titre, des lignes
 * à bandes alternées dont un clic ouvre la fiche, et un pied pour les totaux. La liste est virtualisée (des milliers d'écritures restent fluides).
 */
export function TableauDeDonnees<T>({ colonnes, lignes, cleDeLaLigne, onLigne, vide, pied, tri: triDeDepart, integre = false }: Props<T>) {
  const [tri, setTri] = useState(triDeDepart);
  const triees = useMemo(() => {
    const colonne = colonnes.find((c) => c.cle === tri?.cle);
    if (!colonne) return lignes;
    const sens = tri?.decroissant ? -1 : 1;
    return [...lignes].sort((a, b) => sens * comparer(colonne.valeur(a), colonne.valeur(b)));
  }, [lignes, colonnes, tri]);

  const basculer = (cle: string) =>
    setTri((courant) => (courant?.cle === cle ? { cle, decroissant: !courant.decroissant } : { cle }));

  const alignement = (colonne: ColonneDuTableau<T>) =>
    colonne.aligne === 'droite' ? 'flex-end' : colonne.aligne === 'centre' ? 'center' : 'flex-start';

  const ligneDe = (item: T, index: number) => (
    <Pressable
      key={cleDeLaLigne(item)}
      style={({ pressed }) => [styles.ligne, index % 2 === 1 && styles.ligneBande, pressed && onLigne ? styles.lignePressee : null]}
      disabled={!onLigne}
      onPress={() => onLigne?.(item)}
    >
      {colonnes.map((c) => (
        <View key={c.cle} style={[styles.cellule, { flex: c.poids ?? 1, alignItems: alignement(c) }]}>
          {c.rendu ? (
            c.rendu(item)
          ) : (
            <Text style={styles.texte} numberOfLines={2}>
              {c.texte ? c.texte(item) : (c.valeur(item) ?? '')}
            </Text>
          )}
        </View>
      ))}
    </Pressable>
  );

  return (
    <View style={[styles.cadre, integre && styles.cadreIntegre]}>
      <View style={styles.entete}>
        {colonnes.map((c) => (
          <Pressable
            key={c.cle}
            style={[styles.celluleEntete, { flex: c.poids ?? 1, justifyContent: alignement(c) }]}
            disabled={c.triable === false}
            onPress={() => basculer(c.cle)}
            accessibilityRole="button"
            accessibilityLabel={c.titre}
          >
            <Text style={styles.titre} numberOfLines={1}>
              {c.titre}
              {tri?.cle === c.cle ? (tri.decroissant ? ' ▼' : ' ▲') : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      {integre ? (
        <View>
          {triees.length === 0 ? <Text style={styles.vide}>{vide}</Text> : triees.map(ligneDe)}
        </View>
      ) : (
        <FlatList
          data={triees}
          keyExtractor={cleDeLaLigne}
          style={styles.corps}
          initialNumToRender={40}
          ListEmptyComponent={<Text style={styles.vide}>{vide}</Text>}
          renderItem={({ item, index }) => ligneDe(item, index)}
        />
      )}
      {pied ? <View style={styles.pied}>{pied}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.surface, overflow: 'hidden' },
  cadreIntegre: { flex: undefined },
  entete: { flexDirection: 'row', backgroundColor: colors.badgeBg, borderBottomWidth: 2, borderBottomColor: colors.primary },
  celluleEntete: { paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  titre: { fontSize: 12, fontWeight: '800', color: colors.primaryDark, textTransform: 'uppercase', letterSpacing: 0.3 },
  corps: { flex: 1 },
  ligne: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 34 },
  ligneBande: { backgroundColor: colors.background },
  lignePressee: { backgroundColor: colors.badgeBg },
  cellule: { paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center' },
  texte: { fontSize: 13, color: colors.text },
  vide: { padding: 20, textAlign: 'center', color: colors.textMuted, fontStyle: 'italic' },
  pied: { flexDirection: 'row', justifyContent: 'flex-start', gap: 24, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 2, borderTopColor: colors.primary, backgroundColor: colors.badgeBg },
});
