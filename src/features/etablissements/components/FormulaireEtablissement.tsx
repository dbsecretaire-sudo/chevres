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
}

/** Nom et types (animaux, société) d'un établissement — sert à la création et à la modification. */
export function FormulaireEtablissement({ initial, titre, libelleValider, onValider, onAnnuler }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [animaux, setAnimaux] = useState(initial?.animaux ?? []);
  const [activites, setActivites] = useState(initial?.activites ?? []);

  const t = TEXTES.etablissements;

  /** Dès qu'on élève des animaux, l'établissement est agricole : le groupe « Société » est grisé sur « Agriculture ». */
  const agricole = animaux.length > 0;

  /** « Perso » : case seule, exclusive — cochée, tout le reste est grisé et décoché. */
  const perso = activites.includes(ACTIVITE_SOCIETE.PERSO);

  /**
   * Libéral, prestations de service ou vente : une activité sans élevage, donc les animaux et « Agriculture »
   * sont grisés (et décochés). « Agriculture » seule n'y change rien : on peut ensuite choisir ses animaux.
   */
  const sansElevage =
    !agricole && activites.some((a) => a !== ACTIVITE_SOCIETE.AGRICOLE && a !== ACTIVITE_SOCIETE.PERSO);

  /** « Perso » n'est cochable que si rien d'autre ne l'est (animaux, Agriculture, libéral…). */
  const persoGrise = agricole || activites.some((a) => a !== ACTIVITE_SOCIETE.PERSO);

  const changerPerso = () => {
    setAnimaux([]);
    setActivites(perso ? [] : [ACTIVITE_SOCIETE.PERSO]);
  };

  const changerActivite = (activite: (typeof activites)[number]) => {
    const suivantes = basculer(activites, activite);
    if (suivantes.some((a) => a !== ACTIVITE_SOCIETE.AGRICOLE)) {
      setActivites(suivantes.filter((a) => a !== ACTIVITE_SOCIETE.AGRICOLE));
      setAnimaux([]);
    } else {
      setActivites(suivantes);
    }
  };

  const changerAnimal = (animal: (typeof animaux)[number]) => {
    const suivants = basculer(animaux, animal);
    setAnimaux(suivants);
    setActivites(suivants.length > 0 ? [ACTIVITE_SOCIETE.AGRICOLE] : []);
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

      <Text style={commonStyles.labelMuted}>
        {t.typeEtablissement.typeDEtablissement} — {t.typeEtablissement.plusieursChoixPossibles}
      </Text>

      <Text style={styles.groupeTitre}>{t.typeEtablissement.animaux}</Text>
      {Object.values(TYPE_ANIMAL_ETABLISSEMENT).map((animal) => (
        <Checkbox
          key={animal}
          label={LABEL_TYPE_ANIMAL_ETABLISSEMENT[animal]}
          value={animaux.includes(animal)}
          disabled={sansElevage || perso}
          onChange={() => changerAnimal(animal)}
        />
      ))}

      <Text style={styles.groupeTitre}>{t.typeEtablissement.societe}</Text>
      {Object.values(ACTIVITE_SOCIETE)
        .filter((activite) => activite !== ACTIVITE_SOCIETE.PERSO)
        .map((activite) => (
          <Checkbox
            key={activite}
            label={LABEL_ACTIVITE_SOCIETE[activite]}
            value={agricole ? activite === ACTIVITE_SOCIETE.AGRICOLE : activites.includes(activite)}
            disabled={perso || agricole || (sansElevage && activite === ACTIVITE_SOCIETE.AGRICOLE)}
            onChange={() => changerActivite(activite)}
          />
        ))}

      <View style={styles.caseSeule}>
        <Checkbox
          label={LABEL_ACTIVITE_SOCIETE[ACTIVITE_SOCIETE.PERSO]}
          value={perso}
          disabled={persoGrise}
          onChange={changerPerso}
        />
      </View>

      <Button
        label={libelleValider}
        disabled={!nom.trim()}
        onPress={() =>
          onValider({ nom, animaux, activites: agricole ? [ACTIVITE_SOCIETE.AGRICOLE] : activites })
        }
      />
      <Button variant="secondary" label={TEXTES.commun.general.annuler} onPress={onAnnuler} />
    </Card>
  );
}
