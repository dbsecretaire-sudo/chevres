import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { FormField } from '@/shared/components/FormField';
import { Fab } from '@/shared/components/Fab';
import { listComptesPcg, type CompteComptableEnregistre } from '@/features/comptes-pcg/repository';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export default function ComptesPcgIndex() {
  const router = useRouter();
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setComptes(await listComptesPcg());
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return comptes;
    return comptes.filter((c) => [c.numero, c.libelle].some((v) => v?.toLowerCase().includes(q)));
  }, [comptes, recherche]);

  return (
    <Screen scroll={false}>
      <View style={commonStyles.topPadded}>
        <FormField
          label={TEXTES.commun.general.rechercher}
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
