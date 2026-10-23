import { useState, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { changerAffichage } from '@/bureau/changerAffichage';
import { definitionDesMenus } from '@/bureau/MenuBureau';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { BarreOutilsComptable } from '@/shared/components/BarreOutilsComptable';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { routeLaPlusPrecise, type ParametresDePage } from '@/shared/navigation/pageOuverte';
import { menusDeLaFerme } from '@/shared/navigation/structureMenus';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { AFFICHAGE, modeAffichage, type ModeAffichage } from '@/shared/utils/affichage';
import { estBureau } from '@/shared/utils/plateforme';
import { BoutonPlat } from '@/shared/components/BoutonPlat';
import { changerTailleTexte, lireTailleTexte, tailleVoisine } from '@/shared/utils/tailleTexte';

/** La largeur du menu en arbre, à gauche. */
const LARGEUR_ARBRE = 250;
/** La largeur de la zone des écrans : au-delà, un écran reste centré (un tableau n'a pas besoin de s'étirer sur un écran géant). */
const LARGEUR_MAX_ZONE = 1500;

/** Les routes d'un menu : la sienne, ou celles de ses écrans. */
const routesDuMenu = (menu: DefinitionMenu): string[] => [
  ...(menu.route ? [menu.route] : []),
  ...(menu.items ?? []).flatMap((e) => ('route' in e ? [e.route] : [])),
];

type EntreeDeMenu = NonNullable<DefinitionMenu['items']>[number];
/** Une partie d'un menu long : son titre (absent pour les premières entrées) et ses entrées. */
interface PartieDeMenu {
  titre?: string;
  entrees: EntreeDeMenu[];
}
/** Découpe les entrées d'un menu en parties, à chaque trait qui porte un titre. */
function partiesDuMenu(items: EntreeDeMenu[]): PartieDeMenu[] {
  const parties: PartieDeMenu[] = [{ entrees: [] }];
  for (const item of items) {
    if ('separateur' in item && item.titre) parties.push({ titre: item.titre, entrees: [] });
    else parties[parties.length - 1].entrees.push(item);
  }
  return parties.filter((p) => p.titre || p.entrees.length > 0);
}

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
  // Une seule entrée est la page ouverte : la plus précise (l'accueil de l'atelier, pas l'accueil tout court).
  const courante = routeLaPlusPrecise(menus.flatMap(routesDuMenu), adresse, parametres);
  const dossierOuvert = courante ? (menus.find((m) => routesDuMenu(m).includes(courante))?.label ?? null) : null;
  const [choix, setChoix] = useState<{ adresse: string; menu: string | null } | null>(null);
  const ouvert = choix?.adresse === adresse ? choix.menu : dossierOuvert;
  const setOuvert = (menu: string | null) => setChoix({ adresse, menu });
  // Les parties d'un menu long (« Gestion », « Intervenants »…) se plient aussi : seule celle de la page ouverte est dépliée d'office, un appui sur son titre en décide autrement.
  const [partiesChoisies, setPartiesChoisies] = useState<Record<string, boolean>>({});
  const [taille, setTaille] = useState(lireTailleTexte);
  const choisirTaille = (sens: 1 | -1) => {
    const suivante = tailleVoisine(taille, sens);
    setTaille(suivante);
    changerTailleTexte(suivante).catch(() => undefined);
  };
  const autresAffichages: ModeAffichage[] = estBureau()
    ? Object.values(AFFICHAGE).filter((mode) => mode !== modeAffichage)
    : [];
  return (
    <View style={styles.arbreColonne}>
    <ScrollView style={styles.arbre} contentContainerStyle={styles.arbreContenu}>
      {menus.map((menu) => {
        const deplie = ouvert === menu.label;
        const actif = !menu.items && !!menu.route && menu.route === courante;
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
              ? partiesDuMenu(menu.items ?? []).map((partie, p) => {
                  const cle = `${menu.label}|${partie.titre ?? ''}`;
                  const partieOuverte =
                    !partie.titre || (partiesChoisies[cle] ?? partie.entrees.some((e) => 'route' in e && e.route === courante));
                  return (
                    <View key={cle + p}>
                      {partie.titre ? (
                        <Pressable
                          style={({ pressed }) => [styles.partieEntete, pressed && styles.appuye]}
                          onPress={() => setPartiesChoisies((c) => ({ ...c, [cle]: !partieOuverte }))}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: partieOuverte }}
                        >
                          <Ionicons name={partieOuverte ? 'chevron-down' : 'chevron-forward'} size={11} color={colors.textMuted} />
                          <Text style={styles.partie}>{partie.titre}</Text>
                        </Pressable>
                      ) : null}
                      {partieOuverte
                        ? partie.entrees.map((item, i) =>
                            'separateur' in item ? (
                              <View key={`s${i}`} style={styles.trait} />
                            ) : (
                              <Pressable
                                key={`${item.route}-${i}`}
                                style={({ pressed }) => [styles.page, item.route === courante && styles.actif, pressed && styles.appuye]}
                                onPress={() => router.push(item.route as never)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: item.route === courante }}
                              >
                                <Text style={[styles.pageTexte, item.route === courante && styles.pageCourante]} numberOfLines={2}>
                                  {item.label}
                                </Text>
                              </Pressable>
                            ),
                          )
                        : null}
                    </View>
                  );
                })
              : null}
          </View>
        );
      })}
    </ScrollView>
      <View style={styles.pied}>
      {/* La taille du texte : tout grandit ou rapetisse ensemble, partout. */}
      <View style={styles.taille}>
        <Text style={styles.affichageTexte}>Taille du texte : {Math.round(taille * 100)} %</Text>
        <View style={styles.tailleBoutons}>
          <BoutonPlat libelle="A −" accessibilityLabel="Réduire le texte" onPress={() => choisirTaille(-1)} />
          <BoutonPlat libelle="A +" accessibilityLabel="Agrandir le texte" onPress={() => choisirTaille(1)} />
        </View>
      </View>
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
      </View>
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
        <BarreOutilsComptable />
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
  arbreColonne: { flex: 1 },
  // Le bas du menu (la taille du texte, les autres affichages) reste en vue, quelle que soit la longueur du menu.
  pied: { borderTopWidth: 1, borderTopColor: colors.border },
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
  // Le titre d'une partie d'un menu long (« Gestion », « Intervenants ») : une ligne sur laquelle on appuie pour déplier ou plier la partie.
  partieEntete: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, marginTop: 4, marginLeft: 26, marginRight: 10 },
  partie: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted },
  trait: { height: 1, backgroundColor: colors.border, marginVertical: 4, marginLeft: 34, marginRight: 10 },
  taille: { gap: 6, paddingVertical: 10, paddingHorizontal: 14 },
  tailleBoutons: { flexDirection: 'row', gap: 6 },
  affichage: { paddingVertical: 8, paddingHorizontal: 14 },
  separe: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 12 },
  affichageTexte: { fontSize: 13, color: colors.textMuted },
});
