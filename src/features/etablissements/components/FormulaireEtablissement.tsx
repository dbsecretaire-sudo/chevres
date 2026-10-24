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
import type { DonneesEtablissement } from '@/features/etablissements/repository';
import { basculer } from '@/features/etablissements/utils/typesEtablissement';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';
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

/** Nom d'une exploitation et espèces élevées — sert à la création et à la modification. */
export function FormulaireEtablissement({
  initial,
  titre,
  libelleValider,
  onValider,
  enCours,
  onAnnuler,
}: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [animaux, setAnimaux] = useState(initial?.animaux ?? []);
  /** La fenêtre des espèces (le +) : on y ajoute une espèce ou on modifie les noms et les âges de celles qui existent. */
  const [especesOuvert, setEspecesOuvert] = useState(false);
  const [, setVersionEspeces] = useState(0);

  const t = TEXTES.etablissements;

  const valider = () => void onValider({ nom, animaux });

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

      <GestionEspeces
        visible={especesOuvert}
        onChange={() => setVersionEspeces((v) => v + 1)}
        onFermer={() => setEspecesOuvert(false)}
      />

      <Button label={libelleValider} disabled={!nom.trim()} loading={enCours} onPress={valider} />
      <Button variant="secondary" label={TEXTES.commun.general.annuler} onPress={onAnnuler} />
    </Card>
  );
}
