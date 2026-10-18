import { FlatList, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { AncreVisite } from '@/features/didacticiel/components/AncreVisite';
import { commonStyles } from '@/shared/styles/commonStyles';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { LigneDeBloc } from '@/shared/components/BlocListe';
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
      <View style={styles.choixEspece}>
        <SelecteurEspece />
      </View>
      {/* Le bilan annuel : le même bouton que celui des naissances. */}
      <View style={commonStyles.topPadded}>
        <Button
          variant="secondary"
          label={TEXTES.commun.general.bilanAnnuel}
          onPress={() => router.push(ROUTES.CHEPTEL_BILAN as never)}
        />
      </View>
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
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={e.filtrees.length}>
            {index === 0 ? (
              <AncreVisite id="cheptel.premiereLigne">
                <LigneChevre chevre={item} onPress={() => router.push(ROUTES.ficheChevre(item.id))} />
              </AncreVisite>
            ) : (
              <LigneChevre chevre={item} onPress={() => router.push(ROUTES.ficheChevre(item.id))} />
            )}
          </LigneDeBloc>
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
