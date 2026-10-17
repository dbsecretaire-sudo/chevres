import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { Screen } from '@/shared/components/Screen';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { listClients } from '@/features/clients/repository';
import { rattacherLesReservations } from '@/features/commercial/services/reservations';
import { commandeOuverte, totalAPreparer, totalDuBon } from '@/features/commercial/services/commandes';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import type { Commande } from '@/features/commercial/types';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { reservesDeLaCommande } from '@/features/cheptel/services/reservations';
import type { Chevre } from '@/features/cheptel/types';
import { STATUT_COMMANDE } from '@/shared/constants/commercial';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { LABEL_STATUT_COMMANDE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const T = TEXTES.commercial.commandes;

type Filtre = 'ouvertes' | 'livrees' | 'toutes';

const couleurStatut = (statut: Commande['statut']): string =>
  statut === STATUT_COMMANDE.LIVREE
    ? colors.primary
    : statut === STATUT_COMMANDE.ANNULEE
      ? colors.textMuted
      : colors.danger;

/** Les commandes des clients : celles à traiter d'abord, avec le total à sortir du stock ; un appui ouvre la commande. */
export default function ListeCommandes() {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [filtre, setFiltre] = useState<Filtre>('ouvertes');
  /** Les animaux réservés par bon de commande (ils font partie du bon, même sans ligne). */
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  /** Les ventes : un bon livré garde ses animaux et son total dans les ventes qu'il a faites. */
  const [ventes, setVentes] = useState<Vente[]>([]);

  useFocusEffect(
    useCallback(() => {
      // Les réservations (animaux, lots) se rangent d'elles-mêmes dans le bon de commande de leur client.
      listClients()
        .then(rattacherLesReservations)
        .catch(() => undefined)
        .then(() => {
          lireArchiveCommercial().then((archive) => setCommandes(archive.commandes));
          listTousLesAnimauxDeLEspece().then(setAnimaux);
          listToutesVentes().then(setVentes);
        });
    }, []),
  );

  const affichees = useMemo(
    () =>
      commandes
        .filter((c) =>
          filtre === 'ouvertes'
            ? commandeOuverte(c)
            : filtre === 'livrees'
              ? c.statut === STATUT_COMMANDE.LIVREE
              : true,
        )
        .sort((a, b) => (a.livraisonPrevue ?? a.date).localeCompare(b.livraisonPrevue ?? b.date)),
    [commandes, filtre],
  );
  const reservesDuBon = (c: Commande) => reservesDeLaCommande(animaux, c.id);
  const prixDesVentes = useMemo(() => new Map(ventes.map((v) => [v.id, v.prix ?? 0])), [ventes]);
  /** Les animaux d'un bon : ceux réservés, et ceux que ses ventes ont déjà vendus. */
  const nombreDAnimaux = (c: Commande): number =>
    new Set([
      ...reservesDuBon(c).map((a) => a.id),
      ...ventes.filter((v) => c.venteIds?.includes(v.id)).flatMap((v) => idsDesAnimaux(v)),
    ]).size;
  const aPreparer = useMemo(() => totalAPreparer(commandes), [commandes]);

  return (
    <Screen scroll={false}>
      <View style={commonStyles.enteteListe}>
        <PucesDefilantes
          puces={[
            { valeur: 'ouvertes', label: T.filtres.ouvertes },
            { valeur: 'livrees', label: T.filtres.livrees },
            { valeur: 'toutes', label: T.filtres.toutes },
          ]}
          valeur={filtre}
          onChoisir={setFiltre}
        />
        {filtre === 'ouvertes' && aPreparer.length > 0 ? (
          <View style={commonStyles.gap2}>
            <Text style={commonStyles.lineBold}>{T.aPreparer.titre}</Text>
            {aPreparer.map((a) => (
              <Text key={a.article} style={commonStyles.line}>
                {T.aPreparer.ligne(a.quantite, a.libelle)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      <FlatList
        data={affichees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listeBlocAvecFab}
        ListEmptyComponent={<EmptyState title={T.aucune} />}
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={affichees.length}>
            <ListRow
              title={`${item.numero} · ${item.client}`}
              subtitle={[
                T.ligne.pieces(item.lignes.reduce((t, l) => t + l.quantite, 0)),
                nombreDAnimaux(item) > 0 ? T.ligne.animaux(nombreDAnimaux(item)) : '',
                item.livraisonPrevue ? formatDateFR(item.livraisonPrevue) : formatDateFR(item.date),
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                <View style={commonStyles.gap2}>
                  <Text style={commonStyles.lineBold}>{formatMontant(totalDuBon(item, prixDesVentes))}</Text>
                  <Badge label={LABEL_STATUT_COMMANDE[item.statut]} color={couleurStatut(item.statut)} />
                </View>
              }
              onPress={() => router.push(ROUTES.commande(item.id) as never)}
            />
          </LigneDeBloc>
        )}
      />
      <Fab
        options={[
          {
            label: T.nouvelle,
            icon: 'add-circle',
            onPress: () => router.push(ROUTES.COMMERCIAL_COMMANDE as never),
          },
        ]}
      />
    </Screen>
  );
}
