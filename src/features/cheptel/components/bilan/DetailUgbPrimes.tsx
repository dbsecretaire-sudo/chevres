import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { formaterUgb } from '@/features/cheptel/services/ugb';
import { saisonDePrime, type LignePrimeComparee } from '@/features/cheptel/services/primesPercues';
import { ROUTES } from '@/shared/constants/routes';
import { LABEL_ZONE_ICHN } from '@/shared/textes/libelles';
import { formatDateFR, formatMontant } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.bilanAnnuel.effectifEtUgb.detail;
const Tb = TEXTES.cheptel.bilanAnnuel.effectifEtUgb;
const P = TEXTES.cheptel.ugbPrimes;

interface Props {
  visible: boolean;
  onFermer: () => void;
  effectif: { petits: number; sevres: number };
  /** Vrai quand l'effectif est celui qu'on a déclaré (tous au coefficient adulte) et non l'effectif de fin d'année. */
  declare: boolean;
  coefficients: { adulte: number; petit: number };
  ugb: number;
  hectares: number;
  lignes: LignePrimeComparee[];
  total: number;
  /** L'année du bilan : la saison où l'on compte les aides perçues. */
  annee: number;
}

/** Les notes des deux réductions du paiement de base (celle du stabilisateur et celle du plafonnement budgétaire) : la plus élevée est retenue. */
function notesReductions(l: LignePrimeComparee): string[] {
  const coef = (n: number) => String(n).replace('.', ',');
  const pourcentageStabilisateur = Math.round((100 - l.stabilisateur) * 10000) / 10000;
  const avant = formatMontant(l.montantAvantStabilisateur);
  const budgetaireRetenue = l.reductionBudgetaire > l.reductionDuStabilisateur;
  const notes: string[] = [];
  if (l.pourcentageReductionBudgetaire > 0)
    notes.push(
      budgetaireRetenue
        ? T.reductionBudgetaireRetenue(
            coef(l.pourcentageReductionBudgetaire),
            avant,
            formatMontant(l.reductionBudgetaire),
          )
        : T.reductionBudgetaireNonRetenue(
            coef(l.pourcentageReductionBudgetaire),
            formatMontant(l.reductionBudgetaire),
          ),
    );
  if (pourcentageStabilisateur > 0)
    notes.push(
      budgetaireRetenue
        ? T.stabilisateurNonRetenu(
            coef(l.stabilisateur),
            coef(pourcentageStabilisateur),
            formatMontant(l.reductionDuStabilisateur),
          )
        : T.stabilisateurRetenu(
            coef(l.stabilisateur),
            coef(pourcentageStabilisateur),
            avant,
            formatMontant(l.reductionDuStabilisateur),
          ),
    );
  return notes;
}

/**
 * Le détail du calcul de l'UGB prévisionnel (animaux sevrés et petits, avec leurs coefficients) et de la prime prévisionnelle (chaque
 * prime cochée : quantité × montant), avec un accès aux réglages d'Organisation › Cheptel.
 */
