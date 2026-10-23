import { useMemo, useRef, useState, type ReactNode } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

/** Une case du pied d'un tableau : elle couvre une ou plusieurs colonnes (« Balance » sous Débit et Crédit réunis). Les cases d'une ligne se suivent et couvrent toutes les colonnes. */
export interface CaseDePied {
  /** Les clés des colonnes qu'elle couvre, dans l'ordre. */
  colonnes: string[];
  contenu: ReactNode;
  aligne?: 'gauche' | 'droite' | 'centre';
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
  /** Des lignes de totaux alignées sur les colonnes (« Totaux » sous Débit et Crédit, puis « Balance » sur les deux réunis) ; elles défilent avec le tableau. */
  lignesDePied?: CaseDePied[][];
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

/** La poignée au bord droit d'un titre : on la tire pour élargir ou rétrécir la colonne. `onPrise` : au moment où on la saisit (le tableau fige alors les largeurs). */
function PoigneeDeColonne({ depart, onPrise, onLargeur, dernier }: { depart: () => number; onPrise: () => void; onLargeur: (largeur: number) => void; dernier: boolean }) {
  /** La largeur de la colonne et la position de la souris au moment où l'on a pris la poignée. */
  const prise = useRef({ largeur: 0, x: 0 });
  return (
    <View
      // La dernière poignée reste dans le tableau : elle ne le ferait pas défiler pour rien.
      style={[styles.poignee, dernier && styles.derniereDePoignee]}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        prise.current = { largeur: depart(), x: e.nativeEvent.pageX };
        onPrise();
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
export function TableauDeDonnees<T>({ colonnes, lignes, cleDeLaLigne, onLigne, vide, pied, lignesDePied, tri: triDeDepart, integre = false }: Props<T>) {
  const [tri, setTri] = useState(triDeDepart);
  /**
   * Les largeurs choisies à la souris (en points). Tant qu'on n'a rien tiré, les colonnes se partagent la largeur du tableau ; dès la première poignée saisie, toutes
   * gardent leur largeur du moment, et seule la colonne qu'on tire change (le tableau défile en travers quand il dépasse la fenêtre).
   */
  const [largeurs, setLargeurs] = useState<Record<string, number>>({});
  const mesures = useRef<Record<string, number>>({});
  const figer = () =>
    setLargeurs((l) => (Object.keys(l).length > 0 ? l : Object.fromEntries(colonnes.map((c) => [c.cle, Math.round(mesures.current[c.cle] ?? 100)]))));
  const figees = Object.keys(largeurs).length > 0;
  /** La largeur du tableau quand les colonnes sont figées : celle de toutes ses colonnes (il est au moins aussi large que la fenêtre). */
  const sommeDesLargeurs = colonnes.reduce((somme, c) => somme + (largeurs[c.cle] ?? 100), 0);
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
      <ScrollView horizontal showsHorizontalScrollIndicator={figees} style={integre ? undefined : styles.defilement} contentContainerStyle={figees ? styles.largeurDuTableau : styles.largeurDeLaFenetre}>
      <View style={[integre ? styles.tableauIntegre : styles.tableau, { width: figees ? sommeDesLargeurs : '100%' }]}>
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
              <Text style={styles.titre} numberOfLines={2}>
                {c.titre}
                {tri?.cle === c.cle ? (tri.decroissant ? ' ▼' : ' ▲') : ''}
              </Text>
            </Pressable>
            <PoigneeDeColonne
              depart={() => mesures.current[c.cle] ?? 100}
              onPrise={figer}
              dernier={c.cle === colonnes[colonnes.length - 1]?.cle}
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
      {lignesDePied?.map((ligne, rang) => (
        <View key={rang} style={[styles.lignePied, rang === 0 && styles.premiereLignePied]}>
          {ligne.map((cellule) => {
            const couvertes = colonnes.filter((c) => cellule.colonnes.includes(c.cle));
            // Larges comme les colonnes qu'elle couvre : leur somme (largeurs figées) ou la somme de leurs parts.
            const taille = couvertes.every((c) => largeurs[c.cle])
              ? { width: couvertes.reduce((somme, c) => somme + largeurs[c.cle], 0), flexGrow: 0, flexShrink: 0 }
              : { flex: couvertes.reduce((somme, c) => somme + (c.poids ?? 1), 0) };
            return (
              <View key={cellule.colonnes.join('+')} style={[styles.cellulePied, taille, { alignItems: cellule.aligne === 'droite' ? 'flex-end' : cellule.aligne === 'centre' ? 'center' : 'flex-start' }]}>
                {typeof cellule.contenu === 'string' ? <Text style={styles.textePied}>{cellule.contenu}</Text> : cellule.contenu}
              </View>
            );
          })}
        </View>
      ))}
      </View>
      </ScrollView>
      {pied ? <View style={styles.pied}>{pied}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.surface, overflow: 'hidden' },
  cadreIntegre: { flex: undefined },
  // Le défilement en travers : le tableau a au moins la largeur de la fenêtre, et celle de ses colonnes quand elles la dépassent.
  defilement: { flex: 1 },
  largeurDuTableau: { minWidth: '100%' },
  // Tant qu'aucune colonne n'a été tirée : exactement la largeur de la fenêtre (un texte long ne doit pas élargir le tableau).
  largeurDeLaFenetre: { width: '100%' },
  tableau: { flexShrink: 0 },
  tableauIntegre: { flexShrink: 0 },
  entete: { flexDirection: 'row', backgroundColor: colors.badgeBg, borderBottomWidth: 2, borderBottomColor: colors.primary },
  // Le curseur est dessiné en noir (celui du système est blanc à contour noir : il disparaît sur le gris clair).
  poignee: { position: 'absolute', right: -5, top: 0, bottom: 0, width: 11, alignItems: 'center', justifyContent: 'center', cursor: CURSEUR_REDIMENSION as never, zIndex: 2 },
  derniereDePoignee: { right: 0 },
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
  // Les lignes de totaux alignées sur les colonnes : la première a le trait épais du pied, les suivantes un fin trait.
  lignePied: { flexDirection: 'row', backgroundColor: colors.badgeBg, borderTopWidth: 1, borderTopColor: colors.border },
  premiereLignePied: { borderTopWidth: 2, borderTopColor: colors.primary },
  cellulePied: { paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' },
  textePied: { fontSize: 14, fontWeight: '800', color: colors.text },
  pied: { flexDirection: 'row', justifyContent: 'flex-start', gap: 24, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 2, borderTopColor: colors.primary, backgroundColor: colors.badgeBg },
});
