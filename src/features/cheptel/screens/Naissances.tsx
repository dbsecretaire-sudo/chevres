import { useCallback, useState } from 'react';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Button } from '@/shared/components/Button';
import { exporterCarnetMiseBasPdf } from '@/features/export/carnetMiseBasPdf';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { statutColors } from '@/shared/theme/colors';
import { listNaissancesGroupees, type PorteeNaissance } from '@/features/cheptel/repository/naissances';
import { formatDateFR } from '@/shared/utils/dates';
import { libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { styles } from '@/shared/styles/cheptel/Naissances.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

export default function Naissances() {
  const router = useRouter();
  /** L'adresse de cet écran : la fiche d'un animal ouverte d'ici y revient. */
  const retour = useAdresseCourante();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const [portees, setPortees] = useState<PorteeNaissance[]>([]);
  /** L'année choisie (la même que dans le reste de l'application), ou « Tout » : toutes les années regroupées. */
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const annees = [...new Set(portees.map((p) => Number(p.date.slice(0, 4))))].filter(Boolean);
  const affichees = regrouper
    ? portees
    : portees.filter((p) => p.date.startsWith(String(settings.anneeActive)));
  /** Où en sont aujourd'hui les petits de ces naissances. */
  const repartition = (() => {
    const petits = affichees.flatMap((p) => p.cabrits);
    const compte = (statuts: string[]) => petits.filter((c) => statuts.includes(c.statut)).length;
    return {
      vivants: compte([STATUT_CHEVRE.VIVANTE]),
      vendus: compte([STATUT_CHEVRE.VENDUE]),
      abattoir: compte([STATUT_CHEVRE.ABATTOIR]),
      autoconsommes: compte([STATUT_CHEVRE.AUTOCONSOMMEE]),
      morts: compte([STATUT_CHEVRE.MORTE, STATUT_CHEVRE.MORT_NE]),
    };
  })();

  useFocusEffect(
    useCallback(() => {
      listNaissancesGroupees().then(setPortees);
      // L'espèce n'est pas lue dans le chargement : elle sert à le relancer quand elle change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [espece]),
  );

  return (
    <Screen scroll={false}>
      <LigneFiltres>
        <YearPicker
          annees={annees}
          value={settings.anneeActive}
          onChange={setAnneeActive}
          tout={regrouper}
          onChoisirTout={choisirToutesAnnees}
        />
        <SelecteurEspece />
      </LigneFiltres>
      {portees.length > 0 ? (
        <View style={styles.carnet}>
          <Button
            variant="secondary"
            label={TEXTES.cheptel.naissances.carnetLivretBouton}
            onPress={() => exporterCarnetMiseBasPdf('livret').catch(() => undefined)}
          />
          <Text style={commonStyles.note}>{TEXTES.cheptel.naissances.carnetLivretAide}</Text>
          {/* Pour info : les naissances et les mères de la période affichée. */}
          <Text style={commonStyles.lineBold}>
            {TEXTES.cheptel.naissances.bilan(
              affichees.reduce((n, p) => n + p.cabrits.length, 0),
              new Set(affichees.map((p) => p.mereNumeroBoucle)).size,
            )}
          </Text>
          {/* Où en sont aujourd'hui les petits de ces naissances : vivants, vendus, morts… */}
          <Text style={commonStyles.note}>{TEXTES.cheptel.naissances.repartition(repartition)}</Text>
        </View>
      ) : null}
      <FlatList
        data={affichees}
        keyExtractor={(item) => `${item.mereNumeroBoucle}__${item.date}`}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.cheptel.naissances.aucuneNaissanceEnregistree}
            subtitle={TEXTES.cheptel.naissances.declarezUneNaissanceDepuisL}
          />
        }
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={affichees.length}>
            <Card style={styles.carte}>
              <View style={commonStyles.rowSpaceBetween}>
                <Text style={commonStyles.cardTitle}>
                  {TEXTES.cheptel.naissances.mereEspace}
                  {item.mereNumeroBoucle}
                </Text>
                <Text style={commonStyles.muted}>{formatDateFR(item.date)}</Text>
              </View>
              <Text style={commonStyles.muted}>
                {item.cabrits.length} {TEXTES.cheptel.naissances.cabri}
                {item.cabrits.length > 1 ? 's' : ''} ·{' '}
                {item.cabrits.filter((c) => c.sexe === SEXE.FEMELLE).length} F ·{' '}
                {item.cabrits.filter((c) => c.sexe === SEXE.MALE).length} M
              </Text>
              <View style={styles.cabritsRow}>
                {item.cabrits.map((c) => (
                  <View key={c.id} style={styles.cabritChip}>
                    <Text
                      style={styles.cabritChipText}
                      onPress={() => router.push(ROUTES.ficheChevreDepuis(c.id, retour))}
                    >
                      {libelleChevre(c)}
                    </Text>
                    <Badge label={statutLabel(c.statut, c.sexe)} color={statutColors[c.statut]} />
                  </View>
                ))}
              </View>
            </Card>
          </LigneDeBloc>
        )}
      />
    </Screen>
  );
}
