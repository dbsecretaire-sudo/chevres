import { Text, View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { CoutsAgritourismeFormules } from '@/features/comptabilite/components/CoutsAgritourisme';
import { PlanEconomies } from '@/features/comptabilite/components/PlanEconomies';
import { PucesActivite } from '@/features/comptabilite/components/PucesActivite';
import { useRentabilite } from '@/features/comptabilite/hooks/useRentabilite';
import { vocabulaire } from '@/shared/dictionnaire/animaux';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { LABEL_ATELIER, LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { styles as stylesFiscalite } from '@/shared/styles/comptabilite/Fiscalite.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import type { CategorieDepense } from '@/features/comptabilite/types';

const T = TEXTES.comptabilite.rentabilite;

/** La couleur d'un montant de résultat : vert au positif, rouge au négatif. */
const couleurResultat = (valeur: number) => (valeur >= 0 ? colors.primary : colors.danger);

const nombre = (valeur: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(valeur);

/**
 * Comptabilité › Rentabilité : le résultat de l'année (avec et sans les aides), la marge de chaque atelier, le coût de production du
 * litre de lait et de l'animal, et le poids de chaque poste de charges. Une entreprise (secrétariat, gîte, activité financière) n'a ni
 * ateliers, ni coûts de production, ni plan d'économies : elle ne garde que le résultat et le poids de ses charges.
 */
export default function Rentabilite() {
  const { annee, annees, setAnneeActive, filtre, setFiltre, resultat, laitier, plan } = useRentabilite();
  if (!resultat) return null;
  const entreprise = modeEntreprise();

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <PucesActivite valeur={filtre} onChange={setFiltre} />
      </LigneFiltres>

      <Card>
        <Text style={commonStyles.cardTitle}>{T.resultatTitre(annee)}</Text>
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.recettes}</Text>
          <Text style={commonStyles.lineBold}>{formatMontant(resultat.recettes)}</Text>
        </View>
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.charges}</Text>
          <Text style={commonStyles.lineBold}>{formatMontant(resultat.charges)}</Text>
        </View>
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.aides}</Text>
          <Text style={commonStyles.lineBold}>{formatMontant(resultat.aides)}</Text>
        </View>
        <View style={commonStyles.separateur} />
        <View style={styles.ligne}>
          <Text style={commonStyles.strongPrimary}>{T.resultat}</Text>
          <Text style={[commonStyles.strongPrimary, { color: couleurResultat(resultat.resultat) }]}>
            {formatMontant(resultat.resultat)}
          </Text>
        </View>
        <View style={styles.ligne}>
          <Text style={commonStyles.muted}>{T.resultatSansAides}</Text>
          <Text style={[commonStyles.mutedBold, { color: couleurResultat(resultat.resultatSansAides) }]}>
            {formatMontant(resultat.resultatSansAides)}
          </Text>
        </View>
        <Text style={commonStyles.note}>{resultat.horsTaxes ? T.horsTaxes : T.toutesTaxes}</Text>
      </Card>

      {entreprise ? null : <Text style={stylesFiscalite.titreSection}>{T.ateliers.titre}</Text>}
      {entreprise ? null : resultat.ateliers.length === 0 ? (
        <Card>
          <Text style={commonStyles.mutedItalic}>{T.ateliers.aucun}</Text>
        </Card>
      ) : (
        <Card>
          {resultat.ateliers.map((a) => (
            <View key={a.atelier} style={commonStyles.gap2}>
              <View style={styles.ligne}>
                <Text style={commonStyles.lineBold}>{LABEL_ATELIER[a.atelier]}</Text>
                <Text style={[commonStyles.lineBold, { color: couleurResultat(a.marge) }]}>
                  {formatMontant(a.marge)}
                  {a.tauxMarge !== undefined ? ` · ${T.ateliers.marge(a.tauxMarge)}` : ''}
                </Text>
              </View>
              <Text style={commonStyles.note}>
                {T.ateliers.recettesCharges(formatMontant(a.recettes), formatMontant(a.charges))}
                {a.chargesCommunes > 0
                  ? ` · ${T.ateliers.dontCommunes(formatMontant(a.chargesCommunes))}`
                  : ''}
              </Text>
            </View>
          ))}
          <Text style={commonStyles.note}>{T.ateliers.aide}</Text>
        </Card>
      )}

      {entreprise ? null : <Text style={stylesFiscalite.titreSection}>{T.couts.titre}</Text>}
      {entreprise ? null : (
        <Card>
          {laitier ? (
            <View style={commonStyles.gap2}>
              <View style={styles.ligne}>
                <Text style={commonStyles.lineBold}>{T.couts.parLitre}</Text>
                <Text style={commonStyles.lineBold}>
                  {resultat.coutParLitre === undefined ? '—' : formatMontant(resultat.coutParLitre)}
                </Text>
              </View>
              <Text style={commonStyles.note}>
                {resultat.coutParLitre !== undefined
                  ? T.couts.parLitreAide(nombre(resultat.litresProduits), formatMontant(resultat.charges))
                  : resultat.litresProduits > 0
                    ? T.couts.parLitreSansCharges(nombre(resultat.litresProduits))
                    : T.couts.parLitreSansLait(annee)}
              </Text>
            </View>
          ) : null}
          <View style={commonStyles.gap2}>
            <View style={styles.ligne}>
              <Text style={commonStyles.lineBold}>{T.couts.parAnimal(vocabulaire().femelle.singulier)}</Text>
              <Text style={commonStyles.lineBold}>
                {resultat.coutParAnimal === undefined ? '—' : formatMontant(resultat.coutParAnimal)}
              </Text>
            </View>
            <Text style={commonStyles.note}>
              {resultat.coutParAnimal === undefined || resultat.effectif === undefined
                ? T.couts.parAnimalAbsent
                : T.couts.parAnimalAide(nombre(resultat.effectif), formatMontant(resultat.charges))}
            </Text>
          </View>
          <CoutsAgritourismeFormules annee={annee} horsTaxes={resultat.horsTaxes} />
        </Card>
      )}

      {plan && !entreprise ? <PlanEconomies plan={plan} litresProduits={resultat.litresProduits} /> : null}

      <Text style={stylesFiscalite.titreSection}>{T.postes.titre}</Text>
      {resultat.postes.length === 0 ? (
        <Card>
          <Text style={commonStyles.mutedItalic}>{T.postes.aucun}</Text>
        </Card>
      ) : (
        <Card>
          {resultat.postes.map((p) => (
            <View key={p.categorie} style={commonStyles.gap2}>
              <View style={styles.ligne}>
                <Text style={commonStyles.line}>
                  {p.libelle ??
                    LABEL_CATEGORIE_DEPENSE[p.categorie.split(':')[0] as CategorieDepense] ??
                    p.categorie}
                </Text>
                <Text style={commonStyles.lineBold}>
                  {formatMontant(p.montant)} · {T.postes.part(p.part)}
                </Text>
              </View>
              {resultat.effectif !== undefined || (laitier && resultat.litresProduits > 0) ? (
                <Text style={commonStyles.note}>
                  {[
                    resultat.effectif
                      ? T.postes.parAnimal(formatMontant(p.montant / resultat.effectif))
                      : undefined,
                    laitier && resultat.litresProduits > 0
                      ? T.postes.parLitre(formatMontant(p.montant / resultat.litresProduits))
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={commonStyles.para}>{T.notice}</Text>
      </Card>
    </Screen>
  );
}
