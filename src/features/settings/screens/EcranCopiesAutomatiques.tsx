import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { pont, type CopieDonnees } from '@/bureau/pont';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.settings.reglages.copiesAutomatiques;

/** Le titre d'une copie : la date du jour pour une copie quotidienne, la date d'écriture pour une copie gardée avant une restauration. */
function titreDeLaCopie(copie: CopieDonnees): string {
  if (copie.nom.startsWith('donnees_avant-restauration')) {
    const quand = new Date(copie.modifiee).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
    return `${T.avantRestauration} · ${quand}`;
  }
  const jour = copie.nom.match(/^donnees_(\d{4}-\d{2}-\d{2})\.json$/)?.[1];
  return jour ? new Date(`${jour}T12:00:00`).toLocaleDateString('fr-FR', { dateStyle: 'full' }) : copie.nom;
}

/**
 * Les copies automatiques des données de la version Windows : une par jour, gardée trente jours sur cet ordinateur. On peut en restaurer une ;
 * les données actuelles sont alors gardées dans une copie « avant restauration », et l'application se rouvre.
 */
export default function EcranCopiesAutomatiques() {
  const [copies, setCopies] = useState<CopieDonnees[] | null>(null);

  useEffect(() => {
    pont()
      .copies.lister()
      .then(setCopies)
      .catch(() => setCopies([]));
  }, []);

  const restaurer = (copie: CopieDonnees) => {
    Alert.alert(T.confirmerTitre, T.confirmerTexte, [
      { text: T.annuler, style: 'cancel' },
      {
        text: T.restaurer,
        style: 'destructive',
        onPress: async () => {
          try {
            await pont().copies.restaurer(copie.nom);
            window.location.reload();
          } catch (erreur) {
            Alert.alert(T.erreurTitre, erreur instanceof Error ? erreur.message : String(erreur));
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.aide}>{T.aide}</Text>
      {copies !== null && copies.length === 0 ? <Text style={styles.aide}>{T.aucune}</Text> : null}
      {(copies ?? []).map((copie) => (
        <View key={copie.nom} style={styles.carte}>
          <View style={styles.texte}>
            <Text style={styles.titre}>{titreDeLaCopie(copie)}</Text>
            <Text style={styles.detail}>{`${T.rubriques(copie.rubriques)} · ${T.taille(copie.taille)}`}</Text>
          </View>
          <Button label={T.restaurer} variant="secondary" onPress={() => restaurer(copie)} />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  aide: { fontSize: 14, color: colors.textMuted },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  texte: { flex: 1, gap: 2 },
  titre: { fontSize: 16, fontWeight: '500', color: colors.text },
  detail: { fontSize: 14, color: colors.textMuted },
});
