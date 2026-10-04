import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { FormField } from '@/shared/components/FormField';
import { ListRow } from '@/shared/components/ListRow';
import { listSejours } from '@/features/gite/repository';
import type { Sejour } from '@/features/gite/types';
import { normaliser } from '@/features/dossiers/services/recherche';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { activitesEtablissement } from '@/shared/dictionnaire/entreprise';
import { formatDateShortFR, formatMontant, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/gite/Gite.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface TuileProps {
  titre: string;
  details: readonly string[];
  /** Sans destination, la tuile est annoncée comme « bientôt disponible ». */
  onPress?: () => void;
}

/** Une activité de l'association : son nom, ce qu'elle comprend, et l'écran qu'elle ouvre. */
function Tuile({ titre, details, onPress }: TuileProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tuile,
        !onPress && styles.tuileInactive,
        pressed && commonStyles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.tuileTitre}>{titre}</Text>
      {details.map((detail) => (
        <Text key={detail} style={styles.tuileDetail}>
          {detail}
        </Text>
      ))}
      {!onPress ? <Text style={styles.tuileBientot}>{TEXTES.gite.activites.bientot}</Text> : null}
    </Pressable>
  );
}

/**
 * Écran Activité d'une association : une recherche dans les séjours et une tuile par activité (le gîte, avec la
 * restauration et le ménage ; le bar ; les activités annexes). Les clients restent dans le menu burger.
 */
export default function ActivitesAssociation() {
  const router = useRouter();
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [requete, setRequete] = useState('');
  const T = TEXTES.gite.activites;
  const aussiPrestations = activitesEtablissement().includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE);

  useFocusEffect(
    useCallback(() => {
      listSejours().then(setSejours);
    }, []),
  );

  const termes = normaliser(requete).split(/\s+/).filter(Boolean);
  const trouves = sejours
    .filter((s) => {
      const texte = normaliser(
        `${s.nom} ${s.notes ?? ''} ${TEXTES.gite.jour.chambre(s.chambre)} ${formatDateShortFR(s.arrivee)}`,
      );
      return termes.every((t) => texte.includes(t));
    })
    .sort((a, b) => b.arrivee.localeCompare(a.arrivee));

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <FormField
          label={TEXTES.commun.general.rechercher}
          value={requete}
          onChangeText={setRequete}
          placeholder={T.rechercher}
        />

        {termes.length === 0 ? (
          <View style={styles.grilleTuiles}>
            <Tuile titre={T.gite} details={T.giteDetails} onPress={() => router.push(ROUTES.GITE)} />
            <Tuile titre={T.bar} details={T.barDetails} />
            <Tuile titre={T.annexes} details={T.annexesDetails} />
            {aussiPrestations ? (
              <Tuile
                titre={T.dossiersClients}
                details={[]}
                onPress={() => router.push(ROUTES.CLIENTS_DOSSIERS)}
              />
            ) : null}
          </View>
        ) : trouves.length === 0 ? (
          <EmptyState title={T.aucunResultat} subtitle={T.modifiezLaRecherche} />
        ) : (
          trouves.map((sejour) => (
            <ListRow
              key={sejour.id}
              title={`${sejour.nom} — ${TEXTES.gite.jour.chambre(sejour.chambre)}`}
              subtitle={`${TEXTES.gite.jour.dates(formatDateShortFR(sejour.arrivee), formatDateShortFR(sejour.depart))} · ${formatMontant(sejour.prix)}`}
              onPress={() => router.push(ROUTES.sejour(sejour.id))}
            />
          ))
        )}
      </ScrollView>

      <Fab
        options={[
          {
            label: TEXTES.gite.calendrier.nouveauSejour,
            icon: 'bed',
            onPress: () => router.push(ROUTES.sejourNouveau(1, todayISO())),
          },
        ]}
      />
    </Screen>
  );
}
