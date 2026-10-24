import { Text, View } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { CoutsAgritourismeFormules } from '@/features/comptabilite/components/CoutsAgritourisme';
import { PlanEconomies } from '@/features/comptabilite/components/PlanEconomies';
import { PERIMETRES_RENTABILITE, useRentabilite } from '@/features/comptabilite/hooks/useRentabilite';
import type { LigneAtelier } from '@/features/comptabilite/services/rentabilite';
import { ateliersDeLEspece } from '@/shared/constants/ateliers';
import { especeCourante, vocabulaire } from '@/shared/dictionnaire/animaux';
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
 * litre de lait et de l'animal, et le poids de chaque poste de charges.
 */
export default function Rentabilite() {
  const { annee, annees, setAnneeActive, resultat, laitier, plan, perimetre } = useRentabilite();
  if (!resultat) return null;
  // Tous les ateliers de l'espèce (et du périmètre demandé) sont montrés : ceux qui n'ont eu ni recette ni charge cette année y sont à 0 €, après ceux qui ont une activité.
  const dansLePerimetre: readonly string[] | undefined = perimetre ? PERIMETRES_RENTABILITE[perimetre] : undefined;
  const sansActivite: LigneAtelier[] = ateliersDeLEspece(especeCourante())
    .filter((atelier) => (!dansLePerimetre || dansLePerimetre.includes(atelier)) && !resultat.ateliers.some((l) => l.atelier === atelier))
    .map((atelier) => ({ atelier, recettes: 0, chargesDirectes: 0, chargesCommunes: 0, charges: 0, marge: 0, tauxMarge: undefined }));
  const lignesAteliers = [...resultat.ateliers, ...sansActivite];

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
      </LigneFiltres>

      {perimetre ? (
        <Card>
          <Text style={commonStyles.lineBold}>{T.perimetre[perimetre].titre}</Text>
          <Text style={commonStyles.note}>{T.perimetre[perimetre].aide}</Text>
        </Card>
      ) : null}

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

      <Text style={stylesFiscalite.titreSection}>{T.ateliers.titre}</Text>
      {lignesAteliers.length === 0 ? (
        <Card>
          <Text style={commonStyles.mutedItalic}>{T.ateliers.aucun}</Text>
        </Card>
      ) : (
        <Card>
          {lignesAteliers.map((a) => (
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

      <Text style={stylesFiscalite.titreSection}>{T.couts.titre}</Text>
      <Card>
        {laitier && perimetre !== 'agritourisme' ? (
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
        {perimetre ? null : (
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
        )}
        {perimetre === 'atelier' ? null : <CoutsAgritourismeFormules annee={annee} horsTaxes={resultat.horsTaxes} />}
      </Card>

      {plan ? <PlanEconomies plan={plan} litresProduits={resultat.litresProduits} /> : null}

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
