import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Apparition } from '@/features/accueil/ferme/animations';
import {
  formaterQuantite,
  type CarteStock,
  type GroupeDeCartes,
} from '@/features/stock/services/entrepotJeu';
import { Frisson } from '@/shared/components/ListeReordonnable';
import { ROUTES } from '@/shared/constants/routes';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux.entrepot;

/** La quantité d'une carte, avec son unité : « 4 250 kg », « 42 L », « 0,4 € », ou un nombre d'articles. */
const quantiteDeLaCarte = (carte: CarteStock): string =>
  `${formaterQuantite(carte.niveau)}${carte.unite ? ` ${carte.unite}` : ''}`;

/** Une carte du stock, comme une carte d'objet d'un jeu : son dessin, son nom, et en dessous une pastille avec ce qu'il en reste. */
function Carte({ carte, rang, origine }: { carte: CarteStock; rang: number; origine?: string }) {
  const router = useRouter();
  const manque = carte.niveau < 0;
  return (
    <Apparition delai={rang * 30} style={styles.cellule}>
      <Pressable
        style={styles.carte}
        onPress={() => {
          const destination = `${ROUTES.COMPTABILITE_STOCKS}?onglet=${carte.section}`;
          if (origine) noterOrigine(origine, destination);
          router.push(destination as never);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${carte.titre} : ${quantiteDeLaCarte(carte)}`}
      >
        <Text style={styles.dessin} accessibilityElementsHidden importantForAccessibility="no">
          {carte.emoji}
        </Text>
        <Text style={styles.nom} numberOfLines={2}>
          {carte.titre}
        </Text>
        <View
          style={[
            styles.pastille,
            manque ? styles.pastilleRouge : null,
            carte.niveau === 0 ? styles.pastilleVide : null,
          ]}
        >
          <View style={styles.piece}>
            <Ionicons name="cube" size={12} color="#7A5410" />
          </View>
          <Text style={styles.quantite} numberOfLines={1}>
            {quantiteDeLaCarte(carte)}
          </Text>
        </View>
      </Pressable>
    </Apparition>
  );
}

/**
 * Les rubriques d'une catégorie du stock (« Ventes — Fromages »…), chacune avec ses cartes : elles montrent le même stock que l'écran du
 * stock. Sur un fond clair (la transformation), les titres sont en vert foncé.
 */
export function RubriquesDeCartes({
  groupes,
  clair = false,
  origine,
}: {
  groupes: readonly GroupeDeCartes[];
  clair?: boolean;
  /** La page où l'on est (l'adresse) : la flèche de retour de la page ouverte par une carte y ramène. */
  origine?: string;
}) {
  return (
    <>
      {groupes.map((g) => (
        <View key={g.cle} style={styles.rubrique}>
          <Text style={[styles.rubriqueTitre, clair ? styles.rubriqueTitreSurClair : null]}>{g.titre}</Text>
          <View style={styles.grille}>
            {g.cartes.map((c, i) => (
              <Carte key={c.cle} carte={c} rang={i} origine={origine} />
            ))}
            {g.cartes.length === 0 ? <Text style={styles.vide}>{T.vide}</Text> : null}
          </View>
        </View>
      ))}
    </>
  );
}

/**
 * Une carte d'article du stock, la même que celles de la grange : son dessin, son nom (et dessous un petit texte : son prix), puis la pastille de ce qu'il en reste.
 * Un appui l'ouvre ; un appui long la prend (elle frémit) pour la déplacer ; le crayon, en haut à droite, la renomme.
 */
export function CarteDeStock({
  emoji,
  titre,
  quantite,
  niveau,
  sous,
  rang,
  selectionnee,
  onPress,
  onLongPress,
  onRenommer,
}: {
  emoji: string;
  titre: string;
  quantite: string;
  niveau: number;
  sous?: string;
  rang: number;
  selectionnee?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onRenommer?: () => void;
}) {
  return (
    <Apparition delai={rang * 30} style={styles.cellule}>
      <Frisson actif={!!selectionnee}>
        {/* La carte (le cadre) contient la zone d'appui et, à côté d'elle, le crayon : un bouton ne peut pas en contenir un autre. */}
        <View style={[styles.carte, selectionnee ? styles.carteSelectionnee : null]}>
          <Pressable
            style={styles.zoneDeLaCarte}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityLabel={`${titre} : ${quantite}`}
          >
            <Text style={styles.dessin} accessibilityElementsHidden importantForAccessibility="no">
              {emoji}
            </Text>
            <Text style={styles.nom} numberOfLines={2}>
              {titre}
            </Text>
            {sous ? (
              <Text style={styles.sous} numberOfLines={2}>
                {sous}
              </Text>
            ) : null}
            <View
              style={[
                styles.pastille,
                niveau < 0 ? styles.pastilleRouge : null,
                niveau === 0 ? styles.pastilleVide : null,
              ]}
            >
              <View style={styles.piece}>
                <Ionicons name="cube" size={12} color="#7A5410" />
              </View>
              <Text style={styles.quantite} numberOfLines={1}>
                {quantite}
              </Text>
            </View>
          </Pressable>
          {onRenommer ? (
            <Pressable
              style={styles.crayon}
              onPress={onRenommer}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={TEXTES.stock.renommer.modifier}
            >
              <Ionicons name="pencil" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </Frisson>
    </Apparition>
  );
}

/** La grille des cartes d'une rubrique : trois par ligne, comme à la grange. */
export const grilleDeCartes = StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
}).grille;

const PARCHEMIN = '#F4E7C8';

const styles = StyleSheet.create({
  rubrique: { gap: 6 },
  rubriqueTitre: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F4A1E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rubriqueTitreSurClair: { color: '#2F6B14' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cellule: { width: '31%' },
  carte: {
    backgroundColor: PARCHEMIN,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#9A6B3C',
    paddingTop: 8,
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  carteSelectionnee: { borderColor: '#E8892B' },
  zoneDeLaCarte: { alignSelf: 'stretch', alignItems: 'center', gap: 2 },
  sous: { fontSize: 10, color: '#7A5A36', textAlign: 'center', paddingHorizontal: 4, marginTop: -4 },
  crayon: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dessin: { fontSize: 46 },
  nom: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B2D0E',
    textAlign: 'center',
    minHeight: 30,
    paddingHorizontal: 4,
  },
  pastille: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5F9330',
    borderTopWidth: 3,
    borderTopColor: '#3F6B1E',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pastilleRouge: { backgroundColor: '#B8402A', borderTopColor: '#7E2616' },
  pastilleVide: { backgroundColor: '#8E9A7C', borderTopColor: '#6B7660' },
  piece: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2C94C',
    borderWidth: 1,
    borderColor: '#B58B1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantite: { flex: 1, textAlign: 'right', color: colors.blanc, fontSize: 14, fontWeight: '900' },
  vide: { width: '100%', color: '#2F4A1E', fontSize: 13, fontWeight: '700', paddingVertical: 6 },
});
