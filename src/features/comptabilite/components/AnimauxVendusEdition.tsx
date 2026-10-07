import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/shared/components/Card';
import { SelectModal } from '@/shared/components/SelectModal';
import { estPetitLe, getChevre, listAnimauxVivantsDe } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import type { Vente } from '@/features/comptabilite/types';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { libelleAnimalVendu, roleDuDetailDeVente } from '@/features/comptabilite/utils/animauxVendus';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { SEPARATEUR_ANIMAUX } from '@/shared/constants/comptabilite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ROLE_VIANDE } from '@/shared/constants/stock';
import { especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  form: Vente;
  onChange: (form: Vente) => void;
}

/**
 * Les animaux d'une vente en cours de modification : obligatoires (étoile rouge) pour un animal sur pied, vivant ou un petit,
 * on en ajoute avec le + parmi les animaux vivants de l'espèce de la vente — les petits pour la ligne des petits, les adultes
 * pour les autres — et on en retire avec la croix. Rien quand le détail de la vente n'est pas un animal.
 */
export function AnimauxVendusEdition({ form, onChange }: Props) {
  const activite = activiteVente(form);
  const espece = (activite === ACTIVITE_COMMUNE ? especeCourante() : activite) as EspeceAnimale;
  const [role, setRole] = useState<string | undefined>();
  const [vivants, setVivants] = useState<Chevre[]>([]);
  const [choisis, setChoisis] = useState<Chevre[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const ids = idsDesAnimaux(form);
  const cle = ids.join(SEPARATEUR_ANIMAUX);

  useEffect(() => {
    roleDuDetailDeVente(activite, form.precision).then(setRole);
  }, [activite, form.precision]);

  useFocusEffect(
    useCallback(() => {
      listAnimauxVivantsDe(espece).then(setVivants);
    }, [espece]),
  );

  useEffect(() => {
    Promise.all(cle.split(SEPARATEUR_ANIMAUX).filter(Boolean).map(getChevre)).then((trouves) =>
      setChoisis(trouves.filter((a): a is Chevre => !!a)),
    );
  }, [cle]);

  if (!role) return null;
  const petits = role === ROLE_VIANDE.JEUNE;
  const proposes = vivants.filter((a) => !ids.includes(a.id) && estPetitLe(a, form.date) === petits);

  const appliquer = (liste: Chevre[]) =>
    onChange({
      ...form,
      animaux: liste.length > 0 ? liste.map((a) => a.id).join(SEPARATEUR_ANIMAUX) : undefined,
      quantite: Math.max(1, liste.length),
      jeune: liste.length > 0 && petits ? true : undefined,
    });

  return (
    <View style={commonStyles.gap6}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.lineSemiBold}>
          {T.animauxVendus}
          <Text style={commonStyles.required}> *</Text>
        </Text>
        <Pressable
          style={commonStyles.boutonPastille}
          onPress={() => setOuvert(true)}
          accessibilityLabel={T.ajouterUnAnimal}
        >
          <Ionicons name="add-circle" size={28} color={colors.ajout} />
        </Pressable>
      </View>
      {choisis.length > 0 ? (
        <Card style={commonStyles.gap10}>
          {choisis.map((animal) => (
            <View key={animal.id} style={commonStyles.rowSpaceBetween}>
              <Text style={commonStyles.valueText}>{libelleAnimalVendu(animal)}</Text>
              <Pressable
                onPress={() => appliquer(choisis.filter((a) => a.id !== animal.id))}
                hitSlop={8}
                accessibilityLabel={T.retirerAnimal}
              >
                <Ionicons name="close-circle" size={22} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}
      <SelectModal<string>
        visible={ouvert}
        titre={T.animalVendu(form.precision ?? '')}
        value=""
        options={proposes.map((a) => ({ value: a.id, label: libelleAnimalVendu(a) }))}
        onSelect={(id) => {
          const animal = proposes.find((a) => a.id === id);
          if (animal) appliquer([...choisis, animal]);
          setOuvert(false);
        }}
        onClose={() => setOuvert(false)}
        searchable
      />
    </View>
  );
}
