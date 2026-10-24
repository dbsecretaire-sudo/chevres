import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { BlocSante } from '@/features/sante/components/BlocSante';
import type { Minuteur } from '@/features/accueil/services/fermeAccueil';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.accueil.ferme.jour;

/**
 * La liste complète des rappels : la santé du troupeau, les déclarations à valider (la coche), les lots et les documents de circulation. Elle recouvre
 * l'écran : une ligne qui ouvre une autre page se ferait cacher par la feuille, qui se ferme donc dès que la page change.
 */
export function FeuilleRappels({ visible, onFermer }: { visible: boolean; onFermer: () => void }) {
  const chemin = usePathname();
  /** La page sur laquelle la feuille s'est ouverte. */
  const pageDOuverture = useRef(chemin);
  useEffect(() => {
    if (!visible) pageDOuverture.current = chemin;
    else if (chemin !== pageDOuverture.current) onFermer();
  }, [visible, chemin, onFermer]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFermer}>
      <View style={styles.feuille}>
        <View style={styles.entete}>
          <Text style={styles.titreFeuille}>{TEXTES.rappels.titre}</Text>
          <Pressable
            onPress={onFermer}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={TEXTES.commun.general.fermer}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.contenuFeuille}>
          <BlocSante />
          <BlocRappels />
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * La fenêtre du jour : une fois par jour, au lancement, ce qui attend (délais d'attente, déclarations, documents, lots). Rien à signaler,
 * rien d'affiché. « Compris » la ferme pour la journée ; « Plus tard » la ferme, et elle revient à la prochaine ouverture de l'application.
 */
export function useFenetreDuJour(minuteurs: readonly Minuteur[], pret: boolean) {
  const { actif } = useEtablissement();
  const [ouverte, setOuverte] = useState(false);
  /** Une fois la fenêtre décidée pour cette ouverture de l'application, elle ne se redécide plus à chaque retour sur l'accueil. */
  const decidee = useRef(false);
  const cle = `troupeau:v1:rappel-du-jour:${actif.id}`;
  useFocusEffect(
    useCallback(() => {
      if (decidee.current || !pret) return;
      decidee.current = true;
      if (minuteurs.length === 0) return;
      AsyncStorage.getItem(cle)
        .then((vu) => {
          if (vu !== todayISO()) setOuverte(true);
        })
        .catch(() => setOuverte(true));
    }, [cle, minuteurs.length, pret]),
  );
  const compris = () => {
    AsyncStorage.setItem(cle, todayISO()).catch(() => undefined);
    setOuverte(false);
  };
  return { ouverte, compris, plusTard: () => setOuverte(false) };
}

/** La fenêtre du jour : la liste de ce qui attend, chaque ligne ouvrant son écran. */
export function FenetreDuJour({
  minuteurs,
  ouverte,
  onCompris,
  onPlusTard,
  onVoirTout,
}: {
  minuteurs: readonly Minuteur[];
  ouverte: boolean;
  onCompris: () => void;
  onPlusTard: () => void;
  onVoirTout: () => void;
}) {
  const router = useRouter();
  return (
    <Modal visible={ouverte} transparent animationType="fade" onRequestClose={onPlusTard}>
      <View style={styles.voile}>
        <View style={styles.fenetre}>
          <Ionicons name="notifications" size={34} color={colors.accent} />
          <Text style={styles.titre}>{T.titre}</Text>
          <Text style={styles.intro}>{T.intro}</Text>
          <View style={styles.lignes}>
            {minuteurs.slice(0, 6).map((m) => (
              <Pressable
                key={m.id}
                style={styles.ligne}
                onPress={() => {
                  onCompris();
                  router.push(m.route as never);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.ligneLibelle}>{m.titre ?? m.libelle}</Text>
                <Text style={[styles.ligneValeur, m.urgent ? { color: colors.danger } : null]}>
                  {m.valeur}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onVoirTout} hitSlop={8} accessibilityRole="link">
            <Text style={styles.voirTout}>{TEXTES.rappels.titre}</Text>
          </Pressable>
          <View style={styles.boutons}>
            <Pressable style={styles.secondaire} onPress={onPlusTard} accessibilityRole="button">
              <Text style={styles.secondaireTexte}>{T.plusTard}</Text>
            </Pressable>
            <Pressable style={styles.principal} onPress={onCompris} accessibilityRole="button">
              <Text style={styles.principalTexte}>{T.compris}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: colors.voile,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fenetre: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  titre: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  intro: { fontSize: 14, color: colors.textMuted },
  lignes: { alignSelf: 'stretch', gap: 6, marginVertical: 4 },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.badgeBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ligneLibelle: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  ligneValeur: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  voirTout: { fontSize: 14, color: colors.primary, textDecorationLine: 'underline' },
  boutons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 4 },
  secondaire: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaireTexte: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  principal: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  principalTexte: { color: colors.blanc, fontWeight: '700', fontSize: 15 },
  feuille: { flex: 1, backgroundColor: colors.background, paddingTop: 16 },
  entete: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titreFeuille: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  contenuFeuille: { padding: 16, gap: 12 },
});
