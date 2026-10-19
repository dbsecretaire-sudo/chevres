import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionsFerme } from '@/features/accueil/ferme/ActionsFerme';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { CarteFerme } from '@/features/accueil/ferme/CarteFerme';
import { MenuFerme, MinuteursFerme } from '@/features/accueil/ferme/CotesFerme';
import { OutilsFerme } from '@/features/accueil/ferme/OutilsFerme';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { NomFerme } from '@/features/accueil/ferme/NomFerme';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { estBureau } from '@/shared/utils/plateforme';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { colors } from '@/shared/theme/colors';

/**
 * L'accueil « ferme » de l'élevage : un bandeau comme celui d'un jeu (la balance, les boucles, l'aliment), le nom de l'établissement, puis
 * la carte de la ferme qu'on fait glisser du doigt. Par-dessus la carte, les minuteurs à gauche et les boutons flottants à droite restent
 * fixes ; en bas, les actions de tous les jours. Une fenêtre annonce une fois par jour ce qui attend.
 */
export default function AccueilFerme() {
  const f = useFermeAccueil();
  // Sans en-tête, le contenu commence sous l'encoche et la barre d'état.
  const { top: haut } = useSafeAreaInsets();
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const [estiveOuverte, setEstiveOuverte] = useState(false);
  const jour = useFenetreDuJour(f.minuteurs, f.stats !== null);
  return (
    <View style={styles.racine}>
      <View style={[styles.haut, estBureau() ? null : { paddingTop: 12 + haut }]}>
        <View style={styles.colonne}>
          <BandeauFerme balance={f.stats?.soldeFactures} boucles={f.boucles} aliments={f.aliments} />
          {estBureau() ? null : <NomFerme />}
          <RappelSauvegarde />
        </View>
      </View>
      <View style={styles.zone}>
        <CarteFerme
          vedettes={f.vedettes}
          nombreAnimaux={f.stats?.totalVivantes}
          naissances={f.stats?.cabritsAnnee}
          lotsAFacturer={f.lotsAFacturer}
          lotsARappeler={f.lotsARappeler}
          estive={f.estive}
        />
        {/* Les menus flottants : fixes par-dessus la carte ; chaque colonne défile seule quand l'écran est court. */}
        <View style={[styles.flottant, styles.gauche]} pointerEvents="box-none">
          <ScrollView contentContainerStyle={styles.pile} showsVerticalScrollIndicator={false}>
            <MinuteursFerme
              minuteurs={f.minuteurs.slice(0, 5)}
              nombreDeRappels={f.nombreDeRappels}
              papiers={f.papiers}
              onOuvrirRappels={() => setRappelsOuverts(true)}
              bas={<OutilsFerme annees={f.annees} annee={f.annee} onChoisirAnnee={f.setAnneeActive} />}
            />
          </ScrollView>
        </View>
        <View style={[styles.flottant, styles.droite]} pointerEvents="box-none">
          <ScrollView contentContainerStyle={styles.pile} showsVerticalScrollIndicator={false}>
            <MenuFerme onEstive={() => setEstiveOuverte(true)} />
          </ScrollView>
        </View>
      </View>
      <ActionsFerme />
      <FenetreEstive visible={estiveOuverte} annee={f.annee} onClose={() => setEstiveOuverte(false)} />
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
  haut: { paddingHorizontal: 12, paddingBottom: 8 },
  colonne: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 8 },
  zone: { flex: 1, overflow: 'hidden' },
  flottant: { position: 'absolute', top: 0, bottom: 0, width: 76 },
  gauche: { left: 4 },
  droite: { right: 4 },
  pile: { paddingVertical: 8, alignItems: 'center' },
});
