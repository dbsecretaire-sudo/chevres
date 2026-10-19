import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActionsFerme } from '@/features/accueil/ferme/ActionsFerme';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { MenuFerme, MinuteursFerme } from '@/features/accueil/ferme/CotesFerme';
import { OutilsFerme } from '@/features/accueil/ferme/OutilsFerme';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { ProgressionFerme } from '@/features/accueil/ferme/ProgressionFerme';
import { ScenePrincipale } from '@/features/accueil/ferme/ScenePrincipale';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { colors } from '@/shared/theme/colors';

/**
 * L'accueil « ferme » de l'élevage : un bandeau comme celui d'un jeu (la balance, les animaux, l'aliment), la barre des papiers de l'année,
 * les minuteurs à gauche, la ferme au centre et les boutons flottants à droite, puis les actions de tous les jours en bas. Une fenêtre
 * annonce une fois par jour ce qui attend.
 */
export default function AccueilFerme() {
  const f = useFermeAccueil();
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const jour = useFenetreDuJour(f.minuteurs, f.stats !== null);
  return (
    <View style={styles.racine}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
          <View style={styles.colonne}>
            <BandeauFerme balance={f.stats?.soldeFactures} nombreAnimaux={f.stats?.totalVivantes} naissances={f.stats?.cabritsAnnee} aliments={f.aliments} />
            <ProgressionFerme faits={f.papiers.faits} total={f.papiers.total} prochaine={f.prochaine} onOuvrir={() => setRappelsOuverts(true)} />
            <RappelSauvegarde />
            <View style={styles.corps}>
              <MinuteursFerme
                minuteurs={f.minuteurs.slice(0, 5)}
                nombreDeRappels={f.nombreDeRappels}
                onOuvrirRappels={() => setRappelsOuverts(true)}
                bas={<OutilsFerme annees={f.annees} annee={f.annee} onChoisirAnnee={f.setAnneeActive} />}
              />
              <ScenePrincipale
                vedettes={f.vedettes}
                nombreAnimaux={f.stats?.totalVivantes}
                naissances={f.stats?.cabritsAnnee}
                lotsAFacturer={f.lotsAFacturer}
                lotsARappeler={f.lotsARappeler}
              />
              <MenuFerme />
            </View>
          </View>
        </ScrollView>
        <ActionsFerme />
      </View>
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
      <FenetreDuJour
        minuteurs={f.minuteurs}
        ouverte={jour.ouverte}
        onCompris={jour.compris}
        onPlusTard={jour.plusTard}
        onVoirTout={() => {
          jour.compris();
          setRappelsOuverts(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1 },
  contenu: { padding: 12, paddingBottom: 20 },
  colonne: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 10 },
  corps: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
