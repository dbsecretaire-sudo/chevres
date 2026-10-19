import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SchemaParcours } from '@/features/didacticiel/components/SchemaParcours';
import { Card } from '@/shared/components/Card';
import { useVisiteGuidee } from '@/features/didacticiel/context/VisiteGuidee';
import { Screen } from '@/shared/components/Screen';
import { parcoursDeCas } from '@/features/didacticiel/services/parcours';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.didacticiel;

/**
 * Le didacticiel : les parcours de cas, une carte chacun. Sous son titre, la carte dit ce que couvre le parcours et lance sa visite guidée ;
 * la flèche déroule ses étapes (le chemin dans les menus, ce qu'on y fait, et « Ouvrir » mène à l'écran).
 */
export default function Didacticiel() {
  const router = useRouter();
  const { demarrerParcours } = useVisiteGuidee();
  const parcours = parcoursDeCas();
  /** Les parcours dont les étapes sont déroulées. */
  const [deroules, setDeroules] = useState<ReadonlySet<string>>(new Set());
  const basculer = (id: string) =>
    setDeroules((avant) => {
      const apres = new Set(avant);
      if (!apres.delete(id)) apres.add(id);
      return apres;
    });
  return (
    <Screen>
      {parcours.map((p) => {
        const ouvert = deroules.has(p.id);
        return (
          <Card key={p.id}>
            <Pressable onPress={() => basculer(p.id)} accessibilityRole="button" accessibilityState={{ expanded: ouvert }}>
              <View style={commonStyles.rowSpaceBetween}>
                <Text style={[commonStyles.cardTitle, commonStyles.flex1]}>{p.titre}</Text>
                <Ionicons name={ouvert ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
              </View>
            </Pressable>
            <Text style={commonStyles.note}>{p.resume}</Text>
            {/* Le parcours en pictogrammes, et de quoi le lancer en visite guidée. */}
            <View style={styles.schema}>
              <SchemaParcours schema={p.schema} />
              <Pressable
                style={styles.lancer}
                onPress={() => demarrerParcours(p.id)}
                accessibilityRole="button"
                accessibilityLabel={T.parcours.lancerLeParcours(p.titre)}
              >
                <Text style={styles.lancerTexte}>{T.parcours.lancer}</Text>
                <Ionicons name="play" size={18} color={colors.blanc} />
              </Pressable>
            </View>
            {ouvert
              ? p.etapes.map((etape) => (
                  <Card key={etape.numero}>
                    <Text style={commonStyles.lineBold}>{`${etape.numero}. ${etape.titre}`}</Text>
                    {etape.chemin ? <Text style={commonStyles.muted}>{etape.chemin}</Text> : null}
                    <Text style={commonStyles.line}>{etape.texte}</Text>
                    {etape.route ? (
                      <Pressable onPress={() => router.push((etape.ouvrir ?? etape.route) as never)} hitSlop={8} accessibilityRole="link">
                        <Text style={commonStyles.lien}>{T.ouvrir}</Text>
                      </Pressable>
                    ) : null}
                  </Card>
                ))
              : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  schema: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lancer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  lancerTexte: { color: colors.blanc, fontSize: 16, fontWeight: '700' },
});
