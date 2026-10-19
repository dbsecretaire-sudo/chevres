import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Apparition, Pulsation } from '@/features/accueil/ferme/animations';
import type { IconeMinuteur, Minuteur } from '@/features/accueil/services/fermeAccueil';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const M = TEXTES.accueil.ferme.menus;

const ICONES_MINUTEUR: Record<IconeMinuteur, keyof typeof Ionicons.glyphMap> = {
  lait: 'water',
  viande: 'restaurant',
  declaration: 'document-text',
  bilan: 'medkit',
  circulation: 'paper-plane',
  facturer: 'receipt',
  rappel: 'alert-circle',
};

/**
 * Les minuteurs, en colonne sur le côté gauche : une pastille ronde par échéance (un délai d'attente, une déclaration, des documents à
 * envoyer…), avec ce qu'il reste ; rouge et qui pulse quand c'est en retard. Un appui ouvre l'écran à traiter.
 */
export function MinuteursFerme({ minuteurs, nombreDeRappels, onOuvrirRappels, bas }: { minuteurs: readonly Minuteur[]; nombreDeRappels: number; onOuvrirRappels: () => void; bas?: ReactNode }) {
  const router = useRouter();
  const [cloche, setCloche] = useState(false);
  const aller = (route: string) => {
    setCloche(false);
    router.push(route as never);
  };
  return (
    <View style={styles.colonne}>
      {minuteurs.map((m, i) => (
        <Apparition key={m.id} delai={i * 90}>
          <Pressable
            style={styles.element}
            onPress={() => router.push(m.route as never)}
            accessibilityRole="button"
            accessibilityLabel={`${m.libelle} : ${m.valeur}`}
          >
            <Pulsation actif={m.urgent}>
              <View style={[styles.rond, m.urgent ? styles.rondUrgent : null]}>
                <Ionicons name={ICONES_MINUTEUR[m.icone]} size={24} color={m.urgent ? colors.blanc : colors.primary} />
              </View>
            </Pulsation>
            <View style={[styles.valeur, m.urgent ? styles.valeurUrgente : null]}>
              <Text style={styles.valeurTexte}>{m.valeur}</Text>
            </View>
            <Text style={styles.libelle} numberOfLines={2}>
              {m.libelle}
            </Text>
          </Pressable>
        </Apparition>
      ))}
      <Apparition delai={minuteurs.length * 90}>
        <Pressable style={styles.element} onPress={() => setCloche(true)} accessibilityRole="button" accessibilityLabel={TEXTES.rappels.titre}>
          <View style={styles.rondCloche}>
            <Ionicons name="notifications" size={24} color={colors.blanc} />
            {nombreDeRappels > 0 ? (
              <View style={styles.badgeCloche}>
                <Text style={styles.badgeClocheTexte}>{nombreDeRappels}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.libelle}>{TEXTES.accueil.ferme.cloche.libelle}</Text>
        </Pressable>
      </Apparition>
      {bas}
      <OptionsModal
        visible={cloche}
        onClose={() => setCloche(false)}
        title={TEXTES.accueil.ferme.cloche.titre}
        options={[
          {
            label: TEXTES.rappels.titre,
            icon: 'notifications',
            onPress: () => {
              setCloche(false);
              onOuvrirRappels();
            },
          },
          { label: TEXTES.rappels.historique.titre, icon: 'time', onPress: () => aller(ROUTES.RAPPELS_HISTORIQUE) },
          { label: TEXTES.rappels.gerer, icon: 'settings', onPress: () => aller(ROUTES.COMPTABILITE_REGLAGES) },
        ]}
      />
    </View>
  );
}

const MENUS: { cle: keyof typeof M; icone: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { cle: 'production', icone: 'leaf', route: ROUTES.PRODUCTION },
  { cle: 'commercial', icone: 'cart', route: ROUTES.COMMERCIAL },
  { cle: 'stock', icone: 'cube', route: ROUTES.COMPTABILITE_STOCKS },
  { cle: 'contacts', icone: 'people', route: ROUTES.CONTACTS },
  { cle: 'reglages', icone: 'settings', route: ROUTES.REGLAGES },
];

/** Les boutons flottants du côté droit, comme un sac à dos : chacun ouvre une rubrique de l'application. */
export function MenuFerme() {
  const router = useRouter();
  return (
    <View style={styles.colonne}>
      {MENUS.map((m, i) => (
        <Apparition key={m.cle} delai={i * 70}>
          <Pressable style={styles.element} onPress={() => router.push(m.route as never)} accessibilityRole="button" accessibilityLabel={M[m.cle]}>
            <View style={styles.rondMenu}>
              <Ionicons name={m.icone} size={26} color={colors.blanc} />
            </View>
            <Text style={styles.libelle} numberOfLines={1}>
              {M[m.cle]}
            </Text>
          </Pressable>
        </Apparition>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  colonne: { width: 72, gap: 12, alignItems: 'center' },
  element: { alignItems: 'center', gap: 2, width: 72 },
  rond: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.blanc, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  rondUrgent: { backgroundColor: colors.danger, borderColor: colors.dangerFonce },
  valeur: { marginTop: -8, backgroundColor: colors.primaryDark, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  valeurUrgente: { backgroundColor: colors.dangerFonce },
  valeurTexte: { color: colors.blanc, fontSize: 12, fontWeight: '700' },
  libelle: { fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '600' },
  rondCloche: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.blanc, alignItems: 'center', justifyContent: 'center' },
  badgeCloche: { position: 'absolute', top: -6, right: -6, minWidth: 20, backgroundColor: colors.danger, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' },
  badgeClocheTexte: { color: colors.blanc, fontSize: 11, fontWeight: '700' },
  rondMenu: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.blanc, alignItems: 'center', justifyContent: 'center' },
});
