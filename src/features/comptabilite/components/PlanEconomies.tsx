import { Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import {
  TYPE_PISTE,
  type Piste,
  type PlanEconomies as Plan,
} from '@/features/comptabilite/services/pistesEconomie';
import { HYPOTHESES_ECONOMIE, UN_CENTIME } from '@/shared/constants/economies';
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
    </Card>
  );
}
