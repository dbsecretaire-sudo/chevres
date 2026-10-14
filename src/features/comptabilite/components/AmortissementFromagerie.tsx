import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { calculerAmortissement } from '@/features/comptabilite/services/amortissement';
import type { ReglageAmortissementFromagerie } from '@/features/settings/settings';
import { DUREE_AMORTISSEMENT_DEFAUT } from '@/shared/constants/lait';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.comptabilite.rentabilite.plan.amortissement;

type Mode = 'unique' | 'detail';

/** Un élément en cours de saisie (tout en texte, converti à l'enregistrement). */
interface ElementSaisi {
  id: string;
  libelle: string;
  montant: string;
  duree: string;
}

const enTexte = (valeur?: number): string => (valeur ? String(valeur).replace('.', ',') : '');

interface Props {
  reglage: ReglageAmortissementFromagerie | undefined;
  onEnregistrer: (reglage: ReglageAmortissementFromagerie) => void;
}

/**
 * L'amortissement de la fromagerie, dans la simulation : un montant unique ou le détail de ses éléments (avec leur durée), et le choix de
 * l'inclure ou non dans la simulation (et son PDF). Repliée tant qu'on n'y touche pas ; chaque modification est gardée.
 */
export function AmortissementFromagerie({ reglage, onEnregistrer }: Props) {
  const [deroule, setDeroule] = useState(!!reglage?.inclure);
  const [inclure, setInclure] = useState(!!reglage?.inclure);
  const [mode, setMode] = useState<Mode>(reglage?.detaille ? 'detail' : 'unique');
  const [montant, setMontant] = useState(enTexte(reglage?.montant));
  const [duree, setDuree] = useState(enTexte(reglage?.duree));
  const [elements, setElements] = useState<ElementSaisi[]>(
    (reglage?.elements ?? []).map((e) => ({
      id: e.id,
      libelle: e.libelle,
      montant: enTexte(e.montant),
      duree: enTexte(e.duree),
    })),
  );

  /** Ce qui est saisi, en nombres. */
  const versReglage = (
    suite: Partial<{
      inclure: boolean;
      mode: Mode;
      montant: string;
      duree: string;
      elements: ElementSaisi[];
    }> = {},
  ): ReglageAmortissementFromagerie => ({
    inclure: suite.inclure ?? inclure,
    detaille: (suite.mode ?? mode) === 'detail',
    montant: parseDecimal(suite.montant ?? montant) || undefined,
    duree: parseDecimal(suite.duree ?? duree) || undefined,
    elements: (suite.elements ?? elements).map((e) => ({
      id: e.id,
      libelle: e.libelle,
      montant: parseDecimal(e.montant) || undefined,
      duree: parseDecimal(e.duree) || undefined,
    })),
  });
  const enregistrer = (suite?: Parameters<typeof versReglage>[0]) => onEnregistrer(versReglage(suite));
  const calcul = calculerAmortissement(versReglage());

  const majElement = (id: string, patch: Partial<ElementSaisi>) =>
    setElements((actuels) => actuels.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <View style={commonStyles.gap6}>
      <Pressable onPress={() => setDeroule((ouvert) => !ouvert)} hitSlop={8}>
        <Text style={commonStyles.lien}>{deroule ? T.masquer : T.titre}</Text>
      </Pressable>
      {deroule ? (
        <View style={commonStyles.gap10}>
          <Checkbox
            label={T.inclure}
            value={inclure}
            onChange={(valeur) => {
              setInclure(valeur);
              enregistrer({ inclure: valeur });
            }}
          />
          <PucesDefilantes<Mode>
            puces={[
              { valeur: 'unique', label: T.modes.unique },
              { valeur: 'detail', label: T.modes.detail },
            ]}
            valeur={mode}
            onChoisir={(valeur) => {
              setMode(valeur);
              enregistrer({ mode: valeur });
            }}
          />
          {mode === 'unique' ? (
            <View style={commonStyles.rowFin}>
              <View style={commonStyles.flex2}>
                <FormField
                  label={T.montant}
                  value={montant}
                  onChangeText={setMontant}
                  onBlur={() => enregistrer()}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                />
              </View>
              <View style={commonStyles.flex1}>
                <FormField
                  label={T.duree}
                  value={duree}
                  onChangeText={setDuree}
                  onBlur={() => enregistrer()}
                  keyboardType="decimal-pad"
                  placeholder={String(DUREE_AMORTISSEMENT_DEFAUT)}
                />
              </View>
            </View>
          ) : (
            <View style={commonStyles.gap10}>
              {elements.map((e) => (
                <View key={e.id} style={commonStyles.gap6}>
                  <FormField
                    label={T.element}
                    value={e.libelle}
                    onChangeText={(texte) => majElement(e.id, { libelle: texte })}
                    onBlur={() => enregistrer()}
                    placeholder={T.exemple}
                  />
                  <View style={commonStyles.rowFin}>
                    <View style={commonStyles.flex2}>
                      <FormField
                        label={T.montantElement}
                        value={e.montant}
                        onChangeText={(texte) => majElement(e.id, { montant: texte })}
                        onBlur={() => enregistrer()}
                        keyboardType="decimal-pad"
                        placeholder="0,00"
                      />
                    </View>
                    <View style={commonStyles.flex1}>
                      <FormField
                        label={T.duree}
                        value={e.duree}
                        onChangeText={(texte) => majElement(e.id, { duree: texte })}
                        onBlur={() => enregistrer()}
                        keyboardType="decimal-pad"
                        placeholder={String(DUREE_AMORTISSEMENT_DEFAUT)}
                      />
                    </View>
                    <Pressable
                      style={commonStyles.boutonPastille}
                      onPress={() => {
                        const reste = elements.filter((x) => x.id !== e.id);
                        setElements(reste);
                        enregistrer({ elements: reste });
                      }}
                    >
                      <Ionicons name="close-circle" size={28} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
              <Pressable
                onPress={() => {
                  const suite = [...elements, { id: generateId(), libelle: '', montant: '', duree: '' }];
                  setElements(suite);
                  enregistrer({ elements: suite });
                }}
                hitSlop={8}
              >
                <Text style={commonStyles.lien}>{T.ajouter}</Text>
              </Pressable>
            </View>
          )}
          {calcul.annuel > 0 ? (
            <Text style={commonStyles.lineSemiBold}>
              {T.annuel(formatMontant(calcul.annuel), formatMontant(calcul.total))}
            </Text>
          ) : null}
          <Text style={commonStyles.note}>{T.aide}</Text>
        </View>
      ) : null}
    </View>
  );
}
