import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { MiseAJourCheptel } from '@/features/cheptel/components/MiseAJourCheptel';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { InfosExploitation } from '@/features/settings/settings';
import {
  baseDeLaPrime,
  cleAides,
  coefficientsUgb,
  infosPourAnnee,
  plafondsDeLAide,
  primesPrevisionnelles,
  reductionBudgetaireDpb,
  reductionDuStabilisateur,
  stabilisateurDpb,
} from '@/features/cheptel/services/ugb';
import { listControles } from '@/features/exploitation/repository/controles';
import { totauxSurfaces } from '@/features/exploitation/services/surfaces';
import { FAMILLE_CONTROLE, ZONE_ICHN } from '@/shared/constants/controles';
import { formatMontant } from '@/shared/utils/dates';
import {
  BASE_PRIME,
  MONTANT_ICHN_PAR_ZONE,
  PRIMES,
  primeValablePour,
  REGLES_PRIMES,
  STABILISATEUR_NEUTRE,
} from '@/shared/constants/primes';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { LABEL_ACTIVITE_COMPTABLE, LABEL_ZONE_ICHN } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

const T = TEXTES.cheptel.ugbPrimes;

/** Les zones de l'ICHN dont le montant se saisit à côté de celui de la montagne sèche (celui de l'aide). */
const ZONES_ICHN_A_MONTANT = [ZONE_ICHN.HAUTE_MONTAGNE_SECHE, ZONE_ICHN.ZSCN, ZONE_ICHN.ZSCS];

/** Une aide à l'écran : sa case, son montant (en texte) et sa base ; `nom` seulement pour une aide ajoutée ou renommée. */
interface SaisieAide {
  actif: boolean;
  taux: string;
  base: string;
  nom: string;
  /** Les plafonds, en texte (vide : sans) : quantité maximale, seuil minimal, montant unitaire maximal. */
  plafond: string;
  minimum: string;
  plafondTaux: string;
  /** La part fixe par hectare (l'ICHN : en plus du montant de la zone). */
  partFixe: string;
  /** L'ICHN sur deux niveaux de montagne : le montant (€/ha) du second niveau et ses hectares, en texte (vides : aucun). */
  tauxParZone: Record<string, string>;
  /** La majoration (%) pour un cheptel de petits ruminants (l'ICHN), en texte (vide : aucune). */
  majoration: string;
  /** Les tranches d'une aide dégressive (l'ICHN) : jusqu'à tant d'hectares, la part payée. */
  tranchesZone: { jusqua: string; pourcentage: string }[];
}

/** Ce qu'on saisit : un coefficient par espèce (adulte, petit), les aides d'office par clé, et les aides ajoutées. */
interface Saisie {
  /** Le nombre d'associés d'un GAEC, en texte (1 hors GAEC). */
  associes: string;
  /** Le stabilisateur (%) du paiement de base de l'année, en texte (vide : aucun). */
  stabilisateur: string;
  /** La réduction pour plafonnement budgétaire (%) de l'année, en texte (vide : aucune). */
  reductionBudgetaire: string;
  coefficients: Record<string, { adulte: string; petit: string }>;
  primes: Record<string, SaisieAide>;
  personnalisees: (SaisieAide & { id: string })[];
}

/** Un nombre saisi en texte (rien quand le champ est vide : la valeur d'office s'applique). */
const nombreOuRien = (texte: string): number | undefined => (texte.trim() ? parseDecimal(texte) : undefined);
const enTexte = (valeur: number | undefined): string =>
  valeur === undefined ? '' : String(valeur).replace('.', ',');
/** Un plafond en texte : 0 veut dire « sans », le champ reste vide. */
const plafondEnTexte = (valeur: number): string => (valeur > 0 ? enTexte(valeur) : '');

