import { useCallback, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { EmptyState } from '@/shared/components/EmptyState';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { lireBibliotheque, retirerDocument } from '@/features/bibliotheque/repository';
import type { DocumentGenere } from '@/features/bibliotheque/types';
import { ouvrirPiece, pieceExiste, supprimerPiece } from '@/features/fichiers/services/pieces';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.export.bibliotheque;

/** « 17/10/2026 à 14:32 » d'une date ISO. */
const quand = (iso: string): string => `${formatDateFR(iso.slice(0, 10))} · ${iso.slice(11, 16)}`;

/**
 * La bibliothèque : tous les documents (PDF) que l'application a générés, du plus récent au plus ancien, pour garder un historique. Un appui
 * rouvre le document (pour l'envoyer ou l'imprimer de nouveau) ; on peut en retirer un de la liste.
 */
export default function BibliothequeDocuments() {
  const [documents, setDocuments] = useState<DocumentGenere[]>([]);
  const [aRetirer, setARetirer] = useState<DocumentGenere | null>(null);
  const [manquant, setManquant] = useState(false);

  const charger = useCallback(() => lireBibliotheque().then(setDocuments), []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const ouvrir = async (document: DocumentGenere) => {
    if (!(await pieceExiste(document.piece))) return setManquant(true);
    setManquant(false);
    await ouvrirPiece(document.piece);
  };

  return (
    <Screen scroll={false}>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {manquant ? <Text style={commonStyles.mutedItalic}>{T.fichierManquant}</Text> : null}
      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        contentContainerStyle={commonStyles.listeBlocAvecFab}
        ListEmptyComponent={<EmptyState title={T.aucun} />}
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={documents.length}>
            <ListRow
              title={item.titre}
              subtitle={`${quand(item.genereLe)} · ${item.nomFichier}`}
              trailing={
                <Ionicons name="trash-outline" size={22} color={colors.danger} onPress={() => setARetirer(item)} />
              }
              onPress={() => ouvrir(item)}
            />
          </LigneDeBloc>
        )}
      />
      <ConfirmModal
        visible={!!aRetirer}
        title={T.retirerQuestion}
        message={T.retirerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setARetirer(null)}
        onConfirm={async () => {
          const document = aRetirer;
          setARetirer(null);
          if (!document) return;
          await retirerDocument(document.id);
          await supprimerPiece(document.piece);
          charger();
        }}
      />
    </Screen>
  );
}
