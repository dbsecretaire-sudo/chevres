import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { BlocLignes } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { DetailLotsModal } from '@/features/stock/components/DetailLotsModal';
import { lireArchiveStock } from '@/features/stock/repository';
import { lotsDeLInventaire } from '@/features/stock/services/lots';
import { articlesDuGenre, niveauxDeStock, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { ETAT_LOT, GENRE_ARTICLE } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.fromages;

/**
 * Les fromages de l'animal actif, un par type : son stock et ses lots. Un appui ouvre le détail des lots (fabrication, vente,
 * rappel, contrôle) ; le bouton + fabrique des fromages numérotés ou en rappelle.
 */
export default function ListeFromages() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [ouvert, setOuvert] = useState<ArticleAffiche | null>(null);
  const [visible, setVisible] = useState(false);

  const charger = useCallback(() => lireArchiveStock().then(setArchive), []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const articles = archive ? articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive, espece) : [];
  const niveaux = archive ? niveauxDeStock(archive.mouvements) : new Map<string, number>();
  const lots = archive?.lots ?? [];
  const enStock = (cle: string) => lotsDeLInventaire({ lots }, ETAT_LOT.EN_STOCK, cle).length;

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={commonStyles.boutonEnteteDroite}
              onPress={() => router.push(ROUTES.PRODUCTION_STATISTIQUES)}
              hitSlop={10}
              accessibilityLabel={T.statistiques}
            >
              <Ionicons name="stats-chart" size={24} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <SelecteurEspece />
        {articles.length === 0 ? (
          <EmptyState title={T.aucun} />
        ) : (
          <BlocLignes>
            {articles.map((a) => {
              const total = lotsDeLInventaire({ lots }, ETAT_LOT.TOUT, a.cle).length;
              return (
                <ListRow
                  key={a.cle}
                  title={a.libelle}
                  subtitle={T.ligne(enStock(a.cle), total)}
                  trailing={
                    <View style={commonStyles.row}>
                      <Text style={commonStyles.lineBold}>{niveaux.get(a.cle) ?? 0}</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                  }
                  onPress={() => {
                    setOuvert(a);
                    setVisible(true);
                  }}
                />
              );
            })}
          </BlocLignes>
        )}
      </ScrollView>
      <Fab
        options={[
          {
            label: T.fabriquer,
            icon: 'add-circle',
            onPress: () => router.push(ROUTES.PRODUCTION_FABRICATION),
          },
          {
            label: T.rappeler,
            icon: 'alert-circle',
            onPress: () => router.push(ROUTES.PRODUCTION_RAPPEL),
          },
        ]}
      />
      <DetailLotsModal
        visible={visible}
        article={ouvert}
        lots={lots}
        sansLot={ouvert ? Math.max(0, (niveaux.get(ouvert.cle) ?? 0) - enStock(ouvert.cle)) : 0}
        onChange={charger}
        onFermer={() => setVisible(false)}
      />
    </Screen>
  );
}
