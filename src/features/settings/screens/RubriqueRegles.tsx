import { useState } from 'react';
import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Card } from '@/shared/components/Card';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { reglesDeLApplication } from '@/features/settings/services/reglesApplication';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages;

type Regle = ReturnType<typeof reglesDeLApplication>[number]['regles'][number];

/** Les colonnes du tableau d'un domaine (poste de comptabilité) : la règle, et ce que l'application fait ; le texte passe à la ligne, il n'est pas coupé. */
const COLONNES: readonly ColonneDuTableau<Regle>[] = [
  { cle: 'regle', titre: 'Règle', poids: 1.4, valeur: (r) => r.titre },
  {
    cle: 'detail',
    titre: 'Ce que l’application fait',
    poids: 3.6,
    valeur: (r) => r.texte,
    rendu: (r) => <Text style={{ fontSize: 13, color: colors.text }}>{r.texte}</Text>,
  },
];

/**
 * Organisation › Réglages : toutes les règles que l'application applique aujourd'hui, par domaine. Chaque domaine est enroulé, un seul se
 * déroule à la fois (même sur ordinateur). C'est un état des lieux ; les règles qui se personnalisent s’y règleront plus tard. Le poste de comptabilité
 * les montre en tableaux, un par domaine, tous visibles.
 */
export default function RubriqueRegles() {
  const groupes = reglesDeLApplication();
  const comptable = useDispositionComptable();
  const [ouvert, setOuvert] = useState<string | null>(null);
  if (comptable) {
    return (
      <Screen>
        <Text style={commonStyles.note}>{T.aideRegles}</Text>
        {groupes.map((groupe) => (
          <GroupeAccueil key={groupe.id} titre={`${groupe.titre} (${groupe.regles.length})`}>
            <TableauDeDonnees integre colonnes={COLONNES} lignes={groupe.regles} cleDeLaLigne={(r) => r.id} vide="" />
          </GroupeAccueil>
        ))}
      </Screen>
    );
  }
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
