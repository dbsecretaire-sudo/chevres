import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestionEspeces } from '@/features/especes/components/GestionEspeces';
import { toutesLesEspeces } from '@/features/especes/services/registre';
import { colors } from '@/shared/theme/colors';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { ActiviteSociete, DonneesEtablissement } from '@/features/etablissements/repository';
import { basculer } from '@/features/etablissements/utils/typesEtablissement';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { LABEL_ACTIVITE_SOCIETE, LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/etablissements/SelecteurEtablissement.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** Absent à la création. */
  initial?: DonneesEtablissement;
  titre: string;
  libelleValider: string;
  onValider: (donnees: DonneesEtablissement) => void | Promise<void>;
  /** Une validation est en cours : le bouton est bloqué pour éviter un double envoi. */
  enCours?: boolean;
  onAnnuler: () => void;
}

/** Les types proposés par le menu déroulant, dans l'ordre : l'élevage d'abord, puis les activités, puis l'usage personnel. */
const TYPES_PROPOSES: ActiviteSociete[] = [
  ACTIVITE_SOCIETE.AGRICOLE,
  ACTIVITE_SOCIETE.PRESTATIONS_SERVICE,
  ACTIVITE_SOCIETE.ASSOCIATION,
  ACTIVITE_SOCIETE.LIBERAL,
  ACTIVITE_SOCIETE.PERSO,
];

/** Le type affiché d'un établissement déjà enregistré : « Agriculture » s'il élève des animaux, sinon sa première activité. */
function typeInitial(initial?: DonneesEtablissement): ActiviteSociete | '' {
  if (!initial) return '';
  if ((initial.animaux?.length ?? 0) > 0) return ACTIVITE_SOCIETE.AGRICOLE;
  return initial.activites?.find((a) => TYPES_PROPOSES.includes(a)) ?? '';
}

/**
 * Nom et type d'un établissement — sert à la création et à la modification. Le type se choisit dans un menu déroulant ;
 * pour l'élevage, on coche ensuite les espèces élevées.
 */
export function FormulaireEtablissement({
  initial,
  titre,
  libelleValider,
  onValider,
  enCours,
  onAnnuler,
}: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [type, setType] = useState<ActiviteSociete | ''>(typeInitial(initial));
  const [animaux, setAnimaux] = useState(initial?.animaux ?? []);
  /** La fenêtre des espèces (le +) : on y ajoute une espèce ou on modifie les noms et les âges de celles qui existent. */
  const [especesOuvert, setEspecesOuvert] = useState(false);
  const [, setVersionEspeces] = useState(0);

  const t = TEXTES.etablissements;
  const agricole = type === ACTIVITE_SOCIETE.AGRICOLE;

  /**
   * Un établissement créé avec plusieurs activités à la fois (avant ce menu) les garde tant qu'on ne change pas son
   * type : le menu n'en montre qu'une, et l'enregistrer tel quel ne doit pas en effacer.
   */
  const gardeSesActivites =
    !!initial && (initial.activites?.length ?? 0) > 1 && !agricole && type === typeInitial(initial);

  const valider = () => {
    if (agricole) {
      void onValider({ nom, animaux, activites: [ACTIVITE_SOCIETE.AGRICOLE] });
    } else if (gardeSesActivites) {
      void onValider({ nom, animaux: [], activites: initial?.activites });
    } else {
      void onValider({ nom, animaux: [], activites: type ? [type] : [] });
    }
  };

  return (
    <Card>
      <Text style={commonStyles.cardTitle}>{titre}</Text>
      <FormField
        label={t.selecteurEtablissement.nomDeLEtablissement}
        required
        value={nom}
        onChangeText={setNom}
        placeholder={t.selecteurEtablissement.nomExElevageDesHauts}
      />

      <SelectField<string>
        label={t.typeEtablissement.typeDEtablissement}
        required={!initial}
        value={type}
        placeholder={t.typeEtablissement.choisirUnType}
        options={TYPES_PROPOSES.map((a) => ({ value: a, label: LABEL_ACTIVITE_SOCIETE[a] }))}
        onChange={(valeur) => {
          setType(valeur as ActiviteSociete);
          if (valeur !== ACTIVITE_SOCIETE.AGRICOLE) setAnimaux([]);
        }}
      />

      {agricole && (
        <View style={commonStyles.gap6}>
          <View style={commonStyles.rowSpaceBetween}>
            <Text style={[styles.groupeTitre, commonStyles.flex1]}>
              {t.typeEtablissement.especesElevees} — {t.typeEtablissement.plusieursChoixPossibles}
            </Text>
            <Pressable
              onPress={() => setEspecesOuvert(true)}
              hitSlop={8}
              accessibilityLabel={TEXTES.especes.nouvelle}
            >
              <Ionicons name="add-circle" size={30} color={colors.ajout} />
            </Pressable>
          </View>
          {toutesLesEspeces().map((animal) => (
            <Checkbox
              key={animal}
              label={LABEL_TYPE_ANIMAL_ETABLISSEMENT[animal]}
              value={animaux.includes(animal)}
              onChange={() => setAnimaux(basculer(animaux, animal))}
            />
          ))}
        </View>
      )}

      <GestionEspeces
        visible={especesOuvert}
        onChange={() => setVersionEspeces((v) => v + 1)}
        onFermer={() => setEspecesOuvert(false)}
      />

      <Button
        label={libelleValider}
        disabled={!nom.trim() || (!initial && !type)}
        loading={enCours}
        onPress={valider}
      />
      <Button variant="secondary" label={TEXTES.commun.general.annuler} onPress={onAnnuler} />
    </Card>
  );
}
