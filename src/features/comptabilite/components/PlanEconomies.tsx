import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import {
  TYPE_PISTE,
  type Piste,
  type PlanEconomies as Plan,
} from '@/features/comptabilite/services/pistesEconomie';
import {
  HYPOTHESES_ECONOMIE,
  HYPOTHESES_INVESTISSEMENT,
  INVESTISSEMENT,
  UN_CENTIME,
} from '@/shared/constants/economies';
import { CoutInvestissementModal } from '@/features/comptabilite/components/CoutInvestissementModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { LOCALE } from '@/shared/constants/format';
import { formatMontant } from '@/shared/utils/dates';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import type { CategorieDepense } from '@/features/comptabilite/types';

const T = TEXTES.comptabilite.rentabilite.plan;

const pourcent = (part: number): string =>
  `${(part * 100).toLocaleString(LOCALE, { maximumFractionDigits: 0 })} %`;
const nombre = (valeur: number, decimales = 2): string =>
  valeur.toLocaleString(LOCALE, { maximumFractionDigits: decimales });

/** Ce que dit une piste, selon son type et les chiffres qui la motivent. */
function texteDeLaPiste(p: Piste): string {
  const d = p.donnees ?? {};
  switch (p.type) {
    case TYPE_PISTE.NEGOCIABLE:
      return T.negociable(pourcent(HYPOTHESES_ECONOMIE.negociable));
    case TYPE_PISTE.ALIMENT_UREE_HAUTE:
      return T.alimentUreeHaute(nombre(d.ureeMax ?? 0, 0), pourcent(HYPOTHESES_ECONOMIE.alimentUreeHaute));
    case TYPE_PISTE.ALIMENT_HAUSSE:
      return T.alimentHausse(
        formatMontant(d.coutAlimentParLitre ?? 0),
        formatMontant(d.coutAlimentParLitrePrecedent ?? 0),
        `${nombre(d.litresParTraite ?? 0)} L`,
        `${nombre(d.litresParTraitePrecedent ?? 0)} L`,
      );
    case TYPE_PISTE.ALIMENT_PRUDENCE:
      return T.alimentPrudence(nombre(d.ureeMin ?? 0, 0));
    case TYPE_PISTE.VETERINAIRE_PRUDENCE:
      return T.veterinairePrudence(d.analysesCritiques ?? 0);
    default:
      return T.incompressible;
  }
}

/**
 * Le plan d'économies de la rentabilité : pour chaque poste qui s'y prête, la piste (négociation, ajustement de l'alimentation d'après
 * les analyses et le lait par traite) avec son économie estimée, puis l'effet de l'ensemble sur le coût du litre. Les postes à ne pas
 * toucher (urée basse, analyses critiques, impôts et cotisations) y sont aussi, pour dire pourquoi.
 */