export function DetailUgbPrimes({
  visible,
  onFermer,
  effectif,
  declare,
  coefficients,
  ugb,
  hectares,
  lignes,
  total,
  annee,
}: Props) {
  const saison = saisonDePrime(annee);
  const router = useRouter();
  const coef = (n: number) => String(n).replace('.', ',');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={commonStyles.backdrop} onPress={onFermer}>
        <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={commonStyles.subheading}>{T.titre}</Text>
          <ScrollView style={commonStyles.listeDeFenetre} contentContainerStyle={commonStyles.gap10}>
            <View style={commonStyles.gap2}>
              <Text style={commonStyles.line}>
                {(declare ? T.declare : T.sevres)(effectif.sevres, coef(coefficients.adulte))}
              </Text>
              {!declare && (effectif.petits > 0 || coefficients.petit > 0) ? (
                <Text style={commonStyles.line}>{T.petits(effectif.petits, coef(coefficients.petit))}</Text>
              ) : null}
              <Text style={commonStyles.lineBold}>{T.ugb(formaterUgb(ugb))}</Text>
              <Text style={commonStyles.note}>{T.hectares(coef(hectares))}</Text>
            </View>
            {lignes.length === 0 ? (
              <Text style={commonStyles.mutedItalic}>{T.aucunePrime}</Text>
            ) : (
              <View style={commonStyles.gap6}>
                {lignes.map((l) => (
                  <View key={l.cle} style={commonStyles.gap2}>
                    {l.partFixe > 0 ? (
                      <>
                        <Text style={commonStyles.line}>
                          {T.ligneTotale(l.nom, formatMontant(l.montant))}
                        </Text>
                        <Text style={commonStyles.note}>
                          {T.partFixe(
                            coef(l.quantite),
                            P.unitesQuantite[l.base],
                            formatMontant(l.partFixe),
                            formatMontant(l.montantFixe),
                          )}
                        </Text>
                        <Text style={commonStyles.note}>
                          {T.partZone(
                            coef(Math.round(l.quantitePleine * 100) / 100),
                            P.unitesQuantite[l.base],
                            formatMontant(l.tauxRetenu),
                            formatMontant(l.montantZone),
                          )}
                        </Text>
                      </>
                    ) : (
                      <Text style={commonStyles.line}>
                        {T.ligne(
                          l.nom,
                          coef(l.quantite),
                          P.unitesQuantite[l.base],
                          formatMontant(l.tauxRetenu),
                          formatMontant(l.montant - l.primeSupplementaire),
                        )}
                      </Text>
                    )}
                    {/* Une prime supplémentaire saisie : elle s'ajoute au montant de l'aide, avant le total de la ligne. */}
                    {l.primeSupplementaire > 0 ? (
                      <>
                        <Text style={commonStyles.note}>
                          {T.primeSupplementaire(formatMontant(l.primeSupplementaire))}
                        </Text>
                        <Text style={commonStyles.line}>
                          {T.ligneTotale(l.nom, formatMontant(l.montant))}
                        </Text>
                      </>
                    ) : null}
                    {l.percu !== undefined ? (
                      <Text style={l.ecart ? commonStyles.lineBold : commonStyles.note}>
                        {l.ecart ? '! ' : ''}
                        {Tb.percu(
                          formatMontant(l.percu),
                          formatDateFR(saison.debut),
                          formatDateFR(saison.fin),
                        )}
                      </Text>
                    ) : null}
                    {/* Ce qui a joué dans le calcul : plafond, seuil non atteint, montant limité, tranches. */}
                    {[
                      l.minimum !== undefined
                        ? T.sousMinimum(coef(l.minimum), P.unitesQuantite[l.base])
                        : undefined,
                      l.plafonnee
                        ? T.plafonne(coef(l.quantite), coef(l.quantiteBrute), P.unitesQuantite[l.base])
                        : undefined,
                      l.tauxRetenu < l.taux
                        ? T.tauxLimite(formatMontant(l.tauxRetenu), P.unites[l.base])
                        : undefined,
                      l.degressive ? T.degressif : undefined,
                      l.zones.length > 1
                        ? T.zones(
                            l.zones
                              .map(
                                (z) =>
                                  `${LABEL_ZONE_ICHN[z.zone as keyof typeof LABEL_ZONE_ICHN] ?? z.zone} ${coef(Math.round(z.hectares * 100) / 100)} ha à ${formatMontant(z.taux)}`,
                              )
                              .join(' · '),
                          )
                        : undefined,
                      // Les deux réductions du paiement de base : la plus élevée est retenue, l'autre est rappelée, sans effet.
                      ...notesReductions(l),
                    ]
                      .filter(Boolean)
                      .map((note) => (
                        <Text key={note} style={commonStyles.note}>
                          {note}
                        </Text>
                      ))}
                  </View>
                ))}
                <Text style={commonStyles.lineBold}>{T.total(formatMontant(total))}</Text>
              </View>
            )}
            <Text style={commonStyles.mutedItalic}>{T.note}</Text>
          </ScrollView>
          <Button
            variant="secondary"
            label={T.parametrer}
            onPress={() => {
              onFermer();
              router.push(ROUTES.CHEPTEL_REGLAGES as never);
            }}
          />
          <Button label={T.fermer} onPress={onFermer} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
