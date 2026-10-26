import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { lireArchiveStock } from '@/features/stock/repository';
import { ajouterArticle, articlesDuGenre, niveauxDeStock } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { useRole } from '@/features/roles/context/RoleContext';
import { ROLE } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';

/** Les onglets du stock, comme sur la maquette : chacun montre les articles d'un genre, et son bouton d'ajout. */
const ONGLETS: { genre: GenreArticle; titre: string; ajout: string }[] = [
  { genre: GENRE_ARTICLE.FROMAGE, titre: 'Fromages', ajout: 'Ajouter un fromage' },
  { genre: GENRE_ARTICLE.EMBALLAGE, titre: 'Emballages', ajout: 'Ajouter un emballage' },
  { genre: GENRE_ARTICLE.EQUIPEMENT, titre: 'Équipement', ajout: 'Ajouter un équipement' },
];

/**
 * Le stock sur le téléphone, comme sur la maquette : des onglets par genre (fromages, emballages, équipement), une carte par article avec
 * son prix à la pièce et son nombre en stock, un bouton pour ajouter, puis les rubriques avancées (structure des listes, historique, statistiques).
 */
export default function StockLots() {
  const router = useRouter();
  const { role } = useRole();
  // Le mode normal regarde seulement : les rubriques avancées ne s'affichent pas.
  const simple = role === ROLE.BERGER;
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [onglet, setOnglet] = useState<GenreArticle>(ONGLETS[0].genre);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  const charger = useCallback(() => {
    lireArchiveStock()
      .then(setArchive)
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const articles = useMemo(() => (archive ? articlesDuGenre(onglet, archive) : []), [archive, onglet]);
  const niveaux = useMemo(() => (archive ? niveauxDeStock(archive.mouvements) : new Map<string, number>()), [archive]);
  if (!archive) return null;
  const ongletCourant = ONGLETS.find((o) => o.genre === onglet) ?? ONGLETS[0];

  const ajouter = async (nom: string) => {
    await ajouterArticle(onglet, nom);
    setAjoutOuvert(false);
    charger();
  };

  const avance = (
    <View style={styles.trailing}>
      <Badge label="Avancé" color={colors.text} />
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.contenu} style={styles.fond}>
      <View style={styles.onglets}>
        {ONGLETS.map((o) => {
          const actif = o.genre === onglet;
          return (
            <Pressable
              key={o.genre}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              onPress={() => setOnglet(o.genre)}
              style={[styles.onglet, actif && styles.ongletActif]}
            >
              <Text style={[styles.ongletTexte, actif && styles.ongletTexteActif]}>{o.titre}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.entete}>
        <Text style={styles.enteteTexte}>{ongletCourant.titre}</Text>
      </View>

      {articles.length === 0 ? <Text style={styles.vide}>Aucun article pour le moment.</Text> : null}
      {articles.map((a) => (
        <View key={a.cle} style={styles.carte}>
          <View style={styles.carteTexte}>
            <Text style={styles.nom}>{a.libelle}</Text>
            {a.prix ? <Text style={styles.prix}>{`${formatMontant(a.prix)} la pièce`}</Text> : null}
          </View>
          <Text style={styles.quantite}>{`${niveaux.get(a.cle) ?? 0} en stock`}</Text>
        </View>
      ))}

      <Button label={ongletCourant.ajout} onPress={() => setAjoutOuvert(true)} />

      {simple ? null : (
        <BlocLignes>
          <ListRow
            title="Structure des listes"
            icone="list"
            trailing={avance}
            onPress={() => router.push(ROUTES.STOCK_STRUCTURE)}
          />
          <ListRow
            title="Historique"
            icone="time"
            trailing={avance}
            onPress={() => router.push(ROUTES.stockHistorique())}
          />
          <ListRow
            title="Statistiques"
            icone="stats-chart"
            trailing={avance}
            onPress={() => router.push(ROUTES.STOCK_STATISTIQUES)}
          />
        </BlocLignes>
      )}

      <NomModal
        visible={ajoutOuvert}
        titre={ongletCourant.ajout}
        onValider={ajouter}
        onAnnuler={() => setAjoutOuvert(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: colors.background },
  contenu: { padding: 16, gap: 12 },
  onglets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  onglet: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ongletActif: { backgroundColor: colors.primary, borderColor: colors.primary },
  ongletTexte: { fontWeight: '600', color: colors.text },
  ongletTexteActif: { color: colors.blanc },
  entete: { backgroundColor: colors.badgeBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  enteteTexte: { fontWeight: '700', color: colors.primary },
  vide: { color: colors.textMuted, textAlign: 'center' },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  carteTexte: { flex: 1, gap: 2 },
  nom: { fontSize: 16, fontWeight: '700', color: colors.text },
  prix: { color: colors.textMuted },
  quantite: { fontSize: 16, fontWeight: '800', color: colors.text },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