export function PlanEconomies({ plan, litresProduits }: { plan: Plan; litresProduits: number }) {
  const { settings, patchSettings } = useAppSettings();
  /** L'investissement dont on indique le coût. */
  const [coutOuvert, setCoutOuvert] = useState<ValeurDe<typeof INVESTISSEMENT> | null>(null);
  const I = T.investissements;
  const V = T.valorisation;
  const enregistrerCout = async (cout: number | undefined) => {
    if (!coutOuvert) return;
    const couts = { ...settings.exploitation?.investissementsEconomie };
    if (cout) couts[coutOuvert] = cout;
    else delete couts[coutOuvert];
    await patchSettings({ exploitation: { ...settings.exploitation, investissementsEconomie: couts } });
    setCoutOuvert(null);
  };
  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {litresProduits <= 0 ? <Text style={commonStyles.mutedItalic}>{T.sansLait}</Text> : null}
      {plan.pistes.map((p) => {
        const base = p.categorie.split(':')[0] as CategorieDepense;
        const nom = p.libelle ?? LABEL_CATEGORIE_DEPENSE[base] ?? p.categorie;
        const gain = p.economie > 0;
        return (
          <View key={`${p.categorie}-${p.type}`} style={commonStyles.gap2}>
            <View style={styles.ligne}>
              <Text style={[commonStyles.lineBold, commonStyles.flex1]}>
                {T.poste(nom, formatMontant(p.montant))}
              </Text>
              {gain ? (
                <Text
                  style={[commonStyles.lineBold, { color: colors.primary }]}
                >{`− ${formatMontant(p.economie)}`}</Text>
              ) : null}
            </View>
            <Text style={commonStyles.note}>{texteDeLaPiste(p)}</Text>
          </View>
        );
      })}
      {litresProduits > 0 ? (
        <>
          <View style={commonStyles.separateur} />
          <Text style={commonStyles.lineSemiBold}>{T.resume}</Text>
          <View style={styles.ligne}>
            <Text style={commonStyles.line}>{T.economieTotale}</Text>
            <Text style={[commonStyles.lineBold, { color: colors.primary }]}>
              {formatMontant(plan.economieTotale)}
            </Text>
          </View>
          {plan.coutParLitre !== undefined && plan.coutParLitreApres !== undefined ? (
            <Text style={commonStyles.note}>
              {T.coutLitreApres(formatMontant(plan.coutParLitre), formatMontant(plan.coutParLitreApres))}
            </Text>
          ) : null}
          {plan.prixLitre !== undefined ? (
            <Text style={commonStyles.note}>{T.prixLitre(formatMontant(plan.prixLitre))}</Text>
          ) : null}
          {plan.ecartParLitre !== undefined && plan.ecartParLitreApres !== undefined ? (
            <Text style={commonStyles.note}>
              {T.ecart(formatMontant(plan.ecartParLitre), formatMontant(plan.ecartParLitreApres))}
            </Text>
          ) : null}
          {plan.partCouverte !== undefined ? (
            <Text style={commonStyles.lineSemiBold}>
              {plan.partCouverte >= 1 ? T.couvreTout : T.couvre(pourcent(plan.partCouverte))}
            </Text>
          ) : plan.ecartParLitre !== undefined ? (
            <Text style={commonStyles.note}>{T.sansEcart}</Text>
          ) : null}
          <Text style={commonStyles.note}>{T.prixDuLait}</Text>
          <Text style={commonStyles.mutedBold}>
            {T.centimeLitre(formatMontant(litresProduits * UN_CENTIME))}
          </Text>
        </>
      ) : null}
      {plan.investissements.length > 0 ? (
        <>
          <View style={commonStyles.separateur} />
          <Text style={commonStyles.lineSemiBold}>{I.titre}</Text>
          <Text style={commonStyles.note}>{I.aide}</Text>
          {plan.investissements.map((inv) => {
            const parts = HYPOTHESES_INVESTISSEMENT[inv.investissement] as Record<string, number>;
            const texte =
              inv.investissement === INVESTISSEMENT.SILO
                ? I.silo.texte(pourcent(parts.alimentation ?? 0), pourcent(parts.carburant ?? 0))
                : I.cuve.texte(pourcent(parts.carburant ?? 0));
            return (
              <View key={inv.investissement} style={commonStyles.gap2}>
                <View style={styles.ligne}>
                  <Text style={[commonStyles.lineBold, commonStyles.flex1]}>
                    {inv.investissement === INVESTISSEMENT.SILO ? I.silo.titre : I.cuve.titre}
                  </Text>
                  <Text style={[commonStyles.lineBold, { color: colors.primary }]}>
                    {`− ${formatMontant(inv.economie)}`}
                  </Text>
                </View>
                <Text style={commonStyles.note}>{texte}</Text>
                <Text style={commonStyles.note}>{I.gain(formatMontant(inv.economie))}</Text>
                {inv.cout ? <Text style={commonStyles.note}>{I.cout(formatMontant(inv.cout))}</Text> : null}
                {inv.remboursementAnnees !== undefined ? (
                  <Text style={commonStyles.lineSemiBold}>
                    {I.remboursement(I.duree(Math.max(1, Math.round(inv.remboursementAnnees * 12))))}
                  </Text>
                ) : null}
                <Pressable onPress={() => setCoutOuvert(inv.investissement)} hitSlop={8}>
                  <Text style={commonStyles.lien}>{inv.cout ? I.modifierCout : I.indiquerCout}</Text>
                </Pressable>
              </View>
            );
          })}
        </>
      ) : null}
      <View style={commonStyles.separateur} />
      <Text style={commonStyles.lineSemiBold}>{V.titre}</Text>
      {plan.valorisation ? (
        <>
          <Text style={commonStyles.note}>{V.aide}</Text>
          {plan.valorisation.prixLait !== undefined ? (
            <Text style={commonStyles.note}>{V.lait(formatMontant(plan.valorisation.prixLait))}</Text>
          ) : (
            <Text style={commonStyles.mutedItalic}>{V.sansPrixLait}</Text>
          )}
          {plan.valorisation.lignes.map((l) => (
            <View key={l.libelle} style={commonStyles.gap2}>
              <Text style={commonStyles.lineBold}>
                {V.fromage(l.libelle, formatMontant(l.prix), nombre(l.litresParFromage))}
              </Text>
              <Text style={commonStyles.note}>{V.parLitre(formatMontant(l.prixParLitre))}</Text>
              {plan.valorisation && plan.valorisation.litres > 0 ? (
                <Text style={commonStyles.note}>
                  {V.production(nombre(plan.valorisation.litres, 0), formatMontant(l.productionPotentielle))}
                </Text>
              ) : null}
              {l.gainSurLait !== undefined && plan.valorisation && plan.valorisation.litres > 0 ? (
                <Text
                  style={[
                    commonStyles.lineSemiBold,
                    { color: l.gainSurLait >= 0 ? colors.primary : colors.danger },
                  ]}
                >
                  {l.gainSurLait >= 0
                    ? V.plus(formatMontant(l.gainSurLait))
                    : V.moins(formatMontant(-l.gainSurLait))}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      ) : (
        <Text style={commonStyles.mutedItalic}>{V.aucun}</Text>
      )}
      <CoutInvestissementModal
        visible={coutOuvert !== null}
        titre={coutOuvert === INVESTISSEMENT.SILO ? I.silo.titre : I.cuve.titre}
        cout={coutOuvert ? settings.exploitation?.investissementsEconomie?.[coutOuvert] : undefined}
        onValider={enregistrerCout}
        onFermer={() => setCoutOuvert(null)}
      />
    </Card>
  );
}
