import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ApercuPiece } from '@/features/fichiers/components/ApercuPiece';
import { listDocumentsIdentification } from '@/features/identification/repository';
import type { DocumentIdentification } from '@/features/identification/types';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.identification;

/**
 * Mon établissement › Documents d'identification : les documents d'identification et d'installation de l'exploitation, avec leurs
 * pièces scannées. Une image s'agrandit d'un appui, comme les vues satellites des contrôles de surface.
 */
export default function ListeDocumentsIdentification() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentIdentification[]>([]);

  useFocusEffect(
    useCallback(() => {
      listDocumentsIdentification().then(setDocuments);
    }, []),
  );

  const ouvrir = (document: DocumentIdentification) =>
    router.push(ROUTES.documentIdentification(document.id) as never);

  return (
    <Screen scroll={false}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listeAvecFab}
        ListEmptyComponent={<EmptyState title={T.aucun} />}
        renderItem={({ item }) => (
          <View style={commonStyles.gap6}>
            {item.fichiers?.map((piece) => <ApercuPiece key={piece.id} piece={piece} />)}
            <BlocLignes>
              <ListRow
                title={item.titre}
                subtitle={[
                  T.nature[item.nature],
                  formatDateFR(item.date),
                  item.fichiers?.length ? T.nombreFichiers(item.fichiers.length) : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                trailing={
                  <Pressable onPress={() => ouvrir(item)} hitSlop={8} accessibilityLabel={T.modifier}>
                    <Ionicons name="create-outline" size={24} color={colors.primary} />
                  </Pressable>
                }
                onPress={() => ouvrir(item)}
              />
            </BlocLignes>
          </View>
        )}
      />
      <Fab
        options={[
          {
            label: T.nouveau,
            icon: 'add-circle',
            onPress: () => router.push(ROUTES.documentIdentification() as never),
          },
        ]}
      />
    </Screen>
  );
}
