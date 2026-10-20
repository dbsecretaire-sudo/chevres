import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  actionsDuLieu,
  OUVRIR_LES_RAPPELS,
  type ActionDeLieu,
  type CibleDesBulles,
} from '@/features/accueil/ferme/actionsLieu';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { BarreBasseFerme } from '@/features/accueil/ferme/BarreBasseFerme';
import { BullesLieu } from '@/features/accueil/ferme/BullesLieu';
import { ChevrerieInterieure } from '@/features/accueil/ferme/ChevrerieInterieure';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { EnclosFerme } from '@/features/accueil/ferme/EnclosFerme';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { NomFerme } from '@/features/accueil/ferme/NomFerme';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  decalageVertical,
  ecartDesBulles,
  positionsEnArc,
  rayonDesBulles,
} from '@/features/accueil/services/bullesFerme';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

const C = TEXTES.accueil.ferme.colonnes;
const TAILLE_ICONE = 30;
/** Les couleurs des lieux : un achat est bordeaux, une vente (une recette) est verte (la couleur de la ferme), le stock et les contacts sont neutres. */
const ACHAT = '#8E1F33';
const VENTE = colors.primary;
const NEUTRE = '#5F6B73';
const ORANGE = '#D2793B';

/** Où est le bouton : parmi les lieux du haut, ou parmi les boutons de l'exploitation sous l'enclos. */
type Zone = 'lieux' | 'exploitation' | 'interieur';

/**
 * La direction de l'arc des bulles d'après la place du bouton (0 : vers la droite, 90 : vers le haut, 180 : vers la gauche, 270 : vers le bas) :
 * les lieux du haut ouvrent vers le côté libre (la droite au bord gauche, la gauche au bord droit) ou vers le bas ; les boutons de l'exploitation, vers le haut.
 */
export function directionDesBulles(zone: Zone, x: number, largeur: number): number {
  if (zone === 'exploitation') return 90;
  // Dans la chèvrerie, les boutons sont en haut : les bulles s'ouvrent vers le bas.
  if (zone === 'interieur') return 270;
  if (x < largeur / 3) return 0;
  if (x > (2 * largeur) / 3) return 180;
  return 270;
}

interface Menu {
  cible: CibleDesBulles;
  /** La direction de l'arc des bulles. */
  direction: number;
  /** Le centre du bouton dans l'accueil, et la hauteur de l'accueil (pour garder les bulles à l'écran). */
  x: number;
  y: number;
  hauteur: number;
}

const iconeMCI = (nom: keyof typeof MaterialCommunityIcons.glyphMap) => (
  <MaterialCommunityIcons name={nom} size={TAILLE_ICONE} color={colors.blanc} />
);
const iconeIon = (nom: keyof typeof Ionicons.glyphMap) => (
  <Ionicons name={nom} size={TAILLE_ICONE} color={colors.blanc} />
);

