import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { piecesDisponibles } from '@/features/fichiers/services/pieces';
import { DessinDeCarte } from '@/features/stock/components/DessinDeCarte';
import { HistoriqueArticleModal } from '@/features/stock/components/HistoriqueArticleModal';
import { ModaleImageArticle } from '@/features/stock/components/ModaleImageArticle';
import { Apparition } from '@/features/accueil/ferme/animations';
import {
  formaterQuantite,
  type CarteStock,
  type GroupeDeCartes,
} from '@/features/stock/services/entrepotJeu';
import { Frisson } from '@/shared/components/ListeReordonnable';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lieux.entrepot;

/** La quantité d'une carte, avec son unité : « 4 250 kg », « 42 L », « 0,4 € », ou un nombre d'articles. */
const quantiteDeLaCarte = (carte: CarteStock): string =>
  `${formaterQuantite(carte.niveau)}${carte.unite ? ` ${carte.unite}` : ''}`;

/** Les colonnes du tableau d'une rubrique du stock. */
const COLONNES_STOCK: readonly ColonneDuTableau<CarteStock>[] = [
  { cle: 'article', titre: 'Article', poids: 4, valeur: (c) => c.titre },
  { cle: 'quantite', titre: 'En stock', poids: 2, aligne: 'droite', valeur: (c) => c.niveau, texte: quantiteDeLaCarte },
];

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
  const router = useRouter();
  // Le poste de comptabilité : chaque rubrique est un tableau (article, quantité), pas une grille de cartes.
  const comptable = useDispositionComptable();
  // Le mode normal regarde seulement : ni crayon, ni historique au clic.
  const { role } = useRole();
  const simple = role === ROLE.BERGER;
  /** La carte dont on change l'image (le crayon n'y est que là où l'appareil range des fichiers). */
  const [imageDe, setImageDe] = useState<CarteStock | null>(null);
  /** La carte dont on regarde l'historique (un appui sur elle). */
  const [historiqueDe, setHistoriqueDe] = useState<CarteStock | null>(null);
  const ouvrirLeStock = (c: CarteStock) => {
    const destination = `${ROUTES.COMPTABILITE_STOCKS}?onglet=${c.section}`;
    if (origine) noterOrigine(origine, destination);
    router.push(destination as never);
  };
  return (
    <>
      {groupes.map((g) =>
        comptable ? (
          <View key={g.cle} style={styles.rubrique}>
            <Text style={[styles.rubriqueTitre, clair ? styles.rubriqueTitreSurClair : null]}>{g.titre}</Text>
            <TableauDeDonnees
              integre
              colonnes={COLONNES_STOCK}
              lignes={g.cartes}
              cleDeLaLigne={(c) => c.cle}
              vide={T.vide}
              onLigne={(c) => (c.cle === 'oeufs' ? ouvrirLeStock(c) : simple ? undefined : setHistoriqueDe(c))}
            />
          </View>
        ) : (
        <View key={g.cle} style={styles.rubrique}>
          <Text style={[styles.rubriqueTitre, clair ? styles.rubriqueTitreSurClair : null]}>{g.titre}</Text>
          <View style={styles.grille}>
            {g.cartes.map((c, i) => (
              <CarteDeStock
                key={c.cle}
                cle={c.cle}
                rang={i}
                emoji={c.emoji}
                titre={c.titre}
                quantite={quantiteDeLaCarte(c)}
                niveau={c.niveau}
                libelleDuCrayon={TEXTES.stock.articleModal.image.modifier}
                onRenommer={piecesDisponibles() && !simple ? () => setImageDe(c) : undefined}
                // Un article (et le lait) : son historique ; les œufs n'en ont pas, ils ouvrent l'inventaire.
                onPress={() => (c.cle === 'oeufs' ? ouvrirLeStock(c) : simple ? undefined : setHistoriqueDe(c))}
              />
            ))}
            {g.cartes.length === 0 ? <Text style={styles.vide}>{T.vide}</Text> : null}
          </View>
        </View>
        ),
      )}
      <HistoriqueArticleModal
        article={historiqueDe}
        onOuvrirLeStock={() => {
          if (historiqueDe) ouvrirLeStock(historiqueDe);
          setHistoriqueDe(null);
        }}
        onFermer={() => setHistoriqueDe(null)}
      />
      <ModaleImageArticle
        article={imageDe ? { cle: imageDe.cle, titre: imageDe.titre, emoji: imageDe.emoji } : null}
        onFermer={() => setImageDe(null)}
      />
    </>
  );
}

