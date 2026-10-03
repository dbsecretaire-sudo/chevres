import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { colors } from '@/shared/theme/colors';
import { useAjoutTabBarBleu } from '@/shared/hooks/useAjoutTabBarBleu';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import type { Sexe } from '@/features/cheptel/types';
import { styles } from '@/shared/styles/cheptel/AjoutRapideChevre.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { SEXE, ETAPE_AJOUT_RAPIDE, NB_PETITS_MIN, nbPetitsMax } from '@/shared/constants/cheptel';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { LABEL_SEXE } from '@/shared/textes/libelles';

type Etape = ValeurDe<typeof ETAPE_AJOUT_RAPIDE>;

export default function AjoutRapide() {
  useAjoutTabBarBleu();
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>(ETAPE_AJOUT_RAPIDE.ROLE);
  const [nombrePetits, setNombrePetits] = useState(NB_PETITS_MIN);
  const [sexesPetits, setSexesPetits] = useState<Sexe[]>([SEXE.FEMELLE]);

  const ajusterNombrePetits = (n: number) => {
    const borne = Math.max(NB_PETITS_MIN, Math.min(nbPetitsMax(), n));
    setNombrePetits(borne);
    setSexesPetits((prev) => {
      const copie = [...prev];
      while (copie.length < borne) copie.push(SEXE.FEMELLE);
      copie.length = borne;
      return copie;
    });
  };

  const basculerSexe = (index: number) => {
    setSexesPetits((prev) =>
      prev.map((s, i) => (i === index ? (s === SEXE.FEMELLE ? SEXE.MALE : SEXE.FEMELLE) : s)),
    );
  };

  if (etape === ETAPE_AJOUT_RAPIDE.ROLE) {
    return (
      <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
        <Screen>
          <Text style={styles.question}>{TEXTES.cheptel.ajoutRapideChevre.deQuiSAgitIlQuestion}</Text>

          <Pressable style={styles.choix} onPress={() => setEtape(ETAPE_AJOUT_RAPIDE.DETAILS_MERE)}>
            <Ionicons name="paw" size={26} color={colors.ajout} />
            <View style={commonStyles.textWrap}>
              <Text style={commonStyles.subheading}>{TEXTES.cheptel.ajoutRapideChevre.laMere}</Text>
              <Text style={commonStyles.muted}>
                {TEXTES.cheptel.ajoutRapideChevre.declarerUneNaissancePourCette}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.choix}
            onPress={() => router.push({ pathname: ROUTES.CHEPTEL_NOUVELLE, params: { sexe: SEXE.FEMELLE } })}
          >
            <Ionicons name="female" size={26} color={colors.ajout} />
            <View style={commonStyles.textWrap}>
              <Text style={commonStyles.subheading}>{TEXTES.cheptel.ajoutRapideChevre.uneChevre}</Text>
              <Text style={commonStyles.muted}>
                {TEXTES.cheptel.ajoutRapideChevre.ajouterCetteFemelleAuCheptel}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.choix}
            onPress={() => router.push({ pathname: ROUTES.CHEPTEL_NOUVELLE, params: { sexe: SEXE.MALE } })}
          >
            <Ionicons name="male" size={26} color={colors.ajout} />
            <View style={commonStyles.textWrap}>
              <Text style={commonStyles.subheading}>{TEXTES.cheptel.ajoutRapideChevre.unBouc}</Text>
              <Text style={commonStyles.muted}>
                {TEXTES.cheptel.ajoutRapideChevre.ajouterCeMaleAuCheptel}
              </Text>
            </View>
          </Pressable>

          <Button label={TEXTES.commun.general.annuler} variant="secondary" onPress={() => router.back()} />
        </Screen>
      </AccentColorProvider>
    );
  }

  // details-mere
  return (
    <AccentColorProvider color={colors.ajout} softColor={colors.ajoutBadgeBg}>
      <Screen>
        <Text style={styles.question}>{TEXTES.cheptel.ajoutRapideChevre.combienDePetitsQuestion}</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepperBouton} onPress={() => ajusterNombrePetits(nombrePetits - 1)}>
            <Ionicons name="remove" size={24} color={colors.ajout} />
          </Pressable>
          <Text style={styles.stepperValeur}>{nombrePetits}</Text>
          <Pressable style={styles.stepperBouton} onPress={() => ajusterNombrePetits(nombrePetits + 1)}>
            <Ionicons name="add" size={24} color={colors.ajout} />
          </Pressable>
        </View>

        <Text style={styles.question}>{TEXTES.cheptel.ajoutRapideChevre.sexeDeChaquePetit}</Text>
        {sexesPetits.map((sexe, index) => (
          <Pressable key={index} style={styles.choix} onPress={() => basculerSexe(index)}>
            <Ionicons name={sexe === SEXE.FEMELLE ? 'female' : 'male'} size={24} color={colors.ajout} />
            <Text style={commonStyles.subheading}>
              {TEXTES.cheptel.ajoutRapideChevre.petitEspace}
              {index + 1} — {LABEL_SEXE[sexe]}
            </Text>
          </Pressable>
        ))}

        <Button
          label={TEXTES.cheptel.ajoutRapideChevre.continuer}
          onPress={() =>
            router.push({
              pathname: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE,
              params: { sexes: sexesPetits.join(',') },
            })
          }
        />
        <Button
          label={TEXTES.commun.general.retour}
          variant="secondary"
          onPress={() => setEtape(ETAPE_AJOUT_RAPIDE.ROLE)}
        />
      </Screen>
    </AccentColorProvider>
  );
}
