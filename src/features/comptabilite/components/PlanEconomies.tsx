import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { BarreHorizontale } from '@/shared/components/BarreHorizontale';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { AmortissementFromagerie } from '@/features/comptabilite/components/AmortissementFromagerie';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { bilanAgritourisme, type BilanAgritourisme } from '@/features/commercial/services/agritourisme';
import { RepartitionLait } from '@/features/comptabilite/components/RepartitionLait';
import { calculerAmortissement } from '@/features/comptabilite/services/amortissement';
import { GraphiqueValorisation } from '@/features/comptabilite/components/GraphiqueValorisation';
import {
  TYPE_PISTE,
  type Piste,
  type PlanEconomies as Plan,
} from '@/features/comptabilite/services/pistesEconomie';
import { HYPOTHESES_ECONOMIE, INVESTISSEMENT, UN_CENTIME } from '@/shared/constants/economies';
import { CoutInvestissementModal } from '@/features/comptabilite/components/CoutInvestissementModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { reglageInvestissement, type ReglageInvestissement } from '@/features/settings/settings';
import { CLE_FROMAGE_BROCCIU } from '@/shared/constants/lait';
import { exporterSimulationLaitPdf } from '@/features/export/documents/simulationLaitPdf';
import { LOCALE } from '@/shared/constants/format';
import { formatMontant } from '@/shared/utils/dates';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/comptabilite/PlanEconomies.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import type { CategorieDepense } from '@/features/comptabilite/types';

const T = TEXTES.comptabilite.rentabilite.plan;