/**
 * Une carte d'article du stock, la même que celles de la grange : son dessin, son nom (et dessous un petit texte : son prix), puis la pastille de ce qu'il en reste.
 * Un appui l'ouvre ; un appui long la prend (elle frémit) pour la déplacer ; le crayon, en haut à droite, la renomme.
 */
export function CarteDeStock({
  cle,
  libelleDuCrayon,
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
  pastilles,
  large,
}: {
  /** La carte prend la largeur de trois cartes (le lait) : ses pastilles se rangent sur deux colonnes. */
  large?: boolean;
  /** L'identifiant de l'article : l'image que l'utilisateur lui a choisie remplace le dessin d'origine. */
  cle?: string;
  /** Ce que dit le crayon (changer le nom, ou seulement l'image). */
  libelleDuCrayon?: string;
  /** Plusieurs pastilles l'une sous l'autre (le lait) à la place de la pastille unique : une icône (« piece » : la pièce du stock, ou un dessin), sa quantité et son niveau. */
  pastilles?: readonly { icone: string; quantite: string; niveau: number; couleur?: 'vert' | 'rouge' }[];
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
    <Apparition delai={rang * 30} style={large ? styles.celluleLarge : styles.cellule}>
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
            <DessinDeCarte emoji={emoji} cle={cle} />
            <Text style={styles.nom} numberOfLines={2}>
              {titre}
            </Text>
            {sous ? (
              <Text style={styles.sous} numberOfLines={2}>
                {sous}
              </Text>
            ) : null}
            <View style={large ? styles.pastillesEnColonnes : styles.pastillesEmpilees}>
            {(pastilles ?? [{ icone: 'piece', quantite, niveau }]).map((p, i) => (
              <View
                key={i}
                style={[
                  styles.pastille,
                  large ? styles.pastilleMoitie : null,
                  i > 0 && !large ? styles.pastilleSuivante : null,
                  // Une couleur imposée (le lait : produit toujours vert, utilisé en fromagerie toujours rouge sombre), sinon vert, gris à 0, rouge si négatif.
                  !p.couleur && p.niveau < 0 ? styles.pastilleRouge : null,
                  !p.couleur && p.niveau === 0 ? styles.pastilleVide : null,
                  p.couleur === 'rouge' ? styles.pastilleRougeSombre : null,
                ]}
              >
                {p.icone === 'piece' ? (
                  <View style={styles.piece}>
                    <Ionicons name="cube" size={12} color="#7A5410" />
                  </View>
                ) : (
                  <Text style={styles.dessinDePastille} accessibilityElementsHidden importantForAccessibility="no">
                    {p.icone}
                  </Text>
                )}
                <Text style={styles.quantite} numberOfLines={1}>
                  {p.quantite}
                </Text>
              </View>
            ))}
            </View>
          </Pressable>
          {onRenommer ? (
            <Pressable
              style={styles.crayon}
              onPress={onRenommer}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={libelleDuCrayon ?? TEXTES.stock.renommer.modifier}
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
  grille: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 10 },
}).grille;

const PARCHEMIN = '#F4E7C8';

const styles = StyleSheet.create({
  rubrique: { gap: 6 },
  rubriqueTitre: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B2D0E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rubriqueTitreSurClair: { color: '#4B2D0E' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cellule: { width: '31%' },
  celluleLarge: { width: '100%' },
  pastillesEmpilees: { alignSelf: 'stretch' },
  pastillesEnColonnes: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap' },
  pastilleMoitie: { width: '50%' },
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
  pastilleSuivante: { borderTopWidth: 1 },
  pastilleRougeSombre: { backgroundColor: '#8B0016', borderTopColor: '#5C000E' },
  dessinDePastille: { width: 20, fontSize: 15, textAlign: 'center' },
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
  vide: { width: '100%', color: '#4B2D0E', fontSize: 13, fontWeight: '700', paddingVertical: 6 },
});
