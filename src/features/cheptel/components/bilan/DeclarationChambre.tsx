import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ApercuPiece } from '@/features/fichiers/components/ApercuPiece';
import { ListRow } from '@/shared/components/ListRow';
import { useDeclarationChambre } from '@/features/cheptel/hooks/useDeclarationChambre';
import { ouvrirPiece } from '@/features/fichiers/services/pieces';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.bilanAnnuel.declaration;

/**
 * La déclaration à la Chambre d'agriculture de l'année : un bouton pour joindre le fichier ; une fois joint, un appui l'ouvre et le
 * crayon le remplace par un autre. Il n'y a pas de bouton pour le retirer.
 */
export function DeclarationChambre({ annee }: { annee: number }) {
  const { piece, choisir } = useDeclarationChambre(annee);
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre(annee)}</Text>
      {piece ? (
        <>
          <ApercuPiece piece={piece} />
          <ListRow
            title={piece.nom}
            subtitle={piece.extension.toUpperCase()}
            trailing={
              <Pressable onPress={choisir} hitSlop={8} accessibilityLabel={T.remplacer}>
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </Pressable>
            }
            onPress={() => ouvrirPiece(piece)}
          />
        </>
      ) : (
        <>
          <Text style={commonStyles.mutedItalic}>{T.aucune}</Text>
          <Button variant="secondary" label={T.joindre} onPress={choisir} />
        </>
      )}
    </Card>
  );
}
