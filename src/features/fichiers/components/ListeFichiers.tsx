import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { ListRow } from '@/shared/components/ListRow';
import { ApercuPiece } from '@/features/fichiers/components/ApercuPiece';
import { ouvrirPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { colors } from '@/shared/theme/colors';
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
  /** Le bouton « Retirer » de chaque fichier (absent quand les fichiers ne se retirent pas : voir onRemplacer). */
  onRetirer?: (piece: PieceJointe) => void;
  /** Quand il est donné, un crayon remplace le fichier par un autre au lieu d'un bouton « Retirer » : on ne le supprime pas. */
  onRemplacer?: (piece: PieceJointe) => void;
  /** Vrai : un aperçu de chaque fichier s'affiche au-dessus de sa ligne (l'image, ou un cadre pour un document). */
  apercu?: boolean;
}

/** Les fichiers joints d'un contenu ou d'un trade : on les ouvre d'un appui, on les retire, on en ajoute. */
export function ListeFichiers({
  titre,
  libelleAjout,
  aide,
  aucun,
  pieces,
  onAjouter,
  onRetirer,
  onRemplacer,
  apercu = false,
}: Props) {
  const T = TEXTES.fichiers;
  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>
        {titre}
        {pieces.length > 0 ? ` (${pieces.length})` : ''}
      </Text>
      {pieces.length === 0 ? <Text style={commonStyles.mutedItalic}>{aucun ?? T.aucun}</Text> : null}
      {pieces.map((piece) => (
        <View key={piece.id} style={commonStyles.gap6}>
          {apercu ? <ApercuPiece piece={piece} /> : null}
          <ListRow
            title={piece.nom}
            subtitle={piece.extension.toUpperCase()}
            trailing={
              onRemplacer ? (
                <Pressable onPress={() => onRemplacer(piece)} hitSlop={8} accessibilityLabel={T.remplacer}>
                  <Ionicons name="create-outline" size={24} color={colors.primary} />
                </Pressable>
              ) : (
                <Pressable onPress={() => onRetirer?.(piece)} hitSlop={8}>
                  <Text style={commonStyles.required}>{T.retirer}</Text>
                </Pressable>
              )
            }
            onPress={() => ouvrirPiece(piece)}
          />
        </View>
      ))}
      <Button variant="secondary" label={libelleAjout} onPress={onAjouter} />
      {aide ? <Text style={commonStyles.note}>{aide}</Text> : null}
    </View>
  );
}
