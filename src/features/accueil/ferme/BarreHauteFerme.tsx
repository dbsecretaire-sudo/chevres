import { useCallback, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { BoutonEnregistrer } from '@/features/sauvegarde/components/BoutonEnregistrer';
import { SelecteursFerme } from '@/features/accueil/ferme/SelecteursFerme';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { PastilleMenus } from '@/shared/components/PastilleMenus';
import { useEchelle } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { colors } from '@/shared/theme/colors';

/** La largeur estimée d'une lettre de la capsule (en gras, à 14 points), et ce que prennent ses marges, ses écarts et le bouton de sauvegarde. */
const LARGEUR_D_UNE_LETTRE = 7.3;
const MARGES_DE_LA_CAPSULE = 135;

/**
 * La capsule du haut de toutes les pages du téléphone : l'année, l'espèce, le didacticiel et « Menus », qui déroule les rubriques (Cheptel,
 * Production, Commercial, Comptabilité, Organisation). On les touche moins que le bandeau du bas (la maison, la balance, les rappels) : ils sont
 * dans la zone du haut, que le pouce atteint le moins bien.
 */
export function BarreHauteFerme({ sansMenus = false }: { sansMenus?: boolean }) {
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const { espece } = useEtablissement();
  const { width } = useWindowDimensions();
  const echelle = useEchelle();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  // Les années connues, relues à chaque retour sur l'écran.
  useFocusEffect(
    useCallback(() => {
      toutesLesAnneesConnues()
        .then(setAnnees)
        .catch(() => undefined);
    }, []),
  );
  // La capsule a-t-elle la place de tous ses mots ? (l'année, l'animal, « Didacticiel », « Menus » et leurs marges, estimés d'après leurs lettres) ; sinon « Menus » devient un burger.
  const lettres =
    (settings.toutesAnnees ? TEXTES.commun.choix.toutesAnnees : String(settings.anneeActive)).length +
    (LABEL_TYPE_ANIMAL_ETABLISSEMENT[espece] ?? espece).length +
    TEXTES.didacticiel.titre.length +
    TEXTES.navigation.menus.length +
    2;
  // Sur un petit écran les mots ne rapetissent pas assez pour tenir : seule la place compte (l'échelle ne fait que grandir la capsule sur un grand écran).
  const besoin = Math.max(1, echelle) * (lettres * LARGEUR_D_UNE_LETTRE + MARGES_DE_LA_CAPSULE);
  const compact = besoin > width - 24;
  return (
    <View style={styles.barre}>
      <SelecteursFerme
        annees={annees}
        annee={settings.anneeActive}
        onChoisirAnnee={setAnneeActive}
        tout={!!settings.toutesAnnees}
        onChoisirTout={choisirToutesAnnees}
        forme="pastille"
      />
      <BoutonDidacticiel forme="pastille" />
      <BoutonEnregistrer />
      {/* La disposition « comptable » a son menu en arbre à gauche : pas de pastille « Menus ». */}
      {sansMenus ? null : <PastilleMenus compact={compact} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // La même capsule verte que le bandeau du bas, avec ses pastilles blanches.
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    padding: 6,
  },
});
