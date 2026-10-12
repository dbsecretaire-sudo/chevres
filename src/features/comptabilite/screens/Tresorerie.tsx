import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { YearPicker } from '@/shared/components/YearPicker';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { CourbeTresorerie } from '@/features/comptabilite/components/CourbeTresorerie';
import { useTresorerie } from '@/features/comptabilite/hooks/useTresorerie';
import type { EvenementTresorerie } from '@/features/comptabilite/services/tresorerie';
import { TYPE_ECHEANCE } from '@/shared/constants/tresorerie';
import { ROUTES } from '@/shared/constants/routes';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/comptabilite/FiscaliteRsa.styles';
import { styles as stylesFiscalite } from '@/shared/styles/comptabilite/Fiscalite.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.tresorerie;

const couleur = (valeur: number) => (valeur >= 0 ? colors.primary : colors.danger);
const nomDuMois = (mois: number) => NOMS_MOIS[mois - 1];

/**
 * Comptabilité › Trésorerie : la courbe du solde mois par mois (réalisé, puis prévision), les alertes sous le seuil, l'échéancier
 * (à encaisser, à payer, emprunts) et les flux de chaque mois.
 */
export default function Tresorerie() {
  const router = useRouter();
  const { annee, annees, setAnneeActive, resultat } = useTresorerie();
  if (!resultat) return null;

  const groupes: {
    type: (typeof TYPE_ECHEANCE)[keyof typeof TYPE_ECHEANCE];
    titre: string;
    total: number;
  }[] = [
    { type: TYPE_ECHEANCE.A_ENCAISSER, titre: T.echeancier.aEncaisser, total: resultat.totaux.aEncaisser },
    { type: TYPE_ECHEANCE.A_PAYER, titre: T.echeancier.aPayer, total: resultat.totaux.aPayer },
    { type: TYPE_ECHEANCE.EMPRUNT, titre: T.echeancier.emprunts, total: resultat.totaux.emprunts },
  ];
  const ouvrir = (e: EvenementTresorerie) => {
    if (e.source === 'vente') router.push(ROUTES.ficheVente(e.id) as never);
    else if (e.source === 'facture') router.push(ROUTES.ficheFacture(e.id) as never);
    else router.push(ROUTES.COMPTABILITE_TRESORERIE_REGLAGES as never);
  };

  return (
    <Screen>
      <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />

      {resultat.soldeDefini ? null : (
        <Card>
          <Text style={commonStyles.para}>{T.sansSolde}</Text>
          <Button
            variant="secondary"
            label={T.saisirLeSolde}
            onPress={() => router.push(ROUTES.COMPTABILITE_TRESORERIE_REGLAGES)}
          />
        </Card>
      )}

      <Card>
        <Text style={commonStyles.cardTitle}>{T.courbeTitre(annee)}</Text>
        <CourbeTresorerie mois={resultat.mois} seuil={resultat.seuil} />
        <View style={styles.ligne}>
          <Text style={commonStyles.line}>{T.soldeActuel}</Text>
          <Text style={[commonStyles.lineBold, { color: couleur(resultat.soldeActuel) }]}>
            {formatMontant(resultat.soldeActuel)}
          </Text>
        </View>
        <View style={styles.ligne}>
          <Text style={commonStyles.muted}>{T.pointBas(nomDuMois(resultat.pointBas.mois))}</Text>
          <Text style={[commonStyles.mutedBold, { color: couleur(resultat.pointBas.solde) }]}>
            {formatMontant(resultat.pointBas.solde)}
          </Text>
        </View>
        <Text style={commonStyles.note}>{T.legende}</Text>
      </Card>

      <Text style={stylesFiscalite.titreSection}>{T.alertes.titre}</Text>
      <Card>
        {resultat.alertes.length === 0 ? (
          <Text style={commonStyles.para}>{T.alertes.aucune}</Text>
        ) : (
          <>
            <Text style={[commonStyles.lineBold, { color: colors.danger }]}>
              {T.alertes.souslesSeuil(formatMontant(resultat.seuil))}
            </Text>
            {resultat.alertes.map((a) => (
              <Text key={a.mois} style={commonStyles.line}>
                {T.alertes.ligne(nomDuMois(a.mois), formatMontant(a.solde))}
              </Text>
            ))}
          </>
        )}
      </Card>

      <Text style={stylesFiscalite.titreSection}>{T.echeancier.titre}</Text>
      {resultat.echeances.length === 0 ? (
        <Card>
          <Text style={commonStyles.mutedItalic}>{T.echeancier.aucune}</Text>
        </Card>
      ) : (
        groupes.map((g) => {
          const lignes = resultat.echeances.filter((e) => e.type === g.type);
          if (lignes.length === 0) return null;
          return (
            <View key={g.type} style={commonStyles.gap6}>
              <View style={styles.ligne}>
                <Text style={commonStyles.lineSemiBold}>{g.titre}</Text>
                <Text style={commonStyles.lineSemiBold}>{formatMontant(g.total)}</Text>
              </View>
              <BlocLignes>
                {lignes.map((e, index) => (
                  <ListRow
                    key={`${e.source}:${e.id}:${e.date}:${index}`}
                    title={e.libelle || T.echeancier.sansNom}
                    subtitle={
                      e.enRetard ? `${T.echeancier.enRetard} · ${formatDateFR(e.date)}` : formatDateFR(e.date)
                    }
                    trailing={
                      <Text style={[commonStyles.lineBold, { color: couleur(e.montant) }]}>
                        {formatMontant(e.montant)}
                      </Text>
                    }
                    onPress={() => ouvrir(e)}
                  />
                ))}
              </BlocLignes>
            </View>
          );
        })
      )}

      <Text style={stylesFiscalite.titreSection}>{T.flux.titre}</Text>
      <Card>
        {resultat.mois.map((m) => (
          <View key={m.mois} style={styles.ligne}>
            <Text style={commonStyles.line}>{nomDuMois(m.mois)}</Text>
            <Text style={commonStyles.muted}>
              {m.encaissements === 0 && m.decaissements === 0
                ? T.flux.aucun
                : T.flux.ligne(formatMontant(m.encaissements), formatMontant(m.decaissements))}
            </Text>
          </View>
        ))}
      </Card>

      <Pressable onPress={() => router.push(ROUTES.COMPTABILITE_TRESORERIE_REGLAGES)} hitSlop={8}>
        <Text style={commonStyles.lien}>{T.reglages}</Text>
      </Pressable>

      <Card>
        <Text style={commonStyles.para}>{T.notice}</Text>
      </Card>
    </Screen>
  );
}