/**
 * L'accueil « ferme » de l'élevage : un bandeau comme celui d'un jeu (la balance, les boucles, l'aliment), le nom de l'établissement, puis
 * les intervenants extérieurs en haut (ceux à qui l'on vend ou achète), puis l'enclos du troupeau et ses chèvres qui se promènent ; dans la
 * chèvrerie, ce qui se passe chez soi (fromagerie, viande, charcuterie, stock, estive, rappels). Chaque bouton fait sortir ses actions en bulles. En bas, l'année, l'espèce, le didacticiel
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

  // Les intervenants extérieurs, en haut : ceux à qui l'on vend (le récolteur du lait, des organismes qui versent des aides), ceux à qui l'on achète
  // (l'abattoir, les fournisseurs, le vétérinaire, l'équarrisseur) et les contacts.
  const gauche: EntreeDeColonne[] = [
    { cle: 'laiterie', titre: C.laiterie, icone: iconeIon('water'), couleur: VENTE },
    { cle: 'organismes', titre: C.organismes, icone: iconeMCI('bank'), couleur: VENTE },
    {
      cle: 'abattoir',
      titre: C.abattoir,
      icone: iconeMCI('factory'),
      pastille: f.lotsAFacturer,
      couleur: ACHAT,
    },
    { cle: 'fournisseurs', titre: C.fournisseurs, icone: iconeMCI('truck-delivery'), couleur: ACHAT },
    { cle: 'veterinaire', titre: C.veterinaire, icone: iconeIon('add'), couleur: ACHAT },
    {
      cle: 'equarrissage',
      titre: C.equarrissage,
      icone: iconeMCI('grave-stone'),
      pastille: f.morts,
      couleur: ACHAT,
    },
  ];
  const droite: EntreeDeColonne[] = [
    { cle: 'contacts', titre: C.contacts, icone: iconeIon('people'), couleur: NEUTRE },
  ];
  // Ce qui se passe chez soi, dans la chèvrerie : la fromagerie, la viande, la charcuterie, le stock, l'estive et les rappels.
  const interne: EntreeDeColonne[] = [
    {
      cle: 'fromagerie',
      titre: C.fromagerie,
      icone: iconeMCI('cheese'),
      pastille: f.lotsARappeler,
      couleur: VENTE,
    },
    { cle: 'viande', titre: C.viande, icone: iconeMCI('food-steak'), couleur: VENTE },
    { cle: 'charcuterie', titre: C.charcuterie, icone: iconeMCI('food-drumstick'), couleur: VENTE },
    { cle: 'stock', titre: C.stock, icone: iconeIon('cube'), couleur: NEUTRE },
    { cle: 'estive', titre: C.estive, icone: iconeIon('trail-sign'), couleur: ORANGE },
    {
      cle: 'rappels',
      titre: C.rappels,
      icone: iconeIon('notifications'),
      pastille: f.nombreDeRappels,
      couleur: ORANGE,
    },
  ];

  /** Ouvre le menu d'un bouton à partir de sa place dans la fenêtre : on la ramène à celle de l'accueil. */
  const ouvrirMenu = (cible: CibleDesBulles, zone: Zone, ancre: AncreBouton) => {
    racine.current?.measureInWindow((rx, ry, largeur, hauteur) => {
      const x = ancre.x + ancre.largeur / 2 - rx;
      setMenu({
        cible,
        direction: directionDesBulles(zone, x, largeur),
        x,
        y: ancre.y + ancre.hauteur / 2 - ry,
        hauteur,
      });
    });
  };
  const surBouton = (zone: Zone, cle: string, ancre: AncreBouton) => {
    if (cle === 'estive') setEstiveOuverte(true);
    else if (cle === 'stock') router.push(ROUTES.lieu('entrepot') as never);
    else ouvrirMenu(cle as CibleDesBulles, zone, ancre);
  };
  const surLieu = (cle: string, ancre: AncreBouton) => surBouton('lieux', cle, ancre);
  const surInterne = (cle: string, ancre: AncreBouton) => surBouton('interieur', cle, ancre);
  const surEnclos = () => {
    enclos.current?.measureInWindow((x, y, largeur, hauteur) =>
      ouvrirMenu('enclos', 'exploitation', { x, y, largeur, hauteur }),
    );
  };
  const choisir = (action: ActionDeLieu) => {
    setMenu(null);
    if (action.route === OUVRIR_LES_RAPPELS) setRappelsOuverts(true);
    else router.push(action.route as never);
  };

  // Les bulles du menu ouvert : le bouton est décalé si elles sortaient de l'écran.
  const actions = menu ? actionsDuLieu(menu.cible) : [];
  const positions = menu
    ? positionsEnArc(
        actions.length,
        rayonDesBulles(actions.length),
        menu.direction,
        ecartDesBulles(actions.length),
      )
    : [];
  const yBulles = menu ? menu.y + decalageVertical(positions, menu.y, menu.hauteur, 90) : 0;

  return (
    <View ref={racine} collapsable={false} style={styles.racine}>
      <View style={[styles.haut, estBureau() ? null : { paddingTop: 12 + haut }]}>
        <View style={styles.colonneHaut}>
          <BandeauFerme balance={f.stats?.soldeFactures} boucles={f.boucles} />
          {estBureau() ? null : <NomFerme />}
          <RappelSauvegarde />
        </View>
      </View>
      <ScrollView
        style={styles.corps}
        contentContainerStyle={[styles.corpsContenu, interieur ? styles.corpsInterieur : null]}
        showsVerticalScrollIndicator={false}
      >
        {/* Les intervenants extérieurs, en haut : pas dans la chèvrerie, où l'on est chez soi. */}
        {interieur ? null : (
          <View style={styles.lieux}>
            <View style={styles.lieuxGauche}>
              <ColonneFerme entrees={gauche} onAppui={surLieu} grille />
            </View>
            <View style={styles.lieuxDroite}>
              <ColonneFerme entrees={droite} onAppui={surLieu} grille />
            </View>
          </View>
        )}
        <View style={[styles.centre, interieur ? styles.centreInterieur : null]}>
          {interieur ? (
            <View style={styles.interieur}>
              <ChevrerieInterieure
                vedettes={f.vedettes}
                aliments={f.aliments}
                onSortir={() => setInterieur(false)}
                boutons={interne}
                onAppuiBouton={surInterne}
              />
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
            </View>
          )}
        </View>
      </ScrollView>
      <BarreBasseFerme annees={f.annees} annee={f.annee} onChoisirAnnee={f.setAnneeActive} />

      {/* Les bulles du bouton touché : par-dessus tout ; un appui à côté les referme. */}
      {menu ? (
        <View style={styles.couche}>
          <Pressable
            style={styles.fond}
            onPress={() => setMenu(null)}
            accessibilityRole="button"
            accessibilityLabel={TEXTES.commun.general.fermer}
          />
          <BullesLieu
            x={menu.x}
            y={yBulles}
            actions={actions}
            centreDeg={menu.direction}
            onChoisir={choisir}
          />
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
  corps: { flex: 1 },
  corpsContenu: { paddingHorizontal: 10, paddingBottom: 12, gap: 10 },
  lieux: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  // 3 boutons étroits (74) et leurs écarts (6) : la grille de la production tient sur trois colonnes, deux rangées.
  lieuxGauche: { width: 3 * 74 + 2 * 6 },
  lieuxDroite: { width: 74 },
  centre: { gap: 10 },
  panneau: {
    backgroundColor: '#E1ECCB',
    borderRadius: 18,
    padding: 10,
    gap: 10,
    borderWidth: 2,
    borderColor: '#B8CC94',
  },
  panneauEstive: { backgroundColor: '#DCE8F2', borderColor: '#B4C9DC' },
  enclos: { minHeight: 300 },
  // Dans la chèvrerie, l'intérieur remplit toute la place, jusqu'à la barre du bas.
  interieur: { minHeight: 520, flexGrow: 1, borderRadius: 16, overflow: 'hidden' },
  corpsInterieur: { flexGrow: 1 },
  centreInterieur: { flexGrow: 1 },
  couche: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50 },
  fond: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
});
