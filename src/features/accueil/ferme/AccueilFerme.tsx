import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { actionsDuLieu, OUVRIR_LES_RAPPELS, type ActionDeLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { BarreBasseFerme } from '@/features/accueil/ferme/BarreBasseFerme';
import { BullesLieu } from '@/features/accueil/ferme/BullesLieu';
import { ChevrerieInterieure } from '@/features/accueil/ferme/ChevrerieInterieure';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { EnclosFerme } from '@/features/accueil/ferme/EnclosFerme';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { NomFerme } from '@/features/accueil/ferme/NomFerme';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import { decalageVertical, ecartDesBulles, positionsEnArc, rayonDesBulles } from '@/features/accueil/services/bullesFerme';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

const C = TEXTES.accueil.ferme.colonnes;
const TAILLE_ICONE = 30;
const ROUGE = '#9C1B2E';
const BLEU = '#6C8EBF';
const ARDOISE = '#3E3E3E';

/** Où s'ouvre le menu d'un bouton : à droite de la colonne de gauche, à gauche de celle de droite, ou en haut de l'enclos. */
type Cote = 'gauche' | 'droite' | 'centre';
/** La direction de l'arc des bulles selon le côté (0 : vers la droite, 90 : vers le haut, 180 : vers la gauche). */
const DIRECTION: Record<Cote, number> = { gauche: 0, droite: 180, centre: 90 };

interface Menu {
  cible: CibleDesBulles;
  cote: Cote;
  /** Le centre du bouton dans l'accueil, et la hauteur de l'accueil (pour garder les bulles à l'écran). */
  x: number;
  y: number;
  hauteur: number;
}

const iconeMCI = (nom: keyof typeof MaterialCommunityIcons.glyphMap) => <MaterialCommunityIcons name={nom} size={TAILLE_ICONE} color={colors.blanc} />;
const iconeIon = (nom: keyof typeof Ionicons.glyphMap) => <Ionicons name={nom} size={TAILLE_ICONE} color={colors.blanc} />;

/**
 * L'accueil « ferme » de l'élevage : un bandeau comme celui d'un jeu (la balance, les boucles, l'aliment), le nom de l'établissement, puis
 * l'enclos du troupeau au centre, ses chèvres qui se promènent, entre deux colonnes de boutons ronds : les lieux de la ferme (à gauche, la
 * production ; à droite, les tiers et le stock). Chaque bouton fait sortir ses actions en bulles. En bas, l'année, l'espèce, le didacticiel
 * et les réglages. Une fenêtre annonce une fois par jour ce qui attend.
 */
export default function AccueilFerme() {
  const router = useRouter();
  const f = useFermeAccueil();
  // Sans en-tête, le contenu commence sous l'encoche et la barre d'état.
  const { top: haut } = useSafeAreaInsets();
  const racine = useRef<View>(null);
  const enclos = useRef<View>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const [estiveOuverte, setEstiveOuverte] = useState(false);
  const [interieur, setInterieur] = useState(false);
  const jour = useFenetreDuJour(f.minuteurs, f.stats !== null);

  const gauche: EntreeDeColonne[] = [
    { cle: 'fromagerie', titre: C.fromagerie, icone: iconeMCI('cheese'), pastille: f.lotsARappeler, couleur: f.lotsARappeler > 0 ? ROUGE : undefined },
    { cle: 'viande', titre: C.viande, icone: iconeMCI('food-steak') },
    { cle: 'charcuterie', titre: C.charcuterie, icone: iconeMCI('food-drumstick') },
    { cle: 'laiterie', titre: C.laiterie, icone: iconeIon('water') },
    { cle: 'abattoir', titre: C.abattoir, icone: iconeMCI('factory'), pastille: f.lotsAFacturer, couleur: f.lotsAFacturer > 0 ? ROUGE : undefined },
    { cle: 'fournisseurs', titre: C.fournisseurs, icone: iconeMCI('truck-delivery') },
  ];
  const droite: EntreeDeColonne[] = [
    { cle: 'stock', titre: C.stock, icone: iconeIon('cube') },
    { cle: 'contacts', titre: C.contacts, icone: iconeIon('people') },
  ];
  // Ce qui se fait au sein de l'exploitation, sous l'enclos : l'estive, les soins, l'équarrissage, les organismes, les rappels.
  const interne: EntreeDeColonne[] = [
    { cle: 'estive', titre: C.estive, icone: iconeIon('trail-sign'), couleur: '#D2793B' },
    { cle: 'veterinaire', titre: C.veterinaire, icone: iconeIon('add'), couleur: BLEU },
    { cle: 'equarrissage', titre: C.equarrissage, icone: iconeMCI('grave-stone'), pastille: f.morts, couleur: BLEU },
    { cle: 'organismes', titre: C.organismes, icone: iconeMCI('bank'), couleur: ARDOISE },
    { cle: 'rappels', titre: C.rappels, icone: iconeIon('notifications'), pastille: f.nombreDeRappels, couleur: '#D2793B' },
  ];

  /** Ouvre le menu d'un bouton à partir de sa place dans la fenêtre : on la ramène à celle de l'accueil. */
  const ouvrirMenu = (cible: CibleDesBulles, cote: Cote, ancre: AncreBouton) => {
    racine.current?.measureInWindow((rx, ry, _largeur, hauteur) => {
      setMenu({ cible, cote, x: ancre.x + ancre.largeur / 2 - rx, y: ancre.y + ancre.hauteur / 2 - ry, hauteur });
    });
  };
  const surBouton = (cote: Cote, cle: string, ancre: AncreBouton) => {
    if (cle === 'estive') setEstiveOuverte(true);
    else if (cle === 'stock') router.push(ROUTES.lieu('entrepot') as never);
    else ouvrirMenu(cle as CibleDesBulles, cote, ancre);
  };
  const surGauche = (cle: string, ancre: AncreBouton) => surBouton('gauche', cle, ancre);
  const surDroite = (cle: string, ancre: AncreBouton) => surBouton('droite', cle, ancre);
  const surInterne = (cle: string, ancre: AncreBouton) => surBouton('centre', cle, ancre);
  const surEnclos = () => {
    enclos.current?.measureInWindow((x, y, largeur, hauteur) => ouvrirMenu('enclos', 'centre', { x, y, largeur, hauteur }));
  };
  const choisir = (action: ActionDeLieu) => {
    setMenu(null);
    if (action.route === OUVRIR_LES_RAPPELS) setRappelsOuverts(true);
    else router.push(action.route as never);
  };

  // Les bulles du menu ouvert : le bouton est décalé si elles sortaient de l'écran.
  const actions = menu ? actionsDuLieu(menu.cible) : [];
  const positions = menu ? positionsEnArc(actions.length, rayonDesBulles(actions.length), DIRECTION[menu.cote], ecartDesBulles(actions.length)) : [];
  const yBulles = menu ? menu.y + decalageVertical(positions, menu.y, menu.hauteur, 90) : 0;

  return (
    <View ref={racine} collapsable={false} style={styles.racine}>
      <View style={[styles.haut, estBureau() ? null : { paddingTop: 12 + haut }]}>
        <View style={styles.colonneHaut}>
          <BandeauFerme balance={f.stats?.soldeFactures} boucles={f.boucles} aliments={f.aliments} />
          {estBureau() ? null : <NomFerme />}
          <RappelSauvegarde />
        </View>
      </View>
      <View style={styles.corps}>
        <ColonneFerme entrees={gauche} onAppui={surGauche} />
        <ScrollView style={styles.centre} contentContainerStyle={styles.centreContenu} showsVerticalScrollIndicator={false}>
          {interieur ? (
            <View style={styles.interieur}>
              <ChevrerieInterieure vedettes={f.vedettes} aliments={f.aliments} onSortir={() => setInterieur(false)} />
            </View>
          ) : (
            <View style={[styles.panneau, f.estive ? styles.panneauEstive : null]}>
              <View ref={enclos} collapsable={false} style={styles.enclos}>
                <EnclosFerme
                  vedettes={f.vedettes}
                  nombreAnimaux={f.stats?.totalVivantes}
                  naissances={f.stats?.cabritsAnnee}
                  estive={f.estive}
                  onAppui={surEnclos}
                  onEntrer={() => setInterieur(true)}
                />
              </View>
              <ColonneFerme entrees={interne} onAppui={surInterne} grille />
            </View>
          )}
        </ScrollView>
        <ColonneFerme entrees={droite} onAppui={surDroite} />
      </View>
      <BarreBasseFerme annees={f.annees} annee={f.annee} onChoisirAnnee={f.setAnneeActive} />

      {/* Les bulles du bouton touché : par-dessus tout ; un appui à côté les referme. */}
      {menu ? (
        <View style={styles.couche}>
          <Pressable style={styles.fond} onPress={() => setMenu(null)} accessibilityRole="button" accessibilityLabel={TEXTES.commun.general.fermer} />
          <BullesLieu x={menu.x} y={yBulles} actions={actions} centreDeg={DIRECTION[menu.cote]} onChoisir={choisir} />
        </View>
      ) : null}

      <FenetreEstive visible={estiveOuverte} annee={f.annee} onClose={() => setEstiveOuverte(false)} />
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
      <FenetreDuJour
        minuteurs={f.minuteurs}
        ouverte={jour.ouverte}
        onCompris={jour.compris}
        onPlusTard={jour.plusTard}
        onVoirTout={() => {
          jour.compris();
          setRappelsOuverts(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: colors.background },
  haut: { paddingHorizontal: 12, paddingBottom: 8 },
  colonneHaut: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 8 },
  corps: { flex: 1, flexDirection: 'row', paddingHorizontal: 4, gap: 4 },
  centre: { flex: 1 },
  centreContenu: { flexGrow: 1, paddingVertical: 4 },
  panneau: { backgroundColor: '#E1ECCB', borderRadius: 18, padding: 10, gap: 10, borderWidth: 2, borderColor: '#B8CC94' },
  panneauEstive: { backgroundColor: '#DCE8F2', borderColor: '#B4C9DC' },
  enclos: { minHeight: 330 },
  interieur: { minHeight: 520, flexGrow: 1, borderRadius: 16, overflow: 'hidden' },
  couche: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50 },
  fond: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
});