/** Les plafonds d'une aide à l'écran : ceux saisis, à défaut ceux d'office. */
const plafondsEnTexte = (infos: InfosExploitation | undefined, cle: string) => {
  const p = plafondsDeLAide(infos, cle);
  return {
    tauxParZone: Object.fromEntries(
      ZONES_ICHN_A_MONTANT.map((zone) => [
        zone,
        enTexte(infos?.ugbPrimes?.primes?.[cle]?.tauxParZone?.[zone]),
      ]),
    ),
    majoration: enTexte(infos?.ugbPrimes?.primes?.[cle]?.majorationPetitsRuminants),
    plafond: plafondEnTexte(p.plafond),
    minimum: plafondEnTexte(p.minimum),
    plafondTaux: plafondEnTexte(p.plafondTaux),
    partFixe: plafondEnTexte(p.partFixe),
    tranchesZone: p.tranchesZone.map((t) => ({
      jusqua: enTexte(t.jusqua),
      pourcentage: enTexte(t.pourcentage),
    })),
  };
};

/** Les plafonds saisis en nombres : un champ vide s'enregistre 0 (« sans plafond »), pour ne pas retomber sur le plafond d'office. */
const plafondsEnNombres = (p: SaisieAide) => ({
  tauxParZone: Object.fromEntries(
    Object.entries(p.tauxParZone)
      .map(([zone, texte]) => [zone, nombreOuRien(texte)])
      .filter(([, montant]) => montant !== undefined),
  ),
  majorationPetitsRuminants: nombreOuRien(p.majoration),
  plafond: nombreOuRien(p.plafond) ?? 0,
  minimum: nombreOuRien(p.minimum) ?? 0,
  plafondTaux: nombreOuRien(p.plafondTaux) ?? 0,
  partFixe: nombreOuRien(p.partFixe) ?? 0,
  tranchesZone: p.tranchesZone.map((t) => ({
    jusqua: nombreOuRien(t.jusqua) ?? 0,
    pourcentage: nombreOuRien(t.pourcentage) ?? 0,
  })),
});

/** Ce qui renomme une aide : la fenêtre du nom, ou rien. */
type Renommage = { cle: string; personnalisee: boolean; nom: string } | null;

/**
 * Cheptel › Réglages : les coefficients UGB de chaque espèce de l'exploitation (ceux proposés sont indicatifs) et les aides (PAC,
 * ICHN…) : on coche celles qu'on touche, avec leur montant et ce sur quoi il s'applique (l'UGB, l'animal ou l'hectare). Chaque aide se
 * renomme d'un crayon, et on peut en ajouter d'autres, qui comptent comme les autres dans la prime prévisionnelle. Tout s'enregistre
 * tout seul ; le bilan annuel en tire l'UGB et la prime prévisionnels. Les aides sont propres à l'année et à l'espèce choisies (les
 * montants changent chaque année) : elles se reprennent de l'année précédente tant qu'on ne les modifie pas.
 */
