import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { ListRow } from '@/shared/components/ListRow';
import { useRappels } from '@/features/rappels/hooks/useRappels';
import { libelleDeRappel, periodeDeRappel } from '@/features/rappels/services/rappels';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.rappels.historique;

/** L'historique des rappels : les déclarations déjà validées, de la plus récente à la plus ancienne ; une validation se défait. */
export default function HistoriqueRappels() {
  const { valides, rouvrir } = useRappels();
  const lignes = valides
    .map((id) => ({ id, libelle: libelleDeRappel(id) }))
    .filter((l): l is { id: string; libelle: string } => !!l.libelle)
    .sort((a, b) => periodeDeRappel(b.id) - periodeDeRappel(a.id));
  return (
    <Screen>
      {lignes.length === 0 ? (
        <EmptyState title={T.aucun} />
      ) : (
        <BlocLignes>
          {lignes.map((l) => (
            <ListRow
              key={l.id}
              title={l.libelle}
              subtitle={T.valide}
              trailing={
                <Pressable onPress={() => rouvrir(l.id)} hitSlop={10} accessibilityLabel={T.rouvrir}>
                  <Ionicons name="arrow-undo-outline" size={26} color={colors.primary} />
                </Pressable>
              }
            />
          ))}
        </BlocLignes>
      )}
    </Screen>
  );
}
