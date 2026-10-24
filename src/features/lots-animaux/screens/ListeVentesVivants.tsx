import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BlocLignes } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { TableauVentesVivants } from '@/features/lots-animaux/components/TableauxDesDeparts';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { Screen } from '@/shared/components/ScreenList';
import { nombreDAnimauxDeLaVente, titreDeLaVenteVivants, ventesVivantesRecentesDabord } from '@/features/lots-animaux/services/ventesVivants';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.exploitation.ventesVivants;

/**
 * Les ventes d'animaux vivants, de la plus récente à la plus ancienne (le jour, les animaux, le document de circulation). Un appui ouvre la vente ;
 * « Nouvelle vente » ouvre l'assistant (les animaux, le document de circulation à générer puis à téléverser, puis la vente elle-même).
 */
export default function ListeVentesVivants() {
  const router = useRouter();
  const { settings } = useAppSettings();
  // Le poste de comptabilité (Windows, affichage sobre) montre les ventes en tableau.
  const comptable = useDispositionComptable();
  const ventes = ventesVivantesRecentesDabord(settings.exploitation?.ventesVivants);
  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        {ventes.length === 0 ? (
          <EmptyState title={T.aucune} subtitle={T.aucuneAide} />
        ) : comptable ? (
          <TableauVentesVivants ventes={ventes} onOuvrir={(vente) => router.push(ROUTES.venteVivants(vente.id) as never)} vide={T.aucune} />
        ) : (
          <BlocLignes>
            {ventes.map((vente) => (
              <ListRow
                key={vente.id}
                title={titreDeLaVenteVivants(vente)}
                subtitle={[T.animaux(nombreDAnimauxDeLaVente(vente)), vente.documentCirculation ? T.documentDepose : T.documentManque].join(' · ')}
                icone="swap-horizontal"
                onPress={() => router.push(ROUTES.venteVivants(vente.id) as never)}
              />
            ))}
          </BlocLignes>
        )}
      </ScrollView>
      <Fab options={[{ label: T.nouvelle, icon: 'add', onPress: () => router.push(ROUTES.lotAbattoirNouveau('vivants') as never) }]} />
    </Screen>
  );
}