function ContenuCheptel({ annee, espece }: { annee: number; espece: string }) {
  const { settings, loaded, patchSettings, setAnneeActive } = useAppSettings();
  const infos = settings.exploitation;
  /** Les aides de l'année et de l'espèce choisies : ce qu'on voit et modifie. */
  const infosAides = infosPourAnnee(infos, annee, espece);
  const especes = especesActives();
  const [annees, setAnnees] = useState<number[]>([annee]);
  useEffect(() => {
    toutesLesAnneesConnues().then(setAnnees);
  }, []);

  const depart = (): Saisie => ({
    associes: enTexte(infosAides?.ugbPrimes?.associes ?? 1),
    stabilisateur: enTexte(stabilisateurDpb(infos, annee)),
    reductionBudgetaire: enTexte(reductionBudgetaireDpb(infos, annee) || undefined),
    coefficients: Object.fromEntries(
      especes.map((e) => {
        const choisis = infos?.ugbPrimes?.coefficients?.[e];
        return [e, { adulte: enTexte(choisis?.adulte), petit: enTexte(choisis?.petit) }];
      }),
    ),
    primes: Object.fromEntries(
      PRIMES.filter((p) => primeValablePour(p.cle, espece)).map((p) => {
        const reglage = infosAides?.ugbPrimes?.primes?.[p.cle];
        return [
          p.cle,
          {
            actif: !!reglage?.actif,
            taux: enTexte(reglage?.taux),
            base: baseDeLaPrime(infosAides, p.cle),
            nom: reglage?.nom ?? '',
            ...plafondsEnTexte(infosAides, p.cle),
          },
        ];
      }),
    ),
    personnalisees: (infosAides?.ugbPrimes?.personnalisees ?? []).map((p) => ({
      id: p.id,
      nom: p.nom,
      actif: !!p.actif,
      taux: enTexte(p.taux),
      base: baseDeLaPrime(infosAides, p.id),
      ...plafondsEnTexte(infosAides, p.id),
    })),
  });
  /** Les hectares admissibles de l'année (les parcelles des contrôles de surface) : de quoi calculer le paiement de base avant réduction. */
  const [hectares, setHectares] = useState(0);
  // Relues à chaque retour sur l'écran : des parcelles modifiées entre-temps changent le paiement de base.
  useFocusEffect(
    useCallback(() => {
      listControles(annee).then((controles) =>
        setHectares(
          totauxSurfaces(controles.filter((c) => c.famille === FAMILLE_CONTROLE.TERRAIN && !c.typeDocument))
            .surfaceAdmissible,
        ),
      );
    }, [annee]),
  );
  const [saisie, setSaisie] = useState<Saisie>(depart);
  const [renommage, setRenommage] = useState<Renommage>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  /** L'aide dépliée (son identifiant) : toutes sont enroulées au départ, et une seule est visible à la fois. */
  const [aideOuverte, setAideOuverte] = useState<string | null>(null);
  /** L'espèce dont les coefficients sont dépliés : toutes sont enroulées au départ, et une seule est visible à la fois. */
  const [especeOuverte, setEspeceOuverte] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  useEffect(() => {
    // Chargement initial unique depuis les réglages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setSaisie(depart());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const enregistrer = async (): Promise<boolean> => {
    await patchSettings({
      exploitation: {
        ...infos,
        ugbPrimes: {
          ...infos?.ugbPrimes,
          coefficients: Object.fromEntries(
            Object.entries(saisie.coefficients).map(([e, c]) => [
              e,
              { adulte: nombreOuRien(c.adulte), petit: nombreOuRien(c.petit) },
            ]),
          ),
          stabilisateurs: {
            ...infos?.ugbPrimes?.stabilisateurs,
            [String(annee)]: nombreOuRien(saisie.stabilisateur) ?? STABILISATEUR_NEUTRE,
          },
          reductionsBudgetaires: {
            ...infos?.ugbPrimes?.reductionsBudgetaires,
            [String(annee)]: nombreOuRien(saisie.reductionBudgetaire) ?? 0,
          },
          parAnnee: {
            ...infos?.ugbPrimes?.parAnnee,
            [cleAides(annee, espece)]: {
              associes: Math.max(1, Math.round(nombreOuRien(saisie.associes) ?? 1)),
              primes: Object.fromEntries(
                Object.entries(saisie.primes).map(([cle, p]) => [
                  cle,
                  {
                    actif: p.actif,
                    taux: nombreOuRien(p.taux),
                    base: p.base,
                    nom: p.nom.trim() || undefined,
                    ...plafondsEnNombres(p),
                  },
                ]),
              ),
              personnalisees: saisie.personnalisees.map((p) => ({
                id: p.id,
                nom: p.nom,
                actif: p.actif,
                taux: nombreOuRien(p.taux),
                base: p.base,
                ...plafondsEnNombres(p),
              })),
            },
          },
        },
      },
    });
    return true;
  };

  useEnregistrementAuto({ actif: loaded, signature: JSON.stringify(saisie), enregistrer });

  /** Les aides telles qu'on les saisit à l'instant (avant même leur enregistrement) : ce qui se calcule à l'écran suit chaque frappe. */
  const infosSaisies: InfosExploitation = {
    ...infos,
    ugbPrimes: {
      ...infos?.ugbPrimes,
      associes: Math.max(1, Math.round(nombreOuRien(saisie.associes) ?? 1)),
      primes: Object.fromEntries(
        Object.entries(saisie.primes).map(([cle, p]) => [
          cle,
          { actif: p.actif, taux: nombreOuRien(p.taux), base: p.base, ...plafondsEnNombres(p) },
        ]),
      ),
      personnalisees: [],
    },
  };
  /** Le paiement de base de l'année avant toute réduction (il se calcule à l'hectare, d'après la saisie en cours) : la réduction pour plafonnement budgétaire s'en déduit, à chaque frappe. */
  const dpbAvantReduction = primesPrevisionnelles(infosSaisies, { ugb: 0, tetes: 0, hectares }).lignes.find(
    (l) => l.cle === 'dpb' && l.base === BASE_PRIME.HECTARE,
  )?.montantAvantStabilisateur;
  /** Ce que le stabilisateur retire du paiement de base : la réduction pour plafonnement budgétaire, calculée (non modifiable). */
  const reductionDuStabilisateurSaisi =
    dpbAvantReduction === undefined
      ? undefined
      : reductionDuStabilisateur(
          dpbAvantReduction,
          nombreOuRien(saisie.stabilisateur) ?? STABILISATEUR_NEUTRE,
        );

  /** Ce que retirerait la réduction pour plafonnement budgétaire saisie (un pourcentage du paiement avant réduction). */
  const reductionBudgetaireSaisie =
    dpbAvantReduction === undefined
      ? undefined
      : Math.round(((dpbAvantReduction * (nombreOuRien(saisie.reductionBudgetaire) ?? 0)) / 100) * 100) / 100;
  const montantOuTiret = (montant: number | undefined) =>
    montant === undefined ? '—' : formatMontant(montant);

  const majAide = (cle: string, personnalisee: boolean, patch: Partial<SaisieAide>) =>
    setSaisie((s) =>
      personnalisee
        ? { ...s, personnalisees: s.personnalisees.map((p) => (p.id === cle ? { ...p, ...patch } : p)) }
        : { ...s, primes: { ...s.primes, [cle]: { ...s.primes[cle], ...patch } } },
    );

  /** Modifie une tranche d'une aide d'office dégressive. */
  const majTranche = (cle: string, index: number, patch: Partial<{ jusqua: string; pourcentage: string }>) =>
    setSaisie((s) => ({
      ...s,
      primes: {
        ...s.primes,
        [cle]: {
          ...s.primes[cle],
          tranchesZone: s.primes[cle].tranchesZone.map((t, i) => (i === index ? { ...t, ...patch } : t)),
        },
      },
    }));

  /** Un champ de plafond : un nombre, vide pour « sans plafond ». */
  const champPlafond = (
    label: string,
    valeur: string,
    onChange: (valeur: string) => void,
    explication?: string,
  ) => (
    <FormField
      key={label}
      label={label}
      value={valeur}
      onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && onChange(v)}
      keyboardType="decimal-pad"
      placeholder={T.sansPlafond}
      explication={explication}
    />
  );

  /** Une aide : son nom (avec le crayon qui le change), sa case, sa base et son montant. */
  const carteAide = (
    cle: string,
    personnalisee: boolean,
    nom: string,
    aide: string | undefined,
    aideSaisie: SaisieAide,
  ) => {
    // Sur ordinateur, toutes les aides sont dépliées.
    const ouverte = estBureau() || aideOuverte === cle;
    return (
      <Card key={cle}>
        <View style={commonStyles.rowSpaceBetween}>
          <Pressable
            style={[commonStyles.rowCentre, commonStyles.flex1]}
            onPress={() => setAideOuverte((actuelle) => (actuelle === cle ? null : cle))}
          >
            <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{nom}</Text>
            {aideSaisie.actif ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
            {estBureau() ? null : (
              <Ionicons name={ouverte ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            )}
          </Pressable>
          <Pressable
            onPress={() => setRenommage({ cle, personnalisee, nom })}
            hitSlop={8}
            accessibilityLabel={T.renommer}
          >
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>
        {ouverte ? (
          <>
            {aide ? <Text style={commonStyles.note}>{aide}</Text> : null}
            <Checkbox
              label={T.compter}
              value={aideSaisie.actif}
              onChange={(actif) => majAide(cle, personnalisee, { actif })}
            />
            {aideSaisie.actif ? (
              <>
                <SelectField
                  label={T.calculeSur}
                  value={aideSaisie.base}
                  onChange={(base) => majAide(cle, personnalisee, { base })}
                  options={Object.values(BASE_PRIME).map((valeur) => ({
                    value: valeur,
                    label: T.bases[valeur],
                  }))}
                />
                <FormField
                  label={`${!personnalisee && REGLES_PRIMES[cle as keyof typeof REGLES_PRIMES]?.tranchesZone ? T.tauxZone : T.taux} par ${T.unites[aideSaisie.base as keyof typeof T.unites]}`}
                  value={aideSaisie.taux}
                  onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && majAide(cle, personnalisee, { taux: v })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  explication={personnalisee ? undefined : T.primes[cle as keyof typeof T.primes].ouTrouver}
                />
                {/* L'ICHN : un second niveau de montagne (très haute montagne), avec ses hectares ; le calcul pondère les deux zones par leur surface. */}
                {!personnalisee && REGLES_PRIMES[cle as keyof typeof REGLES_PRIMES]?.tranchesZone ? (
                  <>
                    {ZONES_ICHN_A_MONTANT.map((zone) => (
                      <FormField
                        key={zone}
                        label={T.tauxDeLaZone(LABEL_ZONE_ICHN[zone])}
                        value={aideSaisie.tauxParZone[zone] ?? ''}
                        onChangeText={(v) =>
                          /^\d*[.,]?\d*$/.test(v) &&
                          majAide(cle, personnalisee, {
                            tauxParZone: { ...aideSaisie.tauxParZone, [zone]: v },
                          })
                        }
                        keyboardType="decimal-pad"
                        placeholder={String(MONTANT_ICHN_PAR_ZONE[zone]).replace('.', ',')}
                        explication={zone === ZONE_ICHN.HAUTE_MONTAGNE_SECHE ? T.zonesAide : undefined}
                      />
                    ))}
                    <FormField
                      label={T.majoration}
                      value={aideSaisie.majoration}
                      onChangeText={(v) =>
                        /^\d*[.,]?\d*$/.test(v) && majAide(cle, personnalisee, { majoration: v })
                      }
                      keyboardType="decimal-pad"
                      placeholder={T.sansMajoration}
                      explication={T.majorationAide}
                    />
                  </>
                ) : null}
                {/* Le paiement de base : le stabilisateur de l'année se règle ; la réduction pour plafonnement budgétaire s'en déduit. */}
                {!personnalisee && cle === 'dpb' ? (
                  <>
                    <FormField
                      label={T.stabilisateur}
                      value={saisie.stabilisateur}
                      onChangeText={(v) =>
                        /^\d*[.,]?\d*$/.test(v) && setSaisie((x) => ({ ...x, stabilisateur: v }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="100"
                      explication={T.stabilisateurAide}
                    />
                    {/* La réduction du relevé : la plus élevée des deux, d'elle et de celle du stabilisateur, s'applique. */}
                    <FormField
                      label={T.reductionBudgetaire}
                      value={saisie.reductionBudgetaire}
                      onChangeText={(v) =>
                        /^\d*[.,]?\d*$/.test(v) && setSaisie((x) => ({ ...x, reductionBudgetaire: v }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                      explication={T.reductionBudgetaireAide}
                    />
                    <View style={commonStyles.gap6}>
                      <View style={commonStyles.rowSpaceBetween}>
                        <Text style={commonStyles.note}>{T.calculeSurStabilisateur}</Text>
                        <Text style={commonStyles.note}>{montantOuTiret(reductionDuStabilisateurSaisi)}</Text>
                      </View>
                      <View style={commonStyles.rowSpaceBetween}>
                        <Text style={commonStyles.note}>{T.calculeSurPlafonnement}</Text>
                        <Text style={commonStyles.note}>{montantOuTiret(reductionBudgetaireSaisie)}</Text>
                      </View>
                      <View style={commonStyles.rowSpaceBetween}>
                        <Text style={commonStyles.lineSemiBold}>{T.reductionRetenue}</Text>
                        <Text style={commonStyles.lineSemiBold}>
                          {montantOuTiret(
                            reductionDuStabilisateurSaisi === undefined ||
                              reductionBudgetaireSaisie === undefined
                              ? undefined
                              : Math.max(reductionDuStabilisateurSaisi, reductionBudgetaireSaisie),
                          )}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}
                {/* Les plafonds : quantité maximale comptée, seuil minimal et montant unitaire maximal (vide : sans). */}
                {champPlafond(
                  `${T.plafond} (${T.unitesQuantite[aideSaisie.base as keyof typeof T.unitesQuantite]})`,
                  aideSaisie.plafond,
                  (plafond) => majAide(cle, personnalisee, { plafond }),
                  personnalisee ? undefined : T.primes[cle as keyof typeof T.primes].plafondAide,
                )}
                {champPlafond(
                  `${T.minimum} (${T.unitesQuantite[aideSaisie.base as keyof typeof T.unitesQuantite]})`,
                  aideSaisie.minimum,
                  (minimum) => majAide(cle, personnalisee, { minimum }),
                )}
                {champPlafond(T.plafondTaux, aideSaisie.plafondTaux, (plafondTaux) =>
                  majAide(cle, personnalisee, { plafondTaux }),
                )}
                {/* Une aide dégressive (l'ICHN) : la part payée par tranche d'hectares. */}
                {!personnalisee && REGLES_PRIMES[cle as keyof typeof REGLES_PRIMES]?.tranchesZone ? (
                  <View style={commonStyles.gap6}>
                    {champPlafond(T.partFixe, aideSaisie.partFixe, (partFixe) =>
                      majAide(cle, personnalisee, { partFixe }),
                    )}
                    <Text style={commonStyles.lineSemiBold}>{T.tranchesTitre}</Text>
                    {aideSaisie.tranchesZone.map((tranche, index) => (
                      <View key={index} style={commonStyles.row}>
                        <View style={commonStyles.flex1}>
                          <FormField
                            label={T.jusqua}
                            value={tranche.jusqua}
                            onChangeText={(v) =>
                              /^\d*[.,]?\d*$/.test(v) && majTranche(cle, index, { jusqua: v })
                            }
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={commonStyles.flex1}>
                          <FormField
                            label={T.partPayee}
                            value={tranche.pourcentage}
                            onChangeText={(v) =>
                              /^\d*[.,]?\d*$/.test(v) && majTranche(cle, index, { pourcentage: v })
                            }
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
            {personnalisee ? (
              <Button variant="danger" label={T.supprimer} onPress={() => setASupprimer(cle)} />
            ) : null}
          </>
        ) : null}
      </Card>
    );
  };

  return (
    <>
      <Text style={styles.titreSection}>{T.ugbTitre}</Text>
      <Text style={styles.aide}>{T.ugbAide}</Text>
      {especes.map((especeCoef) => {
        const parDefaut = coefficientsUgb(undefined, especeCoef);
        const c = saisie.coefficients[especeCoef] ?? { adulte: '', petit: '' };
        const maj = (patch: Partial<{ adulte: string; petit: string }>) =>
          setSaisie((s) => ({ ...s, coefficients: { ...s.coefficients, [especeCoef]: { ...c, ...patch } } }));
        const ouverte = estBureau() || especeOuverte === especeCoef;
        return (
          <Card key={especeCoef}>
            <Pressable
              style={commonStyles.rowCentre}
              onPress={() => setEspeceOuverte((actuelle) => (actuelle === especeCoef ? null : especeCoef))}
            >
              <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>
                {LABEL_ACTIVITE_COMPTABLE[especeCoef]}
              </Text>
              {estBureau() ? null : (
                <Ionicons name={ouverte ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              )}
            </Pressable>
            {ouverte ? (
              <>
                <FormField
                  label={T.coefAdulte}
                  value={c.adulte}
                  onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && maj({ adulte: v })}
                  keyboardType="decimal-pad"
                  placeholder={String(parDefaut.adulte).replace('.', ',')}
                />
                <FormField
                  label={T.coefPetit}
                  value={c.petit}
                  onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && maj({ petit: v })}
                  keyboardType="decimal-pad"
                  placeholder={String(parDefaut.petit).replace('.', ',')}
                />
              </>
            ) : null}
          </Card>
        );
      })}

      <Text style={styles.titreSection}>{T.primesTitre}</Text>
      <Text style={styles.aide}>{T.primesAide}</Text>
      {/* Les aides sont propres à l'année et à l'espèce : leurs montants changent chaque année. */}
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>
      <Text style={styles.aide}>{T.parAnnee}</Text>
      <Card>
        <FormField
          label={T.associes}
          value={saisie.associes}
          onChangeText={(v) => /^\d*$/.test(v) && setSaisie((s) => ({ ...s, associes: v }))}
          keyboardType="number-pad"
          placeholder="1"
          explication={T.associesAide}
        />
      </Card>
      {PRIMES.filter((p) => primeValablePour(p.cle, espece)).map((p) => {
        const aide = saisie.primes[p.cle] ?? {
          actif: false,
          taux: '',
          base: p.base,
          nom: '',
          plafond: '',
          minimum: '',
          plafondTaux: '',
          partFixe: '',
          tranchesZone: [],
        };
        return carteAide(p.cle, false, aide.nom.trim() || T.primes[p.cle].titre, T.primes[p.cle].aide, aide);
      })}
      {saisie.personnalisees.map((p) => carteAide(p.id, true, p.nom, T.personnalisee, p))}
      <Button variant="secondary" label={T.ajouter} onPress={() => setAjoutOuvert(true)} />

      <NomModal
        visible={!!renommage}
        titre={T.renommer}
        valeurInitiale={renommage?.nom ?? ''}
        placeholder={T.exempleNom}
        onValider={(nom) => {
          if (renommage) majAide(renommage.cle, renommage.personnalisee, { nom });
          setRenommage(null);
        }}
        onAnnuler={() => setRenommage(null)}
      />
      <NomModal
        visible={ajoutOuvert}
        titre={T.nomAide}
        placeholder={T.exempleNom}
        onValider={(nom) => {
          setSaisie((s) => ({
            ...s,
            personnalisees: [
              ...s.personnalisees,
              {
                id: generateId(),
                nom,
                actif: true,
                taux: '',
                base: BASE_PRIME.HECTARE,
                plafond: '',
                minimum: '',
                plafondTaux: '',
                partFixe: '',
                tauxParZone: {},
                majoration: '',
                tranchesZone: [],
              },
            ],
          }));
          setAjoutOuvert(false);
        }}
        onAnnuler={() => setAjoutOuvert(false)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.supprimerQuestion}
        message={T.supprimerMessage}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={() => {
          setSaisie((s) => ({ ...s, personnalisees: s.personnalisees.filter((p) => p.id !== aSupprimer) }));
          setASupprimer(null);
        }}
      />
    </>
  );
}

/**
 * Organisation › Cheptel : l'écran, dont le contenu est refait à chaque changement d'année ou d'espèce (chacune a ses aides, et
 * l'enregistrement automatique repart de ce qui est affiché).
 */
export default function ReglagesCheptel() {
  const { settings } = useAppSettings();
  const { espece } = useEtablissement();
  return (
    <Screen>
      <ContenuCheptel
        key={`${settings.anneeActive}:${espece}`}
        annee={settings.anneeActive}
        espece={espece}
      />
      {/* Remettre dans le cheptel les animaux dont la vente a disparu. */}
      <MiseAJourCheptel />
    </Screen>
  );
}
