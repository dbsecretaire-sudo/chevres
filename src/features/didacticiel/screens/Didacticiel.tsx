import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { didacticielDeLApplication } from '@/features/didacticiel/services/didacticiel';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.didacticiel;

/**
 * Le didacticiel : toutes les options de l'application, onglet par onglet. Chaque onglet est enroulé (un seul se déroule à la fois) ;
 * une option dit où la trouver et ce qu'elle fait, et un appui sur « Ouvrir » mène à son écran.
 */
export default function Didacticiel() {
  const router = useRouter();
  const chapitres = didacticielDeLApplication();
  const [ouvert, setOuvert] = useState<string | null>(null);
  return (
    <Screen>
      <Text style={commonStyles.note}>{T.aide}</Text>
      {chapitres.map((chapitre) => (
        <SectionDeroulante
          key={chapitre.id}
          titre={chapitre.titre}
          nombre={chapitre.etapes.length}
          accordeon
          ouverte={ouvert === chapitre.id}
          onBasculer={() => setOuvert((actuel) => (actuel === chapitre.id ? null : chapitre.id))}
        >
          <Text style={commonStyles.note}>{chapitre.presentation}</Text>
          {chapitre.etapes.map((etape) => (
            <Card key={etape.id}>
              <Text style={commonStyles.lineBold}>{etape.titre}</Text>
              {etape.chemin ? <Text style={commonStyles.muted}>{etape.chemin}</Text> : null}
              <Text style={commonStyles.line}>{etape.texte}</Text>
              {etape.route ? (
                <Pressable onPress={() => router.push(etape.route as never)} hitSlop={8} accessibilityRole="link">
                  <Text style={commonStyles.lien}>{T.ouvrir}</Text>
                </Pressable>
              ) : null}
            </Card>
          ))}
        </SectionDeroulante>
      ))}
    </Screen>
  );
}
