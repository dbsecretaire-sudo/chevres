import { useState, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { changerAffichage } from '@/bureau/changerAffichage';
import { definitionDesMenus } from '@/bureau/MenuBureau';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';
import { FeuilleRappels } from '@/features/accueil/ferme/FenetresFerme';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { estLaPageOuverte, type ParametresDePage } from '@/shared/navigation/pageOuverte';
import { menusDeLaFerme } from '@/shared/navigation/structureMenus';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { AFFICHAGE, modeAffichage, type ModeAffichage } from '@/shared/utils/affichage';
import { estBureau } from '@/shared/utils/plateforme';

/** La largeur du menu en arbre, à gauche. */
const LARGEUR_ARBRE = 250;
/** La largeur de la zone des écrans : au-delà, un écran reste centré (un tableau n'a pas besoin de s'étirer sur un écran géant). */
const LARGEUR_MAX_ZONE = 1500;
/** La largeur du bandeau de la ferme (la maison, le solde, les boucles, les rappels) dans la barre d'outils : il rétrécit jusqu'au minimum, puis passe à la ligne. */
const LARGEUR_BANDEAU_MIN = 320;
const LARGEUR_BANDEAU_MAX = 420;

/** Le menu contient-il la page ouverte ? */
const contient = (menu: DefinitionMenu, adresse: string, parametres: ParametresDePage): boolean =>
  (menu.route ? estLaPageOuverte(menu.route, adresse, parametres) : false) ||
  (menu.items ?? []).some((e) => 'route' in e && estLaPageOuverte(e.route, adresse, parametres));

/**
 * Le menu en arbre de la disposition « comptable » : les menus de l'application (l'accueil de la ferme, la comptabilité, les contacts, l'organisation…) comme des dossiers
 * qu'on déplie, avec la page ouverte en évidence. Au bas, les autres affichages (bureau, mobile).
 */
function ArbreDesMenus() {
  const router = useRouter();
  const adresse = usePathname();
  const parametres = useGlobalSearchParams() as ParametresDePage;
  const { settings } = useAppSettings();
  const avecPlanDeLaFerme = !modeEntreprise() && !settings.exploitation?.accueilClassique;
  const menus = avecPlanDeLaFerme ? menusDeLaFerme() : definitionDesMenus();
  // Le menu de la page ouverte est déplié d'office (on y arrive par un bouton de l'accueil, un rappel…) ; un appui sur un dossier le plie ou en déplie un autre, pour cette page.
  const dossierOuvert = menus.find((m) => contient(m, adresse, parametres))?.label ?? null;
  const [choix, setChoix] = useState<{ adresse: string; menu: string | null } | null>(null);
  const ouvert = choix?.adresse === adresse ? choix.menu : dossierOuvert;
  const setOuvert = (menu: string | null) => setChoix({ adresse, menu });
  const autresAffichages: ModeAffichage[] = estBureau()
    ? Object.values(AFFICHAGE).filter((mode) => mode !== modeAffichage)
    : [];
  return (
    <ScrollView style={styles.arbre} contentContainerStyle={styles.arbreContenu}>
      {menus.map((menu) => {
        const deplie = ouvert === menu.label;
        const actif = !menu.items && menu.route ? estLaPageOuverte(menu.route, adresse, parametres) : false;
        return (
          <View key={menu.label}>
            <Pressable
              style={({ pressed }) => [styles.dossier, actif && styles.actif, pressed && styles.appuye]}
              onPress={() => (menu.items ? setOuvert(deplie ? null : menu.label) : router.push((menu.route ?? '/') as never))}
              accessibilityRole="button"
              accessibilityState={{ expanded: menu.items ? deplie : undefined }}
            >
              <Ionicons
                name={menu.items ? (deplie ? 'chevron-down' : 'chevron-forward') : 'ellipse'}
                size={menu.items ? 14 : 6}
                color={colors.textMuted}
                style={styles.fleche}
              />
              <Text style={[styles.dossierTexte, dossierOuvert === menu.label && styles.dossierCourant]} numberOfLines={1}>
                {menu.label}
              </Text>
            </Pressable>
            {deplie
              ? menu.items?.map((item, i) =>
                  'separateur' in item ? (
                    <View key={`s${i}`} style={styles.trait} />
                  ) : (
                    <Pressable
                      key={`${item.route}-${i}`}
                      style={({ pressed }) => [styles.page, estLaPageOuverte(item.route, adresse, parametres) && styles.actif, pressed && styles.appuye]}
                      onPress={() => router.push(item.route as never)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: estLaPageOuverte(item.route, adresse, parametres) }}
                    >
                      <Text style={[styles.pageTexte, estLaPageOuverte(item.route, adresse, parametres) && styles.pageCourante]} numberOfLines={2}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ),
                )
              : null}
          </View>
        );
      })}
      {autresAffichages.map((mode, i) => (
        <Pressable
          key={mode}
          style={({ pressed }) => [styles.affichage, i === 0 && styles.separe, pressed && styles.appuye]}
          onPress={() => changerAffichage(mode)}
          accessibilityRole="button"
        >
          <Text style={styles.affichageTexte}>{TEXTES.navigation.affichage[mode]}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/**
 * La barre d'outils de la disposition « comptable », au-dessus de tous les écrans : l'année, l'espèce, le didacticiel, l'enregistrement, puis le bandeau de la ferme (la
 * maison, le solde, les boucles, les rappels).
 */
function BarreDOutils() {
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  return (
    <View style={styles.outils}>
      <BarreHauteFerme sansMenus />
      <View style={styles.bandeau}>
        <BandeauFerme onRappels={() => setRappelsOuverts(true)} />
      </View>
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
    </View>
  );
}

/**
 * La disposition d'un poste de comptabilité (affichage sobre, fenêtre large) : le menu en arbre à gauche, la barre d'outils en haut et, dessous, l'écran ouvert sur toute
 * la largeur restante — les listes y sont des tableaux.
 */
export function DispositionComptable({ children }: PropsWithChildren) {
  return (
    <View style={styles.fenetre}>
      <View style={styles.gauche}>
        <ArbreDesMenus />
      </View>
      <View style={styles.droite}>
        <BarreDOutils />
        <View style={styles.zone}>
          <View style={styles.ecran}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fenetre: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  gauche: { width: LARGEUR_ARBRE, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface },
  droite: { flex: 1 },
  zone: { flex: 1, alignItems: 'center' },
  ecran: { flex: 1, width: '100%', maxWidth: LARGEUR_MAX_ZONE },
  outils: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  bandeau: { flexGrow: 1, flexShrink: 1, minWidth: LARGEUR_BANDEAU_MIN, maxWidth: LARGEUR_BANDEAU_MAX },
  arbre: { flex: 1 },
  arbreContenu: { paddingVertical: 8 },
  dossier: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, gap: 6 },
  fleche: { width: 14, textAlign: 'center' },
  dossierTexte: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  dossierCourant: { color: colors.primaryDark },
  page: { paddingVertical: 6, paddingLeft: 34, paddingRight: 10 },
  pageTexte: { fontSize: 13, color: colors.text },
  pageCourante: { fontWeight: '800', color: colors.primaryDark },
  actif: { backgroundColor: colors.badgeBg },
  appuye: { opacity: 0.7 },
  trait: { height: 1, backgroundColor: colors.border, marginVertical: 4, marginLeft: 34, marginRight: 10 },
  affichage: { paddingVertical: 8, paddingHorizontal: 14 },
  separe: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 12 },
  affichageTexte: { fontSize: 13, color: colors.textMuted },
});
