import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
  type Href,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { Screen } from '@/shared/components/ScreenList';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { Fab } from '@/shared/components/Fab';
import { listComptesPcg, type CompteComptableEnregistre } from '@/features/comptes-pcg/repository';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export default function ComptesPcgIndex() {
  const router = useRouter();
  const navigation = useNavigation();
  const { retour } = useLocalSearchParams<{ retour?: string }>();
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setComptes(await listComptesPcg());
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
      // La flèche de retour vers l'écran d'où l'on vient ne vaut que pour cette visite.
      return () => navigation.setParams({ retour: undefined } as never);
    }, [charger, navigation]),
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return comptes;
    return comptes.filter((c) => [c.numero, c.libelle].some((v) => v?.toLowerCase().includes(q)));
  }, [comptes, recherche]);

  return (
    <Screen scroll={false}>
      {/* Ouvert depuis un autre écran (la structure de l'inventaire…) : la flèche y ramène. */}
      <Stack.Screen
        options={{
          headerLeft: retour
            ? () => (
                <Pressable style={commonStyles.boutonCompact} onPress={() => router.navigate(retour as Href)}>
                  <Ionicons name="arrow-back" size={24} color={colors.blanc} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={commonStyles.topPadded}>
        <ChampRecherche
          value={recherche}
          onChangeText={setRecherche}
          placeholder={TEXTES.comptesPcg.listeComptesPcg.nOuLibellePoints}
        />
      </View>

      <FlatList
        data={filtres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listFab}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.comptesPcg.listeComptesPcg.aucunCompte}
            subtitle={TEXTES.comptesPcg.listeComptesPcg.ajoutezDesComptesPcgPour}
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.numero}
            subtitle={item.libelle}
            onPress={() => router.push(ROUTES.ficheComptePcg(item.id))}
          />
        )}
      />

      <Fab
        options={[
          {
            label: TEXTES.commun.general.nouveauCompte,
            icon: 'add',
            onPress: () => router.push(ROUTES.COMPTE_PCG_NOUVEAU),
          },
        ]}
      />
    </Screen>
  );
}
