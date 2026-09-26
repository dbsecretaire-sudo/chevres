import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { useAjoutTabBarBleu } from '@/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/theme/AccentColorContext';
import type { Sexe } from '@/types/models';

type Etape = 'role' | 'details-mere';

const MAX_PETITS = 6;

export default function AjoutRapide() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>('role');
  const [nombrePetits, setNombrePetits] = useState(1);
  const [sexesPetits, setSexesPetits] = useState<Sexe[]>(['F']);

  const ajusterNombrePetits = (n: number) => {
    const borne = Math.max(1, Math.min(MAX_PETITS, n));
    setNombrePetits(borne);
    setSexesPetits((prev) => {
      const copie = [...prev];
      while (copie.length < borne) copie.push('F');
      copie.length = borne;
      return copie;
    });
  };

  const basculerSexe = (index: number) => {
    setSexesPetits((prev) => prev.map((s, i) => (i === index ? (s === 'F' ? 'M' : 'F') : s)));
  };

  if (etape === 'role') {
    return (
      <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <Text style={styles.question}>De qui s’agit-il ?</Text>

        <Pressable style={styles.choix} onPress={() => setEtape('details-mere')}>
          <Ionicons name="paw" size={26} color={colors.ajout} />
          <View style={styles.choixTexte}>
            <Text style={styles.choixTitre}>La mère</Text>
            <Text style={styles.choixSous}>Déclarer une naissance pour cette chèvre</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.choix}
          onPress={() => router.push({ pathname: '/cheptel/nouvelle', params: { sexe: 'F' } })}
        >
          <Ionicons name="female" size={26} color={colors.ajout} />
          <View style={styles.choixTexte}>
            <Text style={styles.choixTitre}>Une chèvre</Text>
            <Text style={styles.choixSous}>Ajouter cette femelle au cheptel</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.choix}
          onPress={() => router.push({ pathname: '/cheptel/nouvelle', params: { sexe: 'M' } })}
        >
          <Ionicons name="male" size={26} color={colors.ajout} />
          <View style={styles.choixTexte}>
            <Text style={styles.choixTitre}>Un bouc</Text>
            <Text style={styles.choixSous}>Ajouter ce mâle au cheptel</Text>
          </View>
        </Pressable>

        <Button label="Annuler" variant="secondary" onPress={() => router.back()} />
      </Screen>
      </AccentColorProvider>
    );
  }

  // details-mere
  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
    <Screen>
      <Text style={styles.question}>Combien de petits ?</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepperBouton} onPress={() => ajusterNombrePetits(nombrePetits - 1)}>
          <Ionicons name="remove" size={24} color={colors.ajout} />
        </Pressable>
        <Text style={styles.stepperValeur}>{nombrePetits}</Text>
        <Pressable style={styles.stepperBouton} onPress={() => ajusterNombrePetits(nombrePetits + 1)}>
          <Ionicons name="add" size={24} color={colors.ajout} />
        </Pressable>
      </View>

      <Text style={styles.question}>Sexe de chaque petit</Text>
      {sexesPetits.map((sexe, index) => (
        <Pressable key={index} style={styles.choix} onPress={() => basculerSexe(index)}>
          <Ionicons name={sexe === "F" ? "female" : "male"} size={24} color={colors.ajout} />
          <Text style={styles.choixTitre}>
            Petit {index + 1} — {sexe === 'F' ? 'Femelle' : 'Mâle'}
          </Text>
        </Pressable>
      ))}

      <Button
        label="Continuer"
        onPress={() =>
          router.push({
            pathname: '/cheptel/naissance-nouvelle',
            params: { sexes: sexesPetits.join(',') },
          })
        }
      />
      <Button label="Retour" variant="secondary" onPress={() => setEtape('role')} />
    </Screen>
    </AccentColorProvider>
  );
}

const styles = StyleSheet.create({
  question: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  choixTexte: { flex: 1, gap: 2 },
  choixTitre: { fontSize: 16, fontWeight: '700', color: colors.text },
  choixSous: { fontSize: 13, color: colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepperBouton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValeur: { fontSize: 24, fontWeight: '800', color: colors.text, minWidth: 32, textAlign: 'center' },
});
