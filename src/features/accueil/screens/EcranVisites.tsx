import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { TUILES_VISITES } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { Ionicons } from '@expo/vector-icons';
import { TuileMaquette } from '@/shared/components/TuileMaquette';
import { colors } from '@/shared/theme/colors';

/**
 * La rubrique Visites, en tuiles comme sur la maquette : la visite à créer d'abord (en vert), puis les visites du jour, les encaissements, les repas, les groupes
 * et les tarifs. L'accueil du public est sous les tuiles, dans un menu, comme sur la page Chèvres. Les tuiles viennent du registre des rubriques, que Windows reprend aussi.
 */
export default function EcranVisites() {
  const router = useRouter();
  const tuiles = TUILES_VISITES.filter((t) => !t.menu);
  const menu = TUILES_VISITES.filter((t) => t.menu);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ backgroundColor: colors.background }}>
      {/* Le titre « Visites » est dans la capsule du haut ; la ligne ci-dessous dit de quelle activité il s'agit. */}
      <Text style={{ color: colors.textMuted }}>Agritourisme</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {tuiles.map((t) => (
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
      {menu.length > 0 ? (
        <GroupeAccueil titre="Autres">
          <BlocLignes>
            {menu.map((t) => (
              <ListRow key={t.libelle} title={t.libelle} subtitle={t.aide} icone={t.icone} onPress={() => router.push(t.route as never)} />
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ) : null}
    </ScrollView>
  );
}
