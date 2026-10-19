import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useVisiteGuidee } from '@/features/didacticiel/context/VisiteGuidee';
import { Screen } from '@/shared/components/Screen';
import { parcoursDeCas } from '@/features/didacticiel/services/parcours';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.didacticiel;

/**
 * Le didacticiel : les parcours de cas, tous déroulés l'un sous l'autre. Chaque parcours suit un cas du quotidien étape par étape (le chemin
 * dans les menus, ce qu'on y fait, et un appui sur « Ouvrir » mène à son écran), ou se parcourt en visite guidée.
 */
export default function Didacticiel() {
  const router = useRouter();
  const { demarrer, demarrerParcours } = useVisiteGuidee();
  const parcours = parcoursDeCas();
  return (
    <Screen>
      <Text style={commonStyles.note}>{T.aideVisite}</Text>
      <Button label={T.commencer} onPress={demarrer} />
      <Text style={commonStyles.note}>{T.aide}</Text>
      <Text style={commonStyles.note}>{T.parcours.presentation}</Text>
      {parcours.map((p) => (
        <Card key={p.id}>
          <Text style={commonStyles.cardTitle}>{p.titre}</Text>
          <Text style={commonStyles.note}>{p.resume}</Text>
          <Button label={T.parcours.lancer} onPress={() => demarrerParcours(p.id)} />
          {p.etapes.map((etape) => (
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
          ))}
        </Card>
      ))}
    </Screen>
  );
}
