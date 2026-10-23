import { useMemo, useRef, useState, type ReactNode } from 'react';
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

/** Le curseur de redimensionnement : une double flèche noire (en SVG), à défaut le curseur du système. */
const CURSEUR_REDIMENSION =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M1 12l6-6v4h10V6l6 6-6 6v-4H7v4z' fill='black' stroke='white' stroke-width='1' /></svg>\") 12 12, col-resize";

/** La largeur d'une colonne ne descend pas sous celle-ci quand on l'étire à la souris. */
const LARGEUR_MINI = 50;

/** La poignée au bord droit d'un titre : on la tire pour élargir ou rétrécir la colonne. */
function PoigneeDeColonne({ depart, onLargeur }: { depart: () => number; onLargeur: (largeur: number) => void }) {
  /** La largeur de la colonne et la position de la souris au moment où l'on a pris la poignée. */
  const prise = useRef({ largeur: 0, x: 0 });
  return (
    <View
      style={styles.poignee}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        prise.current = { largeur: depart(), x: e.nativeEvent.pageX };
      }}
      onResponderMove={(e) =>
        onLargeur(Math.max(LARGEUR_MINI, Math.round(prise.current.largeur + e.nativeEvent.pageX - prise.current.x)))
      }
      accessibilityLabel="Élargir la colonne"
    >
      {/* Le séparateur « | » : il marque l'endroit où l'on peut tirer. */}
      <View style={styles.trait} pointerEvents="none" />
    </View>
  );
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
  /** Les largeurs choisies à la souris (en points) : une colonne étirée garde sa largeur, les autres se partagent le reste. */
  const [largeurs, setLargeurs] = useState<Record<string, number>>({});
  const mesures = useRef<Record<string, number>>({});
  const tailleDe = (c: ColonneDuTableau<T>) =>
    largeurs[c.cle] ? { width: largeurs[c.cle], flexGrow: 0, flexShrink: 0 } : { flex: c.poids ?? 1 };
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
        <View key={c.cle} style={[styles.cellule, tailleDe(c), { alignItems: alignement(c) }]}>
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
          <View
            key={c.cle}
            style={tailleDe(c)}
            onLayout={(e) => {
              mesures.current[c.cle] = e.nativeEvent.layout.width;
            }}
          >
            <Pressable
              style={[styles.celluleEntete, { justifyContent: alignement(c) }]}
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
            <PoigneeDeColonne
              depart={() => mesures.current[c.cle] ?? 100}
              onLargeur={(largeur) => setLargeurs((l) => ({ ...l, [c.cle]: largeur }))}
            />
          </View>
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
  // Le curseur est dessiné en noir (celui du système est blanc à contour noir : il disparaît sur le gris clair).
  poignee: { position: 'absolute', right: -5, top: 0, bottom: 0, width: 11, alignItems: 'center', justifyContent: 'center', cursor: CURSEUR_REDIMENSION as never, zIndex: 2 },
  trait: { width: 1.5, height: '55%', backgroundColor: colors.textMuted },
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
