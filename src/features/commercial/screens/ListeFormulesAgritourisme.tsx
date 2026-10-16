import { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { Screen } from '@/shared/components/Screen';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { elementsDeFormule } from '@/features/commercial/services/agritourisme';
import type { ElementFormule, FormuleAgritourisme } from '@/features/commercial/types';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme;

/** Les formules d'agritourisme : leur prix par personne, ce qu'elles comprennent et ce qu'elles coûtent ; un appui ouvre la formule. */
export default function ListeFormulesAgritourisme() {
  const router = useRouter();
  const [formules, setFormules] = useState<FormuleAgritourisme[]>([]);
  const [catalogue, setCatalogue] = useState<ElementFormule[]>([]);

  useFocusEffect(
    useCallback(() => {
      lireArchiveCommercial().then((archive) => {
        setFormules(archive.formules);
        setCatalogue(elementsDeFormule(archive));
      });
    }, []),
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={formules}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listeBlocAvecFab}
        ListEmptyComponent={<EmptyState title={T.listeFormules.aucune} />}
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={formules.length}>
            <ListRow
              title={item.nom}
              subtitle={[
                catalogue
                  .filter((e) => item.elements.includes(e.id))
                  .map((e) => e.court ?? e.nom)
                  .join(' + '),
                T.listeFormules.detail(formatMontant(item.prix)),
              ]
                .filter(Boolean)
                .join(' · ')}
              onPress={() => router.push(ROUTES.formuleAgritourisme(item.id) as never)}
            />
          </LigneDeBloc>
        )}
      />
      <Fab
        options={[
          {
            label: T.listeFormules.nouvelle,
            icon: 'add-circle',
            onPress: () => router.push(ROUTES.COMMERCIAL_FORMULE as never),
          },
        ]}
      />
    </Screen>
  );
}
