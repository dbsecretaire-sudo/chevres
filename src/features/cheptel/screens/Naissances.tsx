import { useCallback, useState } from 'react';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Button } from '@/shared/components/Button';
import { exporterCarnetMiseBasPdf } from '@/features/export/documents/carnetMiseBasPdf';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Fab } from '@/shared/components/Fab';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, statutColors } from '@/shared/theme/colors';
import { clientsDesAnimaux, listNaissancesGroupees, type PorteeNaissance } from '@/features/cheptel/repository/naissances';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { alignerLesStatutsSurLesVentes } from '@/features/comptabilite/services/alignementStatuts';
import { formatDateFR } from '@/shared/utils/dates';
import { libelleChevre, statutLabel } from '@/features/cheptel/utils/chevreLabel';
import { styles } from '@/shared/styles/cheptel/Naissances.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { TableauNaissances } from '@/features/cheptel/components/TableauNaissances';
import { RechercheNaissances } from '@/features/cheptel/components/RechercheNaissances';
import { filtrerNaissances, filtrerNaissancesParStatut, type StatutNaissance } from '@/features/cheptel/services/rechercheNaissances';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

/** Les statuts proposés pour filtrer les naissances : tous, les vivants, ou les vendus. */
const STATUTS_NAISSANCES: { valeur: StatutNaissance; libelle: string }[] = [
  { valeur: 'tous', libelle: TEXTES.cheptel.naissances.statut.tous },
  { valeur: STATUT_CHEVRE.VIVANTE, libelle: TEXTES.cheptel.naissances.statut.vivants },
  { valeur: STATUT_CHEVRE.VENDUE, libelle: TEXTES.cheptel.naissances.statut.vendus },
];

export default function Naissances() {
  const router = useRouter();
  // Le poste de comptabilité (Windows, affichage sobre) : les naissances en tableau.
  const comptable = useDispositionComptable();
  /** L'adresse de cet écran : la fiche d'un animal ouverte d'ici y revient. */
  const retour = useAdresseCourante();
  // L'espèce active : l'écran se recharge quand elle change, sans être recréé.
  const { espece } = useEtablissement();
  const [portees, setPortees] = useState<PorteeNaissance[]>([]);
  /** Le client qui a acheté chaque petit vendu (d'après les ventes). */
  const [clients, setClients] = useState<Map<string, string>>(new Map());
  /** L'année choisie (la même que dans le reste de l'application), ou « Tout » : toutes les années regroupées. */
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const annees = [...new Set(portees.map((p) => Number(p.date.slice(0, 4))))].filter(Boolean);
  /** La recherche (acheteur, n° de la mère ou du petit, M ou F, date) : elle s'applique aux naissances de la période affichée. */
  const [recherche, setRecherche] = useState('');
  /** Le statut : tous, les vivants ou les vendus (le filtre se combine avec la recherche). */
  const [statut, setStatut] = useState<StatutNaissance>('tous');
  const affichees = filtrerNaissancesParStatut(
    filtrerNaissances(
      regrouper ? portees : portees.filter((p) => p.date.startsWith(String(settings.anneeActive))),
      recherche,
      clients,
    ),
    statut,
  );
  const filtre = recherche.trim() !== '' || statut !== 'tous';
  const libelleVide = filtre
    ? TEXTES.cheptel.naissances.aucuneNaissanceFiltree
    : TEXTES.cheptel.naissances.aucuneNaissanceEnregistree;
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
      // Les animaux vendus s'affichent comme vendus : leur statut suit leur vente.
      alignerLesStatutsSurLesVentes()
        .catch(() => 0)
        .then(() => listNaissancesGroupees())
        .then(setPortees);
      listToutesVentes()
        .then((ventes) => setClients(clientsDesAnimaux(ventes)))
        .catch(() => undefined);
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
          <View style={commonStyles.row}>
            {STATUTS_NAISSANCES.map(({ valeur, libelle }) => (
              <Pressable
                key={valeur}
                accessibilityRole="button"
                onPress={() => setStatut(valeur)}
                style={[commonStyles.chip, valeur === statut && { backgroundColor: colors.primary }]}
              >
                <Text style={[{ fontWeight: '600', color: colors.text }, valeur === statut && commonStyles.textWhite]}>{libelle}</Text>
              </Pressable>
            ))}
          </View>
          <RechercheNaissances valeur={recherche} onChange={setRecherche} />
        </View>
      ) : null}
      {comptable ? (
        <TableauNaissances
          portees={affichees}
          ouvrirFiche={(id) => router.push(ROUTES.ficheChevreDepuis(id, retour))}
          vide={libelleVide}
          clients={clients}
        />
      ) : (
      <FlatList
        data={affichees}
        keyExtractor={(item) => `${item.mereNumeroBoucle}__${item.date}`}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <EmptyState
            title={libelleVide}
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
                    {clients.get(c.id) ? <Text style={commonStyles.muted}>{clients.get(c.id)}</Text> : null}
                  </View>
                ))}
              </View>
            </Card>
          </LigneDeBloc>
        )}
      />
      )}
      {/* Déclarer une naissance : le bouton + en bas à droite, sous le pouce. */}
      <Fab
        options={[
          {
            label: TEXTES.accueil.ferme.bulles.naissance,
            icon: 'heart',
            onPress: () => router.push(ROUTES.CHEPTEL_NAISSANCE_NOUVELLE as never),
          },
        ]}
      />
    </Screen>
  );
}
