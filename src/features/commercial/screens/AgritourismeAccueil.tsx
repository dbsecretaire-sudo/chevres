import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { Screen } from '@/shared/components/Screen';
import { LigneDeBloc } from '@/shared/components/BlocListe';
import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { ListRow } from '@/shared/components/ListRow';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { YearPicker } from '@/shared/components/YearPicker';
import { TuilesChiffres } from '@/features/commercial/components/TuilesChiffres';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import {
  atelierAgritourisme,
  bilanAgritourisme,
  montantVisite,
  type AtelierAgritourisme,
} from '@/features/commercial/services/agritourisme';
import { reglagesTva } from '@/features/comptabilite/utils/reglagesTva';
import { REGIME_TVA_PILOTAGE } from '@/shared/constants/tva';
import type { ArchiveCommercial, VisiteAgritourisme } from '@/features/commercial/types';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { STATUT_VISITE, VUE_AGRITOURISME, type VueAgritourisme } from '@/shared/constants/agritourisme';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, formatMontant, yearOf } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme;

const couleurStatut = (statut: VisiteAgritourisme['statut']): string =>
  statut === STATUT_VISITE.REALISEE
    ? colors.primary
    : statut === STATUT_VISITE.ANNULEE
      ? colors.textMuted
      : colors.danger;

/**
 * L'agritourisme de l'année : le bilan (sorties, visiteurs, recettes, marge estimée) et les visites de la ferme — à venir, réalisées —
 * avec un bouton pour une nouvelle visite et un lien vers les formules et tarifs.
 */
export default function AgritourismeAccueil() {
  const router = useRouter();
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const [archive, setArchive] = useState<ArchiveCommercial | null>(null);
  const [vue, setVue] = useState<VueAgritourisme>(VUE_AGRITOURISME.A_VENIR);

  useFocusEffect(
    useCallback(() => {
      lireArchiveCommercial().then(setArchive);
    }, []),
  );

  const annees = useMemo(
    () =>
      [...new Set([settings.anneeActive, ...(archive?.visites ?? []).map((v) => yearOf(v.date))])].sort(
        (a, b) => b - a,
      ),
    [archive, settings.anneeActive],
  );
  const deLAnnee = useMemo(
    () => (archive?.visites ?? []).filter((v) => regrouper || yearOf(v.date) === settings.anneeActive),
    [archive, regrouper, settings.anneeActive],
  );
  const bilan = useMemo(() => bilanAgritourisme(deLAnnee), [deLAnnee]);
  /** Les charges de l'atelier Agritourisme (Rentabilité) pour l'année choisie. */
  const [atelier, setAtelier] = useState<AtelierAgritourisme | null>(null);
  const { regime } = reglagesTva(settings.exploitation);
  const horsTaxes =
    regime === REGIME_TVA_PILOTAGE.REEL_SIMPLIFIE || regime === REGIME_TVA_PILOTAGE.REEL_NORMAL;
  useEffect(() => {
    if (!regrouper) atelierAgritourisme(settings.anneeActive, horsTaxes).then(setAtelier);
  }, [regrouper, settings.anneeActive, horsTaxes, archive]);
  const affichees = useMemo(
    () =>
      deLAnnee
        .filter((v) =>
          vue === VUE_AGRITOURISME.A_VENIR
            ? v.statut === STATUT_VISITE.PREVUE
            : vue === VUE_AGRITOURISME.REALISEES
              ? v.statut === STATUT_VISITE.REALISEE
              : true,
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [deLAnnee, vue],
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={affichees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listeBlocAvecFab}
        ListHeaderComponent={
          <View style={commonStyles.enteteListe}>
            <LigneFiltres>
              <YearPicker
                annees={annees}
                value={settings.anneeActive}
                onChange={setAnneeActive}
                tout={regrouper}
                onChoisirTout={choisirToutesAnnees}
              />
            </LigneFiltres>
            <TuilesChiffres
              tuiles={[
                { cle: 'sorties', libelle: T.cartes.sorties, valeur: String(bilan.sorties) },
                { cle: 'visiteurs', libelle: T.cartes.visiteurs, valeur: String(bilan.visiteurs) },
                { cle: 'recettes', libelle: T.cartes.recettes, valeur: formatMontant(bilan.recettes) },
                // Les charges se lisent dans la Rentabilité (atelier Agritourisme) : pour une seule année.
                ...(atelier && !regrouper
                  ? [
                      {
                        cle: 'charges',
                        libelle: T.cartes.charges,
                        valeur: formatMontant(atelier.chargesDirectes),
                      },
                      {
                        cle: 'marge',
                        libelle: T.cartes.marge,
                        valeur: formatMontant(bilan.recettes - atelier.chargesDirectes),
                        alerte: bilan.recettes - atelier.chargesDirectes < 0,
                      },
                    ]
                  : []),
              ]}
            />
            <Text style={commonStyles.note}>{T.margeAide}</Text>
            <ListRow
              title={T.formules}
              icone="pricetags"
              onPress={() => router.push(ROUTES.COMMERCIAL_FORMULES as never)}
            />
            <PucesDefilantes
              puces={[
                { valeur: VUE_AGRITOURISME.A_VENIR, label: T.vues.aVenir },
                { valeur: VUE_AGRITOURISME.REALISEES, label: T.vues.realisees },
                { valeur: VUE_AGRITOURISME.TOUTES, label: T.vues.toutes },
              ]}
              valeur={vue}
              onChoisir={setVue}
            />
          </View>
        }
        ListEmptyComponent={<EmptyState title={T.aucune} />}
        renderItem={({ item, index }) => (
          <LigneDeBloc index={index} total={affichees.length}>
            <ListRow
              title={`${formatDateFR(item.date)} · ${item.formule}`}
              subtitle={T.ligne.detail(item.client, item.participants)}
              trailing={
                <View style={commonStyles.gap2}>
                  <Text style={commonStyles.lineBold}>{formatMontant(montantVisite(item))}</Text>
                  <Badge label={T.statuts[item.statut]} color={couleurStatut(item.statut)} />
                </View>
              }
              onPress={() => router.push(ROUTES.visiteAgritourisme(item.id) as never)}
            />
          </LigneDeBloc>
        )}
      />
      <Fab
        options={[
          {
            label: T.nouvelle,
            icon: 'add-circle',
            onPress: () => router.push(ROUTES.COMMERCIAL_VISITE as never),
          },
        ]}
      />
    </Screen>
  );
}
