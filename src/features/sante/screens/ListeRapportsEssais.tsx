import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import type { Facture } from '@/features/comptabilite/types';
import { listToutesVisitesVeterinaire } from '@/features/sante/repository/visitesVeterinaire';
import { ouvrirPiece } from '@/features/fichiers/services/pieces';
import { documentsGds } from '@/features/sante/services/gds';
import { rapportsDeLaVisite } from '@/features/sante/services/visitesEtTraitements';
import type { VisiteVeterinaire } from '@/features/sante/types';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Screen } from '@/shared/components/Screen';
import { DOCUMENT_GDS } from '@/shared/constants/gds';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.exploitation.listeVisites;

/**
 * Les rapports d'essais du laboratoire : un par visite vétérinaire qui en annonce un (la case « Rapport d'essais » de la visite, avec son numéro), du plus récent au plus ancien.
 * Un appui ouvre le rapport et ses documents téléversés. Les documents déposés avant, sans visite, restent en dessous.
 */
export function RapportsEssaisGds() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const [visites, setVisites] = useState<VisiteVeterinaire[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  useFocusEffect(
    useCallback(() => {
      listToutesVisitesVeterinaire()
        .then(setVisites)
        .catch(() => undefined);
      listToutesFactures()
        .then(setFactures)
        .catch(() => undefined);
    }, []),
  );
  const deposes = documentsGds(settings.exploitation?.gds, DOCUMENT_GDS.RAPPORTS_ESSAIS);
  const rapports = visites
    .filter((v) => v.rapportEssais)
    .sort((a, b) => b.date.localeCompare(a.date));
  const sansVisite = deposes.filter((d) => !d.visiteId);

  return (
    <Screen>
      <Text style={commonStyles.note}>{TEXTES.gds.documents.aideRapports}</Text>
      {rapports.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.aucunRapportEnregistre}</Text> : null}
      {rapports.length > 0 ? (
        <BlocLignes>
          {rapports.map((visite) => {
            const cle = visite.factureId ?? visite.id;
            const facture = factures.find((f) => f.id === visite.factureId);
            const nombre = rapportsDeLaVisite(cle, deposes).length;
            return (
              <ListRow
                key={visite.id}
                title={TEXTES.cheptel.ficheChevre.sante.rapportEssais(visite.numeroRapport)}
                subtitle={[formatDateFR(visite.date), facture?.tiers, T.documentsDuRapport(nombre)].filter(Boolean).join(' · ')}
                icone="flask-outline"
                onPress={() => router.push(ROUTES.rapportEssais(cle) as never)}
              />
            );
          })}
        </BlocLignes>
      ) : null}
      {sansVisite.length > 0 ? (
        <>
          <Text style={commonStyles.cardTitle}>{T.documentsSansVisite}</Text>
          <BlocLignes>
            {sansVisite.map((d) => (
              <ListRow key={d.piece.id} title={d.piece.nom} subtitle={T.rapportDepose} icone="flask-outline" onPress={() => ouvrirPiece(d.piece)} />
            ))}
          </BlocLignes>
        </>
      ) : null}
    </Screen>
  );
}
