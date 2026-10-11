import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { baseDeLaPrime, coefficientsUgb } from '@/features/cheptel/services/ugb';
import { BASE_PRIME, PRIMES } from '@/shared/constants/primes';
import { especesActives } from '@/shared/dictionnaire/animaux';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { colors } from '@/shared/theme/colors';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/exploitation/InformationsExploitation.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.ugbPrimes;

/** Une aide à l'écran : sa case, son montant (en texte) et sa base ; `nom` seulement pour une aide ajoutée ou renommée. */
interface SaisieAide {
  actif: boolean;
  taux: string;
  base: string;
  nom: string;
}

/** Ce qu'on saisit : un coefficient par espèce (adulte, petit), les aides d'office par clé, et les aides ajoutées. */
interface Saisie {
  coefficients: Record<string, { adulte: string; petit: string }>;
  primes: Record<string, SaisieAide>;
  personnalisees: (SaisieAide & { id: string })[];
}

/** Un nombre saisi en texte (rien quand le champ est vide : la valeur d'office s'applique). */
const nombreOuRien = (texte: string): number | undefined => (texte.trim() ? parseDecimal(texte) : undefined);
const enTexte = (valeur: number | undefined): string =>
  valeur === undefined ? '' : String(valeur).replace('.', ',');

/** Ce qui renomme une aide : la fenêtre du nom, ou rien. */
type Renommage = { cle: string; personnalisee: boolean; nom: string } | null;

/**
 * Organisation › Cheptel : les coefficients UGB de chaque espèce de l'exploitation (ceux proposés sont indicatifs) et les aides (PAC,
 * ICHN…) : on coche celles qu'on touche, avec leur montant et ce sur quoi il s'applique (l'UGB, l'animal ou l'hectare). Chaque aide se
 * renomme d'un crayon, et on peut en ajouter d'autres, qui comptent comme les autres dans la prime prévisionnelle. Tout s'enregistre
 * tout seul ; le bilan annuel en tire l'UGB et la prime prévisionnels.
 */
export default function RubriqueCheptel() {
  const { settings, loaded, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const especes = especesActives();

  const depart = (): Saisie => ({
    coefficients: Object.fromEntries(
      especes.map((e) => {
        const choisis = infos?.ugbPrimes?.coefficients?.[e];
        return [e, { adulte: enTexte(choisis?.adulte), petit: enTexte(choisis?.petit) }];
      }),
    ),
    primes: Object.fromEntries(
      PRIMES.map((p) => {
        const reglage = infos?.ugbPrimes?.primes?.[p.cle];
        return [
          p.cle,
          {
            actif: !!reglage?.actif,
            taux: enTexte(reglage?.taux),
            base: baseDeLaPrime(infos, p.cle),
            nom: reglage?.nom ?? '',
          },
        ];
      }),
    ),
    personnalisees: (infos?.ugbPrimes?.personnalisees ?? []).map((p) => ({
      id: p.id,
      nom: p.nom,
      actif: !!p.actif,
      taux: enTexte(p.taux),
      base: baseDeLaPrime(infos, p.id),
    })),
  });
  const [saisie, setSaisie] = useState<Saisie>(depart);
  const [renommage, setRenommage] = useState<Renommage>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
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
          coefficients: Object.fromEntries(
            Object.entries(saisie.coefficients).map(([e, c]) => [
              e,
              { adulte: nombreOuRien(c.adulte), petit: nombreOuRien(c.petit) },
            ]),
          ),
          primes: Object.fromEntries(
            Object.entries(saisie.primes).map(([cle, p]) => [
              cle,
              { actif: p.actif, taux: nombreOuRien(p.taux), base: p.base, nom: p.nom.trim() || undefined },
            ]),
          ),
          personnalisees: saisie.personnalisees.map((p) => ({
            id: p.id,
            nom: p.nom,
            actif: p.actif,
            taux: nombreOuRien(p.taux),
            base: p.base,
          })),
        },
      },
    });
    return true;
  };

  useEnregistrementAuto({ actif: loaded, signature: JSON.stringify(saisie), enregistrer });

  const majAide = (cle: string, personnalisee: boolean, patch: Partial<SaisieAide>) =>
    setSaisie((s) =>
      personnalisee
        ? { ...s, personnalisees: s.personnalisees.map((p) => (p.id === cle ? { ...p, ...patch } : p)) }
        : { ...s, primes: { ...s.primes, [cle]: { ...s.primes[cle], ...patch } } },
    );

  /** Une aide : son nom (avec le crayon qui le change), sa case, sa base et son montant. */
  const carteAide = (
    cle: string,
    personnalisee: boolean,
    nom: string,
    aide: string | undefined,
    aideSaisie: SaisieAide,
  ) => (
    <Card key={cle}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{nom}</Text>
        <Pressable
          onPress={() => setRenommage({ cle, personnalisee, nom })}
          hitSlop={8}
          accessibilityLabel={T.renommer}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>
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
            options={Object.values(BASE_PRIME).map((valeur) => ({ value: valeur, label: T.bases[valeur] }))}
          />
          <FormField
            label={`${T.taux} par ${T.unites[aideSaisie.base as keyof typeof T.unites]}`}
            value={aideSaisie.taux}
            onChangeText={(v) => /^\d*[.,]?\d*$/.test(v) && majAide(cle, personnalisee, { taux: v })}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </>
      ) : null}
      {personnalisee ? (
        <Button variant="danger" label={T.supprimer} onPress={() => setASupprimer(cle)} />
      ) : null}
    </Card>
  );

  return (
    <Screen>
      <Text style={styles.titreSection}>{T.ugbTitre}</Text>
      <Text style={styles.aide}>{T.ugbAide}</Text>
      {especes.map((espece) => {
        const parDefaut = coefficientsUgb(undefined, espece);
        const c = saisie.coefficients[espece] ?? { adulte: '', petit: '' };
        const maj = (patch: Partial<{ adulte: string; petit: string }>) =>
          setSaisie((s) => ({ ...s, coefficients: { ...s.coefficients, [espece]: { ...c, ...patch } } }));
        return (
          <Card key={espece}>
            <Text style={commonStyles.cardTitle}>{LABEL_ACTIVITE_COMPTABLE[espece]}</Text>
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
          </Card>
        );
      })}

      <Text style={styles.titreSection}>{T.primesTitre}</Text>
      <Text style={styles.aide}>{T.primesAide}</Text>
      {PRIMES.map((p) => {
        const aide = saisie.primes[p.cle] ?? { actif: false, taux: '', base: p.base, nom: '' };
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
              { id: generateId(), nom, actif: true, taux: '', base: BASE_PRIME.HECTARE },
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
    </Screen>
  );
}
