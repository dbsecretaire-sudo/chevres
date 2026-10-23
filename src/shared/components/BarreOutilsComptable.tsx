import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useBandeauFerme } from '@/features/accueil/ferme/useBandeauFerme';
import { FeuilleRappels } from '@/features/accueil/ferme/FenetresFerme';
import { SelecteursFerme } from '@/features/accueil/ferme/SelecteursFerme';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { BoutonEnregistrer } from '@/features/sauvegarde/components/BoutonEnregistrer';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { BoutonPlat, SeparateurDeBarre } from '@/shared/components/BoutonPlat';
import { LOCALE } from '@/shared/constants/format';
import { ROUTES } from '@/shared/constants/routes';
import { effacerOrigine } from '@/shared/navigation/origineRetour';
import { viderLaPile } from '@/shared/navigation/pileDesOnglets';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const montant = (valeur: number) => `${Math.round(valeur).toLocaleString(LOCALE)} €`;

/**
 * La barre d'outils du poste de comptabilité (affichage sobre, grande fenêtre), au-dessus de tous les écrans : à gauche l'accueil, l'année, l'animal, le didacticiel et
 * l'enregistrement ; à droite le solde de l'année, les boucles posées et les rappels. Une barre fine de boutons rectangulaires, pas de capsules.
 */
export function BarreOutilsComptable() {
  const router = useRouter();
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const { balance, boucles, rappels } = useBandeauFerme();
  const { actif, ouvrirSelecteur } = useEtablissement();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  useFocusEffect(
    useCallback(() => {
      toutesLesAnneesConnues()
        .then(setAnnees)
        .catch(() => undefined);
    }, []),
  );
  return (
    <View style={styles.barre}>
      <BoutonPlat
        icone="home-outline"
        libelle={TEXTES.navigation.layout.accueil}
        onPress={() => {
          effacerOrigine();
          // Un retour à l'accueil oublie les pages vues : on repart de zéro.
          viderLaPile();
          router.navigate(ROUTES.accueilFerme() as never);
        }}
      />
      <SeparateurDeBarre />
      <SelecteursFerme
        annees={annees}
        annee={settings.anneeActive}
        onChoisirAnnee={setAnneeActive}
        tout={!!settings.toutesAnnees}
        onChoisirTout={choisirToutesAnnees}
        forme="plat"
      />
      <SeparateurDeBarre />
      <BoutonDidacticiel forme="plat" />
      <BoutonEnregistrer plat />
      <SeparateurDeBarre />
      {/* Le nom de l'établissement : un appui ouvre le choix de l'établissement. */}
      <BoutonPlat
        icone="business-outline"
        libelle={actif.nom}
        accessibilityLabel={TEXTES.etablissements.selecteurEtablissement.changerDEtablissement}
        onPress={ouvrirSelecteur}
      />
      <View style={styles.espace} />
      <BoutonPlat
        icone="cash-outline"
        libelle={`Solde : ${balance === undefined ? '…' : montant(balance)}`}
        couleur={balance === undefined || balance === 0 ? colors.text : balance < 0 ? colors.danger : colors.success}
        onPress={() => router.push(ROUTES.COMPTABILITE_LISTE as never)}
      />
      <BoutonPlat
        icone="pricetag-outline"
        libelle={`Boucles : ${boucles === undefined ? '…' : boucles.boucles}${boucles?.tiptag ? ` (+${boucles.tiptag})` : ''}`}
        onPress={() => router.push(ROUTES.lieu('boucles') as never)}
      />
      <BoutonPlat
        icone="notifications-outline"
        libelle={`Rappels : ${rappels}`}
        couleur={rappels ? colors.danger : colors.text}
        onPress={() => setRappelsOuverts(true)}
      />
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  espace: { flex: 1 },
});
