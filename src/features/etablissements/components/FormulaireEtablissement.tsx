import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { FormField } from '@/shared/components/FormField';
import type { DonneesEtablissement } from '@/features/etablissements/repository';
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
  onValider: (donnees: DonneesEtablissement) => void;
  onAnnuler: () => void;
  /** Présent seulement quand l'établissement peut être supprimé. */
  onSupprimer?: () => void;
}

/** Nom et types (animaux, société) d'un établissement — sert à la création et à la modification. */
export function FormulaireEtablissement({
  initial,
  titre,
  libelleValider,
  onValider,
  onAnnuler,
  onSupprimer,
}: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [animaux, setAnimaux] = useState(initial?.animaux ?? []);
  const [activites, setActivites] = useState(initial?.activites ?? []);

  const t = TEXTES.etablissements;

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

      <Text style={commonStyles.labelMuted}>
        {t.typeEtablissement.typeDEtablissement} — {t.typeEtablissement.plusieursChoixPossibles}
      </Text>

      <Text style={styles.groupeTitre}>{t.typeEtablissement.animaux}</Text>
      {Object.values(TYPE_ANIMAL_ETABLISSEMENT).map((animal) => (
        <Checkbox
          key={animal}
          label={LABEL_TYPE_ANIMAL_ETABLISSEMENT[animal]}
          value={animaux.includes(animal)}
          onChange={() => setAnimaux((prev) => basculer(prev, animal))}
        />
      ))}

      <Text style={styles.groupeTitre}>{t.typeEtablissement.societe}</Text>
      {Object.values(ACTIVITE_SOCIETE).map((activite) => (
        <Checkbox
          key={activite}
          label={LABEL_ACTIVITE_SOCIETE[activite]}
          value={activites.includes(activite)}
          onChange={() => setActivites((prev) => basculer(prev, activite))}
        />
      ))}

      <Button
        label={libelleValider}
        disabled={!nom.trim()}
        onPress={() => onValider({ nom, animaux, activites })}
      />
      <View style={commonStyles.row}>
        <Button
          style={commonStyles.flex1}
          variant="secondary"
          label={TEXTES.commun.general.annuler}
          onPress={onAnnuler}
        />
        {onSupprimer && (
          <Button
            style={commonStyles.flex1}
            variant="danger"
            label={TEXTES.commun.general.supprimerDefinitivement}
            onPress={onSupprimer}
          />
        )}
      </View>
    </Card>
  );
}
