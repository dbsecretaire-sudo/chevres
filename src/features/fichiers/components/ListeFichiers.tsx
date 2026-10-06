import { Pressable, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { ListRow } from '@/shared/components/ListRow';
import { ouvrirPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  titre: string;
  libelleAjout: string;
  /** Une phrase d'aide sous la liste. */
  aide?: string;
  aucun?: string;
  pieces: PieceJointe[];
  onAjouter: () => void;
  onRetirer: (piece: PieceJointe) => void;
}

/** Les fichiers joints d'un contenu ou d'un trade : on les ouvre d'un appui, on les retire, on en ajoute. */
export function ListeFichiers({ titre, libelleAjout, aide, aucun, pieces, onAjouter, onRetirer }: Props) {
  const T = TEXTES.fichiers;
  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>
        {titre}
        {pieces.length > 0 ? ` (${pieces.length})` : ''}
      </Text>
      {pieces.length === 0 ? <Text style={commonStyles.mutedItalic}>{aucun ?? T.aucun}</Text> : null}
      {pieces.map((piece) => (
        <ListRow
          key={piece.id}
          title={piece.nom}
          subtitle={piece.extension.toUpperCase()}
          trailing={
            <Pressable onPress={() => onRetirer(piece)} hitSlop={8}>
              <Text style={commonStyles.required}>{T.retirer}</Text>
            </Pressable>
          }
          onPress={() => ouvrirPiece(piece)}
        />
      ))}
      <Button variant="secondary" label={libelleAjout} onPress={onAjouter} />
      {aide ? <Text style={commonStyles.note}>{aide}</Text> : null}
    </View>
  );
}
