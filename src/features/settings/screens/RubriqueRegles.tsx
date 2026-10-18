import { useState } from 'react';
import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { reglesDeLApplication } from '@/features/settings/services/reglesApplication';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

/**
 * Organisation › Réglages : toutes les règles que l'application applique aujourd'hui, par domaine. Chaque domaine est enroulé, un seul se
 * déroule à la fois (même sur ordinateur). C'est un état des lieux ; les règles qui se personnalisent s’y règleront plus tard.
 */
export default function RubriqueRegles() {
  const groupes = reglesDeLApplication();
  const [ouvert, setOuvert] = useState<string | null>(null);
  return (
    <Screen>
      <Text style={commonStyles.note}>{T.aideRegles}</Text>
      {groupes.map((groupe) => (
        <SectionDeroulante
          key={groupe.id}
          titre={groupe.titre}
          nombre={groupe.regles.length}
          accordeon
          ouverte={ouvert === groupe.id}
          onBasculer={() => setOuvert((actuel) => (actuel === groupe.id ? null : groupe.id))}
        >
          {groupe.regles.map((regle) => (
            <Card key={regle.id}>
              <Text style={commonStyles.lineBold}>{regle.titre}</Text>
              <Text style={commonStyles.line}>{regle.texte}</Text>
            </Card>
          ))}
        </SectionDeroulante>
      ))}
    </Screen>
  );
}
