import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { LigneElement } from '@/features/dossiers/components/LigneElement';
import { enregistrerElement, lireArchiveDossiers } from '@/features/dossiers/repository';
import { cheminDuDossier } from '@/features/dossiers/services/arborescence';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { estEnRetard } from '@/features/dossiers/services/recherche';
import type { ArchiveDossiers } from '@/features/dossiers/types';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { ROUTES } from '@/shared/constants/routes';
import { todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const ARCHIVE_VIDE: ArchiveDossiers = { sousDossiers: [], elements: [] };

/**
 * Le compte d'un client dans la fiche client : le décompte de ses tâches (à faire, en cours, terminées, en retard) puis
 * la liste de ses contenus, ceux qui restent à faire d'abord, avec le changement d'avancement d'un geste.
 */
export function ClientTaches({ clientId }: { clientId: string }) {
  const router = useRouter();
  const T = TEXTES.dossiers.clientTaches;
  const [archive, setArchive] = useState<ArchiveDossiers>(ARCHIVE_VIDE);

  const recharger = useCallback(() => {
    lireArchiveDossiers().then(setArchive);
  }, []);
  useFocusEffect(recharger);

  const aujourdhui = todayISO();
  const elements = archive.elements
    .filter((e) => e.clientId === clientId)
    .sort(
      (a, b) =>
        Number(statutEffectif(a) === STATUT_ELEMENT.TERMINE) -
          Number(statutEffectif(b) === STATUT_ELEMENT.TERMINE) ||
        (a.echeance ?? '9999').localeCompare(b.echeance ?? '9999') ||
        b.date.localeCompare(a.date),
    );

  const nombre = (statut: string) => elements.filter((e) => statutEffectif(e) === statut).length;
  const enRetard = elements.filter((e) => estEnRetard(e, aujourdhui)).length;

  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>
        {T.titre}
        {elements.length > 0 ? ` (${elements.length})` : ''}
      </Text>
      {elements.length > 0 ? (
        <Text style={commonStyles.muted}>
          {T.resume(
            nombre(STATUT_ELEMENT.A_FAIRE),
            nombre(STATUT_ELEMENT.EN_COURS),
            nombre(STATUT_ELEMENT.TERMINE),
            enRetard,
          )}
        </Text>
      ) : (
        <Text style={commonStyles.mutedItalic}>{T.aucune}</Text>
      )}
      {elements.map((element) => (
        <LigneElement
          key={element.id}
          element={element}
          chemin={cheminDuDossier(element.dossierId, archive.sousDossiers, [])}
          onStatut={async (statut) => {
            await enregistrerElement({ ...element, statut });
            recharger();
          }}
        />
      ))}
      <Button
        variant="secondary"
        label={T.ouvrirLeDossier}
        onPress={() => router.push(ROUTES.dossierClient(clientId))}
      />
    </View>
  );
}
