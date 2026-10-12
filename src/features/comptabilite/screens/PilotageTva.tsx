import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { usePilotageTva } from '@/features/comptabilite/hooks/usePilotageTva';
import type { ControleTva, PeriodeTva } from '@/features/comptabilite/services/pilotageTva';
import { PERIODICITE_TVA, REGIME_TVA_PILOTAGE, TYPE_CONTROLE_TVA } from '@/shared/constants/tva';
import { ROUTES } from '@/shared/constants/routes';
import { LABEL_PERIODICITE_TVA, LABEL_REGIME_TVA_PILOTAGE, NOMS_MOIS } from '@/shared/textes/libelles';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { styles as stylesFiscalite } from '@/shared/styles/comptabilite/Fiscalite.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.pilotageTva;

/**
 * Comptabilité › Pilotage de la TVA : la TVA collectée moins la TVA déductible, par période (mois, trimestre ou année) et par taux,
 * le remboursement forfaitaire agricole au RFA, et le contrôle de cohérence (taux absent ou inhabituel, facture sans TVA).
 */
export default function PilotageTva() {
  const router = useRouter();
  const { annee, annees, setAnneeActive, pilotage, reglages } = usePilotageTva();

  if (!pilotage) return null;
  const sansDeclaration =
    pilotage.regime === REGIME_TVA_PILOTAGE.FRANCHISE || pilotage.regime === REGIME_TVA_PILOTAGE.RFA;

  const libellePeriode = (p: PeriodeTva, index: number) =>
    pilotage.periodicite === PERIODICITE_TVA.MENSUELLE
      ? T.periodeMois(NOMS_MOIS[p.debut - 1])
      : pilotage.periodicite === PERIODICITE_TVA.TRIMESTRIELLE
        ? T.periodeTrimestre(index + 1)
        : T.periodeAnnee(annee);

  const messageControle = (c: ControleTva) =>
    c.type === TYPE_CONTROLE_TVA.VENTE_SANS_TAUX
      ? T.controle.venteSansTaux
      : c.type === TYPE_CONTROLE_TVA.VENTE_TAUX_INHABITUEL
        ? T.controle.venteTauxInhabituel(c.taux ?? 0, c.tauxAttendu ?? 0)
        : c.type === TYPE_CONTROLE_TVA.RECETTE_SANS_TAUX
          ? T.controle.recetteSansTaux
          : T.controle.achatSansTva;

  return (
    <Screen>
      <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />

      <Card>
        <View style={styles.ligne}>
          <Text style={commonStyles.muted}>{T.regime}</Text>
          <Text style={commonStyles.mutedBold}>{LABEL_REGIME_TVA_PILOTAGE[reglages.regime]}</Text>
        </View>
        {sansDeclaration ? null : (
          <View style={styles.ligne}>
            <Text style={commonStyles.muted}>{T.periodicite}</Text>
            <Text style={commonStyles.mutedBold}>{LABEL_PERIODICITE_TVA[reglages.periodicite]}</Text>
          </View>
        )}
        <Pressable onPress={() => router.push(ROUTES.COMPTABILITE_REGLAGES)} hitSlop={8}>
          <Text style={commonStyles.lien}>{T.modifierLeRegime}</Text>
        </Pressable>
      </Card>

      {pilotage.regime === REGIME_TVA_PILOTAGE.FRANCHISE ? (
        <Card>
          <Text style={commonStyles.para}>{T.franchise}</Text>
        </Card>
      ) : null}

      {pilotage.rfa ? (
        <Card>
          <Text style={commonStyles.cardTitle}>{T.rfa.titre}</Text>
          <View style={styles.ligne}>
            <Text style={commonStyles.line}>{T.rfa.base}</Text>
            <Text style={commonStyles.lineBold}>{formatMontant(pilotage.rfa.base)}</Text>
          </View>
          {pilotage.rfa.taux > 0 ? (
            <>
              <View style={styles.ligne}>
                <Text style={commonStyles.line}>{T.rfa.taux(pilotage.rfa.taux)}</Text>
              </View>
              <View style={commonStyles.separateur} />
              <View style={styles.ligne}>
                <Text style={commonStyles.strongPrimary}>{T.rfa.montant}</Text>
                <Text style={commonStyles.strongPrimary}>{formatMontant(pilotage.rfa.montant)}</Text>
              </View>
            </>
          ) : (
            <Text style={commonStyles.mutedItalic}>{T.rfa.sansTaux}</Text>
          )}
          <Text style={commonStyles.note}>{T.rfa.note}</Text>
        </Card>
      ) : null}

      {sansDeclaration ? null : (
        <>
          <Card>
            <Text style={commonStyles.cardTitle}>{T.parPeriode(annee)}</Text>
            {pilotage.periodes.map((p, index) => (
              <View key={p.debut} style={commonStyles.gap2}>
                <View style={styles.ligne}>
                  <Text style={commonStyles.line}>{libellePeriode(p, index)}</Text>
                  <Text
                    style={[commonStyles.lineBold, { color: p.solde > 0 ? colors.danger : colors.primary }]}
                  >
                    {formatMontant(p.solde)}
                  </Text>
                </View>
                {p.collectee !== 0 || p.deductible !== 0 ? (
                  <Text style={commonStyles.note}>
                    {T.collectee} {formatMontant(p.collectee)} · {T.deductible} {formatMontant(p.deductible)}
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>

          <Card>
            <Text style={commonStyles.cardTitle}>{T.total}</Text>
            <View style={styles.ligne}>
              <Text style={commonStyles.line}>{T.collectee}</Text>
              <Text style={[commonStyles.lineBold, { color: colors.primary }]}>
                {formatMontant(pilotage.collectee)}
              </Text>
            </View>
            <View style={styles.ligne}>
              <Text style={commonStyles.line}>{T.deductible}</Text>
              <Text style={[commonStyles.lineBold, { color: colors.danger }]}>
                {formatMontant(pilotage.deductible)}
              </Text>
            </View>
            <View style={commonStyles.separateur} />
            <View style={styles.ligne}>
              <Text style={commonStyles.strongPrimary}>{pilotage.solde >= 0 ? T.aPayer : T.credit}</Text>
              <Text style={commonStyles.strongPrimary}>{formatMontant(Math.abs(pilotage.solde))}</Text>
            </View>
          </Card>

          <Card>
            <Text style={commonStyles.cardTitle}>{T.parTaux.titre(annee)}</Text>
            {pilotage.parTaux.length > 0 ? (
              pilotage.parTaux.map((l) => (
                <View key={l.taux} style={commonStyles.gap2}>
                  <Text style={commonStyles.lineBold}>{T.parTaux.taux(l.taux)}</Text>
                  <Text style={commonStyles.note}>
                    {T.parTaux.ligne(
                      formatMontant(l.baseHtRecettes),
                      formatMontant(l.collectee),
                      formatMontant(l.deductible),
                    )}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={commonStyles.mutedItalic}>{T.parTaux.aucun}</Text>
            )}
          </Card>

          <Text style={stylesFiscalite.titreSection}>{T.controle.titre}</Text>
          {pilotage.controles.length === 0 ? (
            <Card>
              <Text style={commonStyles.para}>{T.controle.aucune}</Text>
            </Card>
          ) : (
            <>
              <Text style={commonStyles.muted}>{T.controle.nombre(pilotage.controles.length)}</Text>
              <BlocLignes>
                {pilotage.controles.map((c) => (
                  <ListRow
                    key={`${c.source}:${c.id}:${c.type}`}
                    title={c.libelle || T.controle.sansNom}
                    subtitle={`${formatDateFR(c.date)} · ${messageControle(c)}`}
                    trailing={<Text style={commonStyles.lineBold}>{formatMontant(c.montant)}</Text>}
                    onPress={() =>
                      router.push(
                        (c.source === 'vente' ? ROUTES.ficheVente(c.id) : ROUTES.ficheFacture(c.id)) as never,
                      )
                    }
                  />
                ))}
              </BlocLignes>
            </>
          )}
        </>
      )}

      <Card>
        <Text style={commonStyles.para}>{T.notice}</Text>
      </Card>
    </Screen>
  );
}