type Onglet = 'resume' | 'charges' | 'investissements' | 'lait';

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
 * Le plan d'économies de la rentabilité, en graphiques : les chiffres clés d'abord, le litre de lait (prix, coût aujourd'hui et après
 * les pistes), les postes de charges (ce qu'ils coûtent et ce que la piste ferait gagner), les investissements (gain par an et coût)
 * et le lait transformé en fromage face au lait vendu. Les explications se déroulent avec « Détails ».
 */
export function PlanEconomies({ plan, litresProduits }: { plan: Plan; litresProduits: number }) {
  const { settings, patchSettings } = useAppSettings();
  /** L'investissement dont on indique le coût et les prix. */
  const [coutOuvert, setCoutOuvert] = useState<ValeurDe<typeof INVESTISSEMENT> | null>(null);
  /** La vue affichée : le résumé d'abord ; charges, investissements et lait en fromage à la demande. */
  const [onglet, setOnglet] = useState<Onglet>('resume');
  /** La simulation de répartition du lait est déroulée. */
  const [simulation, setSimulation] = useState(false);
  /** Les lignes dont le détail est déroulé. */
  const [ouverts, setOuverts] = useState<string[]>([]);
  const basculer = (cle: string) =>
    setOuverts((actuels) => (actuels.includes(cle) ? actuels.filter((c) => c !== cle) : [...actuels, cle]));
  const details = (cle: string) => (
    <Pressable onPress={() => basculer(cle)} hitSlop={8}>
      <Text style={commonStyles.lien}>{ouverts.includes(cle) ? T.masquer : T.details}</Text>
    </Pressable>
  );
  const I = T.investissements;
  const V = T.valorisation;
  const G = T.graphiques;
  const enregistrerCout = async (reglage: ReglageInvestissement | undefined) => {
    if (!coutOuvert) return;
    const couts = { ...settings.exploitation?.investissementsEconomie };
    if (reglage) couts[coutOuvert] = reglage;
    else delete couts[coutOuvert];
    await patchSettings({ exploitation: { ...settings.exploitation, investissementsEconomie: couts } });
    setCoutOuvert(null);
  };

  /** Les postes du plan : la plus grande dépense donne l'échelle des barres. */
  // Seuls les postes où une économie est possible figurent au graphique ; les postes dus ne servent à rien de plus, et ceux à préserver
  // (urée basse, analyses critiques) ne sont qu'une mise en garde.
  const pistesChiffrees = plan.pistes.filter((p) => p.economie > 0);
  const pistesAPreserver = plan.pistes.filter(
    (p) =>
      p.economie <= 0 &&
      (p.type === TYPE_PISTE.ALIMENT_PRUDENCE || p.type === TYPE_PISTE.VETERINAIRE_PRUDENCE),
  );
  const plusGrosPoste = Math.max(1, ...pistesChiffrees.map((p) => p.montant));

  /** L'amortissement de la fromagerie choisi pour la simulation. */
  const amortissement = calculerAmortissement(settings.exploitation?.amortissementFromagerie);
  /** Les visites d'agritourisme de l'année : leurs recettes peuvent s'ajouter au résultat de la simulation. */
  const [agritourisme, setAgritourisme] = useState<BilanAgritourisme | null>(null);
  useEffect(() => {
    lireArchiveCommercial().then((archive) =>
      setAgritourisme(
        bilanAgritourisme(archive.visites.filter((v) => v.date.startsWith(String(settings.anneeActive)))),
      ),
    );
  }, [settings.anneeActive]);
  /** Les recettes des visites de l'année : une ligne de la répartition (rien sans visite). */
  const recettesTourisme = agritourisme && agritourisme.sorties > 0 ? agritourisme.recettes : undefined;
  const onglets = [
    { valeur: 'resume' as const, label: T.onglets.resume },
    ...(pistesChiffrees.length > 0
      ? [{ valeur: 'charges' as const, label: `${T.onglets.charges} (${pistesChiffrees.length})` }]
      : []),
    ...(plan.investissements.length > 0
      ? [
          {
            valeur: 'investissements' as const,
            label: `${T.onglets.investissements} (${plan.investissements.length})`,
          },
        ]
      : []),
    { valeur: 'lait' as const, label: T.onglets.lait },
  ];
  const ongletActif = onglets.some((o) => o.valeur === onglet) ? onglet : 'resume';

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {litresProduits <= 0 ? <Text style={commonStyles.mutedItalic}>{T.sansLait}</Text> : null}
      <PucesDefilantes<Onglet> puces={onglets} valeur={ongletActif} onChoisir={setOnglet} />

      {/* Le résumé : les trois chiffres, la part de l'écart couverte, ce qu'il ne faut pas toucher */}
      {ongletActif === 'resume' ? (
        <>
          {litresProduits > 0 ? (
            <>
              {/* Les chiffres clés */}
              <View style={styles.tuiles}>
                <View style={styles.tuile}>
                  <Text style={commonStyles.note}>{G.economie}</Text>
                  <Text style={styles.tuileValeur}>{formatMontant(plan.economieTotale)}</Text>
                  <Text style={commonStyles.note}>{G.parAn}</Text>
                </View>
                {plan.coutParLitre !== undefined && plan.coutParLitreApres !== undefined ? (
                  <View style={styles.tuile}>
                    <Text style={commonStyles.note}>{G.coutLitre}</Text>
                    <Text style={styles.tuileValeur}>
                      {G.fleche(formatMontant(plan.coutParLitre), formatMontant(plan.coutParLitreApres))}
                    </Text>
                    <Text style={commonStyles.note}>{G.leLitre}</Text>
                  </View>
                ) : null}
                {plan.prixLitre !== undefined ? (
                  <View style={styles.tuile}>
                    <Text style={commonStyles.note}>{G.prixVente}</Text>
                    <Text style={styles.tuileValeur}>{formatMontant(plan.prixLitre)}</Text>
                    <Text style={commonStyles.note}>{G.leLitre}</Text>
                  </View>
                ) : null}
              </View>

              {plan.partCouverte !== undefined ? (
                <View style={styles.bloc}>
                  <Text style={commonStyles.lineSemiBold}>
                    {plan.partCouverte >= 1 ? T.couvreTout : T.couvre(pourcent(plan.partCouverte))}
                  </Text>
                  <BarreHorizontale segments={[{ part: plan.partCouverte, couleur: colors.primary }]} />
                </View>
              ) : plan.ecartParLitre !== undefined ? (
                <Text style={commonStyles.note}>{T.sansEcart}</Text>
              ) : null}
              <Text style={commonStyles.mutedBold}>
                {T.centimeLitre(formatMontant(litresProduits * UN_CENTIME))}
              </Text>
            </>
          ) : null}
          {/* Ce qu'il ne faut pas toucher (urée basse, analyses critiques) : une mise en garde, pas un poste du graphique. Les postes dus (impôts, cotisations) ne s'y mettent pas. */}
          {pistesAPreserver.length > 0 ? (
            <>
              <Text style={commonStyles.lineSemiBold}>{G.aPreserver}</Text>
              {pistesAPreserver.map((p) => {
                const base = p.categorie.split(':')[0] as CategorieDepense;
                const nom = p.libelle ?? LABEL_CATEGORIE_DEPENSE[base] ?? p.categorie;
                return (
                  <Text key={`${p.categorie}-${p.type}`} style={commonStyles.note}>
                    {`${nom} : ${texteDeLaPiste(p)}`}
                  </Text>
                );
              })}
            </>
          ) : null}
        </>
      ) : null}

      {/* Les postes de charges */}
      {ongletActif === 'charges' ? (
        <>
          {/* Les postes où une économie est possible : en gris ce qu'ils coûtent, en vert ce que la piste ferait gagner */}
          {pistesChiffrees.length > 0 ? (
            <>
              <Text style={commonStyles.note}>{G.legendePostes}</Text>
              {pistesChiffrees.map((p) => {
                const base = p.categorie.split(':')[0] as CategorieDepense;
                const nom = p.libelle ?? LABEL_CATEGORIE_DEPENSE[base] ?? p.categorie;
                const cle = `poste:${p.categorie}-${p.type}`;
                return (
                  <View key={cle} style={styles.bloc}>
                    <View style={styles.ligne}>
                      <Text style={[commonStyles.lineBold, commonStyles.flex1]}>
                        {T.poste(nom, formatMontant(p.montant))}
                      </Text>
                      <Text style={styles.gain}>{`− ${formatMontant(p.economie)}`}</Text>
                    </View>
                    <BarreHorizontale
                      segments={[
                        { part: p.economie / plusGrosPoste, couleur: colors.primary },
                        { part: (p.montant - p.economie) / plusGrosPoste, couleur: colors.textMuted },
                      ]}
                    />
                    {details(cle)}
                    {ouverts.includes(cle) ? (
                      <Text style={commonStyles.note}>{texteDeLaPiste(p)}</Text>
                    ) : null}
                  </View>
                );
              })}
            </>
          ) : null}
        </>
      ) : null}

      {/* Les investissements */}
      {ongletActif === 'investissements' ? (
        <>
          {/* Les investissements en vignettes : le gain par an et le remboursement ; un appui déroule le détail en dessous */}
          {plan.investissements.length > 0 ? (
            <>
              <Text style={commonStyles.note}>{I.aide}</Text>
              <View style={styles.tuiles}>
                {plan.investissements.map((inv) => {
                  const cle = `investissement:${inv.investissement}`;
                  const ouvert = ouverts.includes(cle);
                  return (
                    <Pressable
                      key={cle}
                      style={[styles.tuile, ouvert && styles.tuileChoisie]}
                      onPress={() => basculer(cle)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: ouvert }}
                    >
                      <Text style={commonStyles.lineBold}>
                        {inv.investissement === INVESTISSEMENT.SILO ? I.silo.titre : I.cuve.titre}
                      </Text>
                      <Text style={styles.tuileValeur}>{formatMontant(inv.economie)}</Text>
                      <Text style={commonStyles.note}>{G.parAn}</Text>
                      {inv.remboursementAnnees !== undefined ? (
                        <Text style={commonStyles.lineSemiBold}>
                          {I.remboursement(I.duree(Math.max(1, Math.round(inv.remboursementAnnees * 12))))}
                        </Text>
                      ) : (
                        <Text style={commonStyles.note}>{G.toucherDetail}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {plan.investissements
                .filter((inv) => ouverts.includes(`investissement:${inv.investissement}`))
                .map((inv) => {
                  const silo = inv.investissement === INVESTISSEMENT.SILO;
                  const saisi = reglageInvestissement(
                    settings.exploitation?.investissementsEconomie?.[inv.investissement],
                  );
                  const ecart =
                    saisi.prixActuel && saisi.prixAvecInvestissement
                      ? 1 - saisi.prixAvecInvestissement / saisi.prixActuel
                      : 0;
                  const echelle = Math.max(inv.economie, inv.cout ?? 0, 1);
                  return (
                    <View key={inv.investissement} style={styles.detail}>
                      <Text style={commonStyles.lineBold}>{silo ? I.silo.titre : I.cuve.titre}</Text>
                      <Text style={commonStyles.note}>{silo ? I.silo.texte : I.cuve.texte}</Text>
                      <View style={styles.ligne}>
                        <Text style={[commonStyles.line, commonStyles.flex1]}>{G.gainParAn}</Text>
                        <Text style={styles.gain}>{formatMontant(inv.economie)}</Text>
                      </View>
                      <BarreHorizontale
                        segments={[{ part: inv.economie / echelle, couleur: colors.primary }]}
                      />
                      {inv.cout ? (
                        <>
                          <View style={styles.ligne}>
                            <Text style={[commonStyles.line, commonStyles.flex1]}>
                              {G.coutInvestissement}
                            </Text>
                            <Text style={commonStyles.lineBold}>{formatMontant(inv.cout)}</Text>
                          </View>
                          <BarreHorizontale
                            segments={[{ part: inv.cout / echelle, couleur: colors.warning }]}
                          />
                        </>
                      ) : null}
                      {inv.postes.map((poste) => (
                        <Text key={poste.cle} style={commonStyles.note}>
                          {I.ligne(
                            I.poste[poste.cle],
                            formatMontant(poste.montant),
                            formatMontant(poste.economie),
                            poste.source === 'prix'
                              ? I.sourcePrix(
                                  formatMontant(saisi.prixActuel ?? 0),
                                  formatMontant(saisi.prixAvecInvestissement ?? 0),
                                  pourcent(ecart),
                                )
                              : I.sourceHypothese(pourcent(poste.part ?? 0)),
                          )}
                        </Text>
                      ))}
                      <Pressable onPress={() => setCoutOuvert(inv.investissement)} hitSlop={8}>
                        <Text style={commonStyles.lien}>{inv.cout ? I.modifierCout : I.indiquerCout}</Text>
                      </Pressable>
                    </View>
                  );
                })}
            </>
          ) : null}
        </>
      ) : null}

      {/* Le lait en fromage : le graphique (ou le tableau), puis la simulation à la demande */}
      {ongletActif === 'lait' ? (
        plan.valorisation ? (
          <>
            <Text style={commonStyles.note}>{V.aide}</Text>
            <GraphiqueValorisation valorisation={plan.valorisation} recettesTourisme={recettesTourisme} />
            {plan.valorisation.litres > 0 ? (
              <>
                <Pressable onPress={() => setSimulation((ouverte) => !ouverte)} hitSlop={8}>
                  <Text style={commonStyles.lien}>{simulation ? V.masquerSimulation : V.simuler}</Text>
                </Pressable>
                {simulation ? (
                  <RepartitionLait
                    key={JSON.stringify(settings.exploitation?.repartitionLait ?? null)}
                    fromages={plan.valorisation.lignes}
                    litres={plan.valorisation.litres}
                    prixLait={plan.valorisation.prixLait}
                    parts={settings.exploitation?.repartitionLait ?? plan.valorisation.partsReelles ?? {}}
                    choisies={!!settings.exploitation?.repartitionLait}
                    brocciuActif={
                      settings.exploitation?.repartitionBrocciu ??
                      (plan.valorisation.partsReelles?.[CLE_FROMAGE_BROCCIU] ?? 0) > 0
                    }
                    onBrocciu={(actif) =>
                      patchSettings({ exploitation: { ...settings.exploitation, repartitionBrocciu: actif } })
                    }
                    coutSelParGramme={plan.valorisation.coutSelParGramme}
                    amortissementAnnuel={amortissement.inclure ? amortissement.annuel : undefined}
                    charges={plan.charges}
                    recettesTourisme={recettesTourisme}
                    sousLeTableau={
                      <>
                        <AmortissementFromagerie
                          reglage={settings.exploitation?.amortissementFromagerie}
                          onEnregistrer={(reglage) =>
                            patchSettings({
                              exploitation: { ...settings.exploitation, amortissementFromagerie: reglage },
                            })
                          }
                        />
                      </>
                    }
                    onTelecharger={(repartition) =>
                      exporterSimulationLaitPdf({
                        annee: settings.anneeActive,
                        litres: plan.valorisation?.litres ?? 0,
                        repartition,
                        prixLait: plan.valorisation?.prixLait,
                        charges: plan.charges,
                        amortissement: amortissement.inclure ? amortissement : undefined,
                        agritourisme: recettesTourisme,
                      })
                    }
                    onEnregistrer={(parts) =>
                      patchSettings({ exploitation: { ...settings.exploitation, repartitionLait: parts } })
                    }
                    onReinitialiser={() => {
                      const { repartitionLait: _retire, ...autres } = settings.exploitation ?? {};
                      patchSettings({ exploitation: autres });
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <Text style={commonStyles.mutedItalic}>{V.aucun}</Text>
        )
      ) : null}
      <CoutInvestissementModal
        visible={coutOuvert !== null}
        investissement={coutOuvert}
        reglage={reglageInvestissement(
          coutOuvert ? settings.exploitation?.investissementsEconomie?.[coutOuvert] : undefined,
        )}
        onValider={enregistrerCout}
        onFermer={() => setCoutOuvert(null)}
      />
    </Card>
  );
}
