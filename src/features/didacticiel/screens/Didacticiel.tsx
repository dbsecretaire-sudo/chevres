import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useVisiteGuidee } from '@/features/didacticiel/context/VisiteGuidee';
import { Screen } from '@/shared/components/Screen';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { didacticielDeLApplication } from '@/features/didacticiel/services/didacticiel';
import { parcoursDeCas } from '@/features/didacticiel/services/parcours';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.didacticiel;

/**
 * Le didacticiel : toutes les options de l'application, onglet par onglet. Chaque onglet est enroulé (un seul se déroule à la fois) ;
 * une option dit où la trouver et ce qu'elle fait, et un appui sur « Ouvrir » mène à son écran.
 */
export default function Didacticiel() {
  const router = useRouter();
  const { demarrer, demarrerParcours } = useVisiteGuidee();
  const parcours = parcoursDeCas();
  const chapitres = didacticielDeLApplication();
  const [ouvert, setOuvert] = useState<string | null>(null);
  /** Le parcours de cas déroulé (un seul à la fois). */
  const [cas, setCas] = useState<string | null>(null);
  return (
    <Screen>
      <Text style={commonStyles.note}>{T.aideVisite}</Text>
      <Button label={T.commencer} onPress={demarrer} />
      <Text style={commonStyles.note}>{T.aide}</Text>
      {/* Les parcours de cas : chaque cas se lit pas à pas, ou se parcourt en visite guidée. */}
      <SectionDeroulante
        titre={T.parcours.titre}
        nombre={parcours.length}
        accordeon
        ouverte={ouvert === 'parcours'}
        onBasculer={() => setOuvert((actuel) => (actuel === 'parcours' ? null : 'parcours'))}
      >
        <Text style={commonStyles.note}>{T.parcours.presentation}</Text>
        {parcours.map((p) => (
          <SectionDeroulante
            key={p.id}
            titre={p.titre}
            nombre={p.etapes.length}
            accordeon
            ouverte={cas === p.id}
            onBasculer={() => setCas((actuel) => (actuel === p.id ? null : p.id))}
          >
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
          </SectionDeroulante>
        ))}
      </SectionDeroulante>
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
