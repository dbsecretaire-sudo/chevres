import { Pressable, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/ScreenList';
import { TableauACompleter } from '@/features/cheptel/components/TableauACompleter';
import { useAnimauxACompleter } from '@/features/cheptel/hooks/useAnimauxACompleter';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { libelleACompleter } from '@/features/cheptel/services/aCompleter';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.roles.aCompleter;

/**
 * Ce que le berger a saisi sur le terrain (une naissance, une mort) et qu'il reste à compléter à la maison : le sexe et les boucles des petits, la cause d'une mort. Un appui ouvre
 * la fiche de l'animal ; « Fait » le retire de la liste.
 */
export default function ListeACompleter() {
  const router = useRouter();
  const { animaux, marquerFait } = useAnimauxACompleter();
  // Le poste de comptabilité (Windows, affichage sobre) montre la liste en tableau.
  const comptable = useDispositionComptable();
  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        {animaux.length === 0 ? (
          <EmptyState title={T.rien} subtitle={T.rienAide} />
        ) : comptable ? (
          <TableauACompleter animaux={animaux} ouvrirFiche={(id) => router.push(ROUTES.ficheChevre(id) as never)} marquerFait={marquerFait} />
        ) : (
          <BlocLignes>
            {animaux.map((a) => (
              <ListRow
                key={a.id}
                title={a.numeroBoucle?.trim() || a.nom || T.sansBoucle}
                subtitle={libelleACompleter(a)}
                icone="create"
                onPress={() => router.push(ROUTES.ficheChevre(a.id) as never)}
                trailing={
                  <Pressable onPress={() => marquerFait(a)} accessibilityRole="button" hitSlop={8}>
                    <Text style={commonStyles.lien}>{T.fait}</Text>
                  </Pressable>
                }
              />
            ))}
          </BlocLignes>
        )}
      </ScrollView>
    </Screen>
  );
}
