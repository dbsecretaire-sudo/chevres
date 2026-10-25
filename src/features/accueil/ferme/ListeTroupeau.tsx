import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { filtrerCheptel, chiffresCheptel, type FiltreCheptel } from '@/features/berger/services/cheptelSimple';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { ROUTES } from '@/shared/constants/routes';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { LABEL_SEXE } from '@/shared/textes/libelles';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const T = TEXTES.roles.berger;

/** Le jaune de l'étiquette de boucle, comme sur la maquette. */
const JAUNE_BOUCLE = '#E8C547';

const FILTRES: { cle: FiltreCheptel; libelle: string }[] = [
  { cle: 'toutes', libelle: T.cheptelFiltreToutes },
  { cle: 'femelles', libelle: T.cheptelFiltreFemelles },
  { cle: 'males', libelle: T.cheptelFiltreMales },
  { cle: 'chevrettes', libelle: T.cheptelFiltreChevrettes },
];

/**
 * La liste du troupeau, comme sur la maquette : le compteur (les vivantes et les nées de l'année) en vert, la recherche par boucle, les filtres en pastilles,
 * puis une ligne par animal, la boucle sur une étiquette jaune. Un appui ouvre la fiche de l'animal.
 */
export function ListeTroupeau() {
  // L'espèce active : la liste se relit quand elle change.
  const { espece } = useEtablissement();
  const ouvrir = useOuvrir();
  const [vivants, setVivants] = useState<Chevre[]>([]);
  const [filtre, setFiltre] = useState<FiltreCheptel>('toutes');
  const [recherche, setRecherche] = useState('');
  useFocusEffect(
    useCallback(() => {
      listChevresVivantes()
        .then(setVivants)
        .catch(() => undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- l'espèce change ce que la liste renvoie : on relit alors le troupeau
    }, [espece]),
  );

  const aujourdhui = todayISO();
  const animaux = useMemo(() => filtrerCheptel(vivants, filtre, recherche, aujourdhui), [vivants, filtre, recherche, aujourdhui]);
  const chiffres = chiffresCheptel(vivants, new Date().getFullYear());

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 14 }}>
        <Text style={{ color: colors.blanc, fontSize: 18, fontWeight: '800' }}>{T.cheptelBandeau(chiffres.vivantes, chiffres.nees)}</Text>
      </View>
      <TextInput
        value={recherche}
        onChangeText={setRecherche}
        placeholder={T.cheptelRecherche}
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: colors.text,
        }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTRES.map((f) => {
          const actif = filtre === f.cle;
          return (
            <Pressable
              key={f.cle}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              onPress={() => setFiltre(f.cle)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: actif ? colors.primary : colors.border,
                backgroundColor: actif ? colors.primary : colors.surface,
              }}
            >
              <Text style={{ fontWeight: '600', color: actif ? colors.blanc : colors.text }}>{f.libelle}</Text>
            </Pressable>
          );
        })}
      </View>
      {animaux.map((a) => (
        <Pressable
          key={a.id}
          accessibilityRole="button"
          onPress={() => ouvrir(ROUTES.ficheChevre(a.id))}
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
          <View style={{ backgroundColor: JAUNE_BOUCLE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{a.numeroBoucle || '—'}</Text>
          </View>
          <Text style={{ flex: 1, color: colors.textMuted }}>
            {`${LABEL_SEXE[a.sexe]}${a.dateNaissance ? ` · ${formatDateFR(a.dateNaissance)}` : ''}`}
          </Text>
        </Pressable>
      ))}
      {animaux.length === 0 ? <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{T.cheptelAucun}</Text> : null}
    </ScrollView>
  );
}
