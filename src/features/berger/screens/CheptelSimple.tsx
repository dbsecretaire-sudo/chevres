import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import type { Chevre } from '@/features/cheptel/types';
import { animauxDuTroupeau } from '@/features/berger/services/saisies';
import { chiffresCheptel, filtrerCheptel, type FiltreCheptel } from '@/features/berger/services/cheptelSimple';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { todayISO, yearOf } from '@/shared/utils/dates';

const T = TEXTES.roles.berger;

/** La couleur des boucles dans la liste (un repère jaune, comme la boucle sur l'oreille). */
const COULEUR_BOUCLE = '#F2C94C';

const FILTRES: { valeur: FiltreCheptel; libelle: string }[] = [
  { valeur: 'toutes', libelle: T.cheptelFiltreToutes },
  { valeur: 'femelles', libelle: T.cheptelFiltreFemelles },
  { valeur: 'males', libelle: T.cheptelFiltreMales },
  { valeur: 'chevrettes', libelle: T.cheptelFiltreChevrettes },
];

interface Props {
  /** Une chèvre de la liste est touchée : on ouvre sa fiche. */
  onOuvrir: (animal: Chevre) => void;
}

/** La liste des animaux vivants : un bandeau de chiffres, une recherche par boucle, des filtres, puis les animaux. */
export function CheptelSimple({ onOuvrir }: Props) {
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const [filtre, setFiltre] = useState<FiltreCheptel>('toutes');
  const [recherche, setRecherche] = useState('');
  const aujourdhui = todayISO();

  useEffect(() => {
    animauxDuTroupeau().then(setAnimaux).catch(() => setAnimaux([]));
  }, []);

  const chiffres = chiffresCheptel(animaux, yearOf(aujourdhui));
  const liste = filtrerCheptel(animaux, filtre, recherche, aujourdhui);

  return (
    <ScrollView contentContainerStyle={commonStyles.gap10}>
      <View style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 14 }}>
        <Text style={{ color: colors.blanc, fontSize: 16, fontWeight: '700' }}>{T.cheptelBandeau(chiffres.vivantes, chiffres.nees)}</Text>
      </View>

      <FormField label={T.cheptelRecherche} value={recherche} onChangeText={setRecherche} keyboardType="number-pad" />

      <View style={commonStyles.row}>
        {FILTRES.map(({ valeur, libelle }) => (
          <Pressable
            key={valeur}
            accessibilityRole="button"
            onPress={() => setFiltre(valeur)}
            style={[commonStyles.chip, valeur === filtre && { backgroundColor: colors.primary }]}
          >
            <Text style={[{ fontWeight: '600', color: colors.text }, valeur === filtre && commonStyles.textWhite]}>{libelle}</Text>
          </Pressable>
        ))}
      </View>

      {liste.length === 0 ? <Text style={commonStyles.muted}>{T.cheptelAucun}</Text> : null}

      {liste.map((animal) => (
        <Pressable
          key={animal.id}
          accessibilityRole="button"
          onPress={() => onOuvrir(animal)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 12,
          }}
        >
          <View style={{ backgroundColor: COULEUR_BOUCLE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{(animal.numeroBoucle ?? '').trim() || T.ficheSansBoucle}</Text>
          </View>
          <Text style={commonStyles.muted}>
            {T.ficheSexe(animal.sexe === 'F')}
            {animal.dateNaissance ? ` · ${T.ficheNee(animal.dateNaissance)}` : ''}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
