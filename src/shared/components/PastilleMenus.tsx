import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { changerAffichage } from '@/bureau/changerAffichage';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { useMenusSections } from '@/shared/navigation/menusSections';
import { menusDeLaFerme } from '@/shared/navigation/structureMenus';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { AFFICHAGE, modeAffichage, type ModeAffichage } from '@/shared/utils/affichage';
import { estBureau } from '@/shared/utils/plateforme';
import { colors } from '@/shared/theme/colors';
import { useEchelle } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';

/**
 * La pastille « Menus » de la capsule du haut : un appui déroule, juste dessous, les menus de l'application. Pour un élevage avec l'accueil « ferme », ce sont ceux
 * de l'accueil (Accueil, Exploitation, Atelier, Agritourisme) puis la Comptabilité, les Contacts et l'Organisation : un appui sur un menu en déroule les écrans.
 * Sinon (une entreprise, l'accueil classique), ce sont les rubriques des onglets, la rubrique ouverte en évidence.
 */
export function PastilleMenus({ compact = false }: { compact?: boolean }) {
  const entrees = useMenusSections();
  const router = useRouter();
  const { settings } = useAppSettings();
  const avecPlanDeLaFerme = !modeEntreprise() && !settings.exploitation?.accueilClassique;
  /** Le menu déroulé (son libellé) : un seul à la fois. */
  const [deroule, setDeroule] = useState<string | null>(null);
  // La version Windows propose, au bas de la liste, les deux autres affichages (bureau, mobile, sobre).
  const autresAffichages: ModeAffichage[] = estBureau()
    ? Object.values(AFFICHAGE).filter((mode) => mode !== modeAffichage)
    : [];
  const echelle = useEchelle();
  const ref = useRef<View>(null);
  const { width: largeurFenetre, height: hauteurFenetre } = useWindowDimensions();
  // La liste se pose sous la pastille, alignée sur son bord droit (la colonne est centrée dans une grande fenêtre).
  const [liste, setListe] = useState<{ haut: number; droite: number } | null>(null);
  const ouvrir = () =>
    ref.current?.measureInWindow((x, y, largeur, hauteur) => {
      setDeroule(null);
      setListe({ haut: y + hauteur + 6, droite: Math.max(8, largeurFenetre - (x + largeur)) });
    });
  const aller = (route: string) => {
    setListe(null);
    router.push(route as never);
  };
  // Les menus du plan de la ferme, relus à l'ouverture (ils changent avec l'espèce et les réglages).
  const plan = liste && avecPlanDeLaFerme ? menusDeLaFerme() : null;
  return (
    <>
      <Pressable
        ref={ref}
        collapsable={false}
        style={({ pressed }) => [
          styles.pastille,
          { paddingVertical: Math.round(10 * echelle) },
          compact && styles.burger,
          pressed && styles.appuyee,
        ]}
        onPress={ouvrir}
        accessibilityRole="button"
        accessibilityLabel={TEXTES.navigation.menus}
      >
        {compact ? (
          // Capsule trop large pour l'écran : « Menus » devient un menu burger, sans flèche.
          <Ionicons name="menu" size={Math.round(22 * echelle)} color={colors.text} />
        ) : (
          <>
            <Text style={[styles.texte, { fontSize: Math.round(14 * echelle) }]} numberOfLines={1}>
              {TEXTES.navigation.menus}
            </Text>
            <Ionicons name="chevron-down" size={Math.round(14 * echelle)} color={colors.text} />
          </>
        )}
      </Pressable>
      <Modal visible={liste !== null} transparent animationType="fade" onRequestClose={() => setListe(null)}>
        <Pressable style={styles.fond} onPress={() => setListe(null)} accessibilityLabel={TEXTES.commun.general.fermer}>
          <View style={[styles.liste, { top: liste?.haut ?? 0, right: liste?.droite ?? 12 }]}>
            <ScrollView style={{ maxHeight: hauteurFenetre - (liste?.haut ?? 0) - 24 }} showsVerticalScrollIndicator={false}>
            {plan
              ? plan.map((menu) => {
                  const ouvert = deroule === menu.label;
                  return (
                    <View key={menu.label}>
                      <Pressable
                        style={({ pressed }) => [styles.entree, styles.entreeMenu, pressed && styles.appuyee]}
                        onPress={() => (menu.items ? setDeroule(ouvert ? null : menu.label) : aller(menu.route ?? '/'))}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: menu.items ? ouvert : undefined }}
                      >
                        <Text style={[styles.entreeTexte, ouvert ? styles.entreeActive : null]}>{menu.label}</Text>
                        {menu.items ? (
                          <Ionicons name={ouvert ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                        ) : null}
                      </Pressable>
                      {ouvert
                        ? menu.items?.map((item, i) =>
                            'separateur' in item ? (
                              <View key={`s${i}`} style={styles.trait} />
                            ) : (
                              <Pressable
                                key={`${item.route}-${i}`}
                                style={({ pressed }) => [styles.sousEntree, pressed && styles.appuyee]}
                                onPress={() => aller(item.route)}
                                accessibilityRole="button"
                              >
                                <Text style={styles.sousEntreeTexte}>{item.label}</Text>
                              </Pressable>
                            ),
                          )
                        : null}
                    </View>
                  );
                })
              : null}
            {(plan ? [] : entrees).map((e) => (
              <Pressable
                key={e.cle}
                style={({ pressed }) => [styles.entree, pressed && styles.appuyee]}
                onPress={() => {
                  setListe(null);
                  e.onPress();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: e.actif }}
              >
                <Text style={[styles.entreeTexte, e.actif ? styles.entreeActive : null]}>{e.libelle}</Text>
              </Pressable>
            ))}
            {autresAffichages.map((mode, i) => (
              <Pressable
                key={mode}
                style={({ pressed }) => [styles.entree, i === 0 && styles.separee, pressed && styles.appuyee]}
                onPress={() => {
                  setListe(null);
                  changerAffichage(mode);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.entreeAffichage}>{TEXTES.navigation.affichage[mode]}</Text>
              </Pressable>
            ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Elle prend sa place dans la capsule, comme les autres pastilles : la largeur de son mot, et sa part du reste.
  pastille: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  // Le burger : une pastille ronde, de la largeur de son icône.
  burger: { flexGrow: 0, paddingHorizontal: 12 },
  appuyee: { opacity: 0.8 },
  texte: { color: colors.text, fontSize: 14, fontWeight: '700' },
  fond: { flex: 1 },
  liste: {
    position: 'absolute',
    minWidth: 190,
    backgroundColor: colors.blanc,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  entree: { paddingHorizontal: 18, paddingVertical: 12 },
  entreeTexte: { fontSize: 16, fontWeight: '600', color: colors.text },
  // Le premier choix d'affichage : un trait le sépare des rubriques.
  separee: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
  entreeAffichage: { fontSize: 14, color: colors.textMuted },
  entreeMenu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sousEntree: { paddingHorizontal: 18, paddingLeft: 30, paddingVertical: 8 },
  sousEntreeTexte: { fontSize: 14, color: colors.text },
  trait: { height: 1, backgroundColor: colors.border, marginVertical: 4, marginHorizontal: 18 },
  entreeActive: { color: colors.primary, fontWeight: '800' },
});
