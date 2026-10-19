import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { YearPicker } from '@/shared/components/YearPicker';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { EmptyState } from '@/shared/components/EmptyState';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { ListRow } from '@/shared/components/ListRow';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import {
  anneesDesEcritures,
  deposerDocumentCirculation,
  ecrituresACirculation,
  rechercherEcritures,
  type EcritureACirculation,
} from '@/features/comptabilite/services/documentsCirculation';
import { useActionsDocumentCirculation } from '@/features/comptabilite/hooks/useActionsDocumentCirculation';
import { nomsDesAbattoirs } from '@/features/fournisseurs/services/abattoirs';
import {
  choisirFichiers,
  ouvrirPiece,
  piecesDisponibles,
  pieceExiste,
  rangerFichier,
  supprimerPiece,
} from '@/features/fichiers/services/pieces';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';

const T = TEXTES.cheptel.circulation;

/** « 18/10/2026 », « 13:34 » : la date et l'heure locales d'un dépôt. */
const quand = (iso: string): { date: string; heure: string } => {
  const d = new Date(iso);
  const deux = (n: number) => String(n).padStart(2, '0');
  return {
    date: formatDateFR(`${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`),
    heure: `${deux(d.getHours())}:${deux(d.getMinutes())}`,
  };
};

/**
 * Dossier PAC › Documents de circulation : les ventes et les dépenses d'animaux vivants (achat, abattoir), de l'année et de l'espèce choisies,
 * avec leur document de circulation. Tant qu'il manque, l'écriture porte un « ! » rouge (et l'accueil le rappelle) ; l'icône à droite dépose
 * le document rempli (scan, photo), le rouvre, le remplace, ou génère le modèle pré-rempli. Une recherche retrouve une écriture.
 */
export default function DocumentsCirculation() {
  const router = useRouter();
  const { espece } = useEtablissement();
  const { ecriture: aMettreEnEvidence } = useLocalSearchParams<{ ecriture?: string }>();
  const [toutes, setToutes] = useState<EcritureACirculation[]>([]);
  // L'année de l'écran est l'année active de l'application (ou toutes, quand elles sont regroupées), comme partout ailleurs.
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const [recherche, setRecherche] = useState('');
  const [menu, setMenu] = useState<EcritureACirculation | null>(null);

  const charger = useCallback(async () => {
    const [ventes, factures, abattoirs] = await Promise.all([
      listToutesVentes(),
      listToutesFactures(),
      nomsDesAbattoirs(),
    ]);
    setToutes(ecrituresACirculation(ventes, factures, abattoirs));
  }, []);
  useFocusEffect(
    useCallback(() => {
      charger().catch(() => undefined);
    }, [charger]),
  );

  // Celles de l'espèce choisie (ou communes à toutes), de l'année choisie, qui répondent à la recherche.
  const deLEspece = toutes.filter((e) => e.activite === espece || e.activite === ACTIVITE_COMMUNE);
  const annees = anneesDesEcritures(deLEspece);
  const deLAnnee = regrouper ? deLEspece : deLEspece.filter((e) => e.date.startsWith(String(settings.anneeActive)));
  const affichees = rechercherEcritures(deLAnnee, recherche);
  /** Les documents qui manquent dans les autres années (ni ceux de l'année choisie, ni les déposés) : on le dit, avec de quoi les voir. */
  const manquantsAilleurs = regrouper
    ? []
    : deLEspece.filter((e) => !e.depose && !e.date.startsWith(String(settings.anneeActive)));
  const anneesDesManquants = anneesDesEcritures(manquantsAilleurs);

  const { options } = useActionsDocumentCirculation(charger);
  const optionsDuMenu = menu
    ? options(menu, {
        supplement: [
          {
            label: T.ouvrirEcriture,
            icon: 'open' as const,
            onPress: () =>
              router.push((menu.type === 'vente' ? ROUTES.ficheVente(menu.id) : ROUTES.ficheFacture(menu.id)) as never),
          },
        ],
      })
    : [];

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
      {manquantsAilleurs.length > 0 ? (
        <Pressable onPress={() => choisirToutesAnnees()} accessibilityRole="button">
          <Text style={[commonStyles.note, { color: colors.danger, fontWeight: "700" }]}>
            {T.autresAnnees(manquantsAilleurs.length, anneesDesManquants)} {T.voirToutesLesAnnees}
          </Text>
        </Pressable>
      ) : null}
      <Text style={commonStyles.note}>{T.aideEcran}</Text>
      <ChampRecherche value={recherche} onChangeText={setRecherche} placeholder={T.rechercher} />
      <Text style={commonStyles.cardTitle}>{T.ecritures(affichees.length)}</Text>
      <FlatList
        data={affichees}
        keyExtractor={(e) => e.cle}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState title={T.aucune} />}
        renderItem={({ item, index }) => {
          const depot = item.depose ? quand(item.depose.deposeLe) : null;
          return (
            <LigneDeBloc index={index} total={affichees.length}>
              <ListRow
                title={item.tiers || '—'}
                surlignee={item.cle === aMettreEnEvidence}
                subtitle={
                  <View>
                    <Text style={commonStyles.muted}>
                      {[formatDateFR(item.date), item.reference].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={[commonStyles.lineBold, { color: item.montant < 0 ? colors.danger : colors.primary }]}>
                      {formatMontant(item.montant)}
                    </Text>
                  </View>
                }
                trailing={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      style={[
                        commonStyles.mutedItalic,
                        { textAlign: 'right', maxWidth: 150, color: depot ? colors.primary : colors.danger },
                      ]}
                    >
                      {depot ? T.ajoute(depot.date, depot.heure) : T.manquant}
                    </Text>
                    <Pressable
                      onPress={() => setMenu(item)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={depot ? T.ouvrir : T.deposer}
                      style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 6 }}
                    >
                      <Ionicons name="document-text" size={22} color={colors.blanc} />
                      {depot ? null : (
                        <View
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: colors.danger,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: colors.blanc, fontSize: 12, fontWeight: '800' }}>!</Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                }
                onPress={() => setMenu(item)}
              />
            </LigneDeBloc>
          );
        }}
      />
      <OptionsModal
        visible={!!menu}
        onClose={() => setMenu(null)}
        title={menu?.tiers}
        options={optionsDuMenu.map((o) => ({
          ...o,
          onPress: () => {
            setMenu(null);
            o.onPress();
          },
        }))}
      />
    </Screen>
  );
}
