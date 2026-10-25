import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { TUILES_VISITES } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { Ionicons } from '@expo/vector-icons';
import { TuileMaquette } from '@/shared/components/TuileMaquette';
import { colors } from '@/shared/theme/colors';

/**
 * La rubrique Visites, en tuiles comme sur la maquette : la visite à créer d'abord (en vert), puis les visites du jour, les encaissements, les repas, les groupes
 * et les tarifs. Les tuiles viennent du registre des rubriques, que Windows reprend aussi.
 */
export default function EcranVisites() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: colors.background }}>
      <View>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Visites</Text>
        <Text style={{ color: colors.textMuted }}>Agritourisme</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {TUILES_VISITES.map((t) => (
          <TuileMaquette
            key={t.libelle}
            variante="avance"
            libelle={t.libelle}
            detail={t.aide}
            principale={t.principale === true}
            icone={(couleur) => <Ionicons name={t.icone} size={32} color={couleur} />}
            onPress={() => router.push(t.route as never)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
