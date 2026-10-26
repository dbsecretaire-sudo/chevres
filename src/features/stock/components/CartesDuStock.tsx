import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { piecesDisponibles } from '@/features/fichiers/services/pieces';
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

/** La couleur d'une quantité négative (une sortie non notée) : le rouge de la maquette. */
const COULEUR_NEGATIVE = '#B8402A';

/** La quantité d'une carte, avec son unité : « 4 250 kg », « 42 L », « 0,4 € », ou « 36 en stock » pour un nombre d'articles. */
const quantiteDeLaCarte = (carte: CarteStock): string =>
  carte.unite ? `${formaterQuantite(carte.niveau)} ${carte.unite}` : `${formaterQuantite(carte.niveau)} en stock`;

/** Les colonnes du tableau d'une rubrique du stock. */
const COLONNES_STOCK: readonly ColonneDuTableau<CarteStock>[] = [
  { cle: 'article', titre: 'Article', poids: 4, valeur: (c) => c.titre },
  { cle: 'quantite', titre: 'En stock', poids: 2, aligne: 'droite', valeur: (c) => c.niveau, texte: quantiteDeLaCarte },
];

/**
 * Les rubriques d'une catégorie du stock (« Fromages », « Matières premières »…), chacune avec ses articles en cartes blanches : elles montrent le
 * même stock que l'écran du stock. Sur le poste de comptabilité, chaque rubrique est un tableau.
 */
export function RubriquesDeCartes({
  groupes,
  origine,
}: {
  groupes: readonly GroupeDeCartes[];
  /** La page où l'on est (l'adresse) : la flèche de retour de la page ouverte par une carte y ramène. */
  origine?: string;
}) {
  const router = useRouter();
  // Le poste de comptabilité : chaque rubrique est un tableau (article, quantité), pas une liste de cartes.
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
            <Text style={styles.rubriqueTitre}>{g.titre}</Text>
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
            <Text style={styles.rubriqueTitre}>{g.titre}</Text>
            <View style={styles.liste}>
              {g.cartes.map((c, i) => (
                <CarteDeStock
                  key={c.cle}
                  rang={i}
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
 * Une carte d'article du stock, comme sur la maquette : une ligne blanche, son nom (et dessous un petit texte : son prix), puis ce qu'il en reste
 * à droite. Un appui l'ouvre ; un appui long la prend (elle frémit) pour la déplacer ; le crayon, en haut à droite, la renomme.
 */
export function CarteDeStock({
  libelleDuCrayon,
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
}: {
  /** Ce que dit le crayon (changer le nom, ou seulement l'image). */
  libelleDuCrayon?: string;
  /** Plusieurs quantités l'une sous l'autre (le lait) à la place de la quantité unique ; une couleur imposée (rouge) ou le signe de la quantité. */
  pastilles?: readonly { icone: string; quantite: string; niveau: number; couleur?: 'vert' | 'rouge' }[];
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
        <View style={[styles.carte, selectionnee ? styles.carteSelectionnee : null]}>
          <Pressable
            style={styles.zone}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityLabel={`${titre} : ${quantite}`}
          >
            <View style={styles.texte}>
              <Text style={styles.nom} numberOfLines={2}>
                {titre}
              </Text>
              {sous ? (
                <Text style={styles.sous} numberOfLines={2}>
                  {sous}
                </Text>
              ) : null}
            </View>
            <View style={styles.quantites}>
              {(pastilles ?? [{ icone: 'piece', quantite, niveau }]).map((p, i) => (
                <Text
                  key={i}
                  style={[styles.quantite, { color: p.couleur === 'rouge' || p.niveau < 0 ? COULEUR_NEGATIVE : colors.primary }]}
                  numberOfLines={1}
                >
                  {p.quantite}
                </Text>
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

/** La liste des cartes d'une rubrique : une carte par ligne. */
export const grilleDeCartes = StyleSheet.create({
  grille: { gap: 8 },
}).grille;

const styles = StyleSheet.create({
  rubrique: { gap: 8 },
  rubriqueTitre: {
    alignSelf: 'flex-start',
    backgroundColor: colors.badgeBg,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  liste: { gap: 8 },
  cellule: { width: '100%' },
  carte: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  carteSelectionnee: { borderColor: colors.primary },
  zone: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 28 },
  texte: { flex: 1, gap: 2 },
  nom: { fontSize: 16, fontWeight: '700', color: colors.text },
  sous: { fontSize: 13, color: colors.textMuted },
  quantites: { alignItems: 'flex-end', gap: 2 },
  quantite: { fontSize: 16, fontWeight: '800' },
  crayon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vide: { color: colors.textMuted, fontSize: 13, paddingVertical: 6 },
});
