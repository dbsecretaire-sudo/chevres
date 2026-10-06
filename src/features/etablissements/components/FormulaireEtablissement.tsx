import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import type { ActiviteSociete, DonneesEtablissement } from '@/features/etablissements/repository';
import { basculer } from '@/features/etablissements/utils/typesEtablissement';
import { ACTIVITE_SOCIETE, TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
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
          <Text style={styles.groupeTitre}>
            {t.typeEtablissement.especesElevees} — {t.typeEtablissement.plusieursChoixPossibles}
          </Text>
          {Object.values(TYPE_ANIMAL_ETABLISSEMENT).map((animal) => (
            <Checkbox
              key={animal}
              label={LABEL_TYPE_ANIMAL_ETABLISSEMENT[animal]}
              value={animaux.includes(animal)}
              onChange={() => setAnimaux(basculer(animaux, animal))}
            />
          ))}
        </View>
      )}

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
