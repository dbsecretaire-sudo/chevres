import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { FiltresCheptel } from '@/features/cheptel/components/FiltresCheptel';
import { LigneChevre } from '@/features/cheptel/components/LigneChevre';
import { useListeCheptel } from '@/features/cheptel/hooks/useListeCheptel';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/cheptel/ListeCheptel.styles';
import { TEXTES } from '@/shared/textes';

export default function CheptelIndex() {
  const router = useRouter();
  const e = useListeCheptel();

  return (
    <Screen scroll={false}>
      <FiltresCheptel e={e} />

      <FlatList
        data={e.filtrees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={e.titreListeVide}
            subtitle={TEXTES.cheptel.listeCheptel.aucunAnimalNeCorrespondAux}
          />
        }
        renderItem={({ item }) => (
          <LigneChevre chevre={item} onPress={() => router.push(ROUTES.ficheChevre(item.id))} />
        )}
      />

      <Fab
        options={[
          {
            label: TEXTES.cheptel.listeCheptel.ajouterAuCheptel,
            icon: 'add-circle',
            onPress: () => router.push(ROUTES.CHEPTEL_AJOUT_RAPIDE),
          },
        ]}
      />
    </Screen>
  );
}
