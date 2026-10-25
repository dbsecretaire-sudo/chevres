import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import type { VisiteAgritourisme } from '@/features/commercial/types';
import { STATUT_VISITE } from '@/shared/constants/agritourisme';
import { Card } from '@/shared/components/Card';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme.simple;

/**
 * Les groupes à venir, en cartes : le nom du groupe, le jour de la visite et le nombre de personnes, du plus proche au plus lointain.
 * Ce sont les visites prévues (un groupe, une visite) : rien d'autre à saisir ici, la visite se crée dans « Nouvelle visite ».
 */
export default function GroupesSimple() {
  const [groupes, setGroupes] = useState<VisiteAgritourisme[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      lireArchiveCommercial()
        .then((archive) =>
          setGroupes(
            archive.visites
              .filter((v) => v.statut === STATUT_VISITE.PREVUE)
              .sort((a, b) => a.date.localeCompare(b.date)),
          ),
        )
        .catch(() => undefined);
    }, []),
  );

  return (
    <ScrollView contentContainerStyle={commonStyles.gap10}>
      {groupes !== null && groupes.length === 0 ? <Text style={commonStyles.muted}>Aucun groupe à venir.</Text> : null}
      {(groupes ?? []).map((g) => (
        <Card key={g.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.text }}>{g.client}</Text>
            <Text style={commonStyles.muted}>{T.nPersonnes(g.participants)}</Text>
          </View>
          <Text style={commonStyles.muted}>{formatDateFR(g.date)}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}
