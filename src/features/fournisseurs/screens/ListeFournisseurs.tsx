import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { Fab } from '@/shared/components/Fab';
import { FlecheRetourDepuis } from '@/shared/components/FlecheRetourDepuis';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export default function FournisseursIndex() {
  const router = useRouter();
  /** Ouverte depuis un formulaire en cours (le crayon du champ) : la flèche y ramène. */
  const { retour } = useLocalSearchParams<{ retour?: string }>();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setFournisseurs(await listFournisseurs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return fournisseurs;
    return fournisseurs.filter((f) =>
      [f.nom, f.prenom, f.nomEntreprise, f.siret].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [fournisseurs, recherche]);

  return (
    <Screen scroll={false}>
      <FlecheRetourDepuis retour={retour} />
      <View style={commonStyles.topPadded}>
        <ChampRecherche
          value={recherche}
          onChangeText={setRecherche}
          placeholder={TEXTES.fournisseurs.listeFournisseurs.nomEntrepriseSiretPoints}
        />
      </View>

      <FlatList
        data={filtres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listFab}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.fournisseurs.listeFournisseurs.aucunFournisseur}
            subtitle={TEXTES.fournisseurs.listeFournisseurs.ajoutezVosFournisseursPourLes}
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.nomEntreprise}
            subtitle={TEXTES.fournisseurs.listeFournisseurs.nomValeurSiretSiret(
              item.nom,
              item.prenom ? ` ${item.prenom}` : '',
              item.siret,
            )}
            onPress={() => router.push(ROUTES.ficheFournisseur(item.id))}
          />
        )}
      />

      <Fab
        options={[
          {
            label: TEXTES.commun.general.nouveauFournisseur,
            icon: 'add',
            onPress: () => router.push(ROUTES.FOURNISSEUR_NOUVEAU),
          },
        ]}
      />
    </Screen>
  );
}
