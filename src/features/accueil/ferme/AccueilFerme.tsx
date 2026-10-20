import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { actionsDuLieu, type ActionDeLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { BarreBasseFerme } from '@/features/accueil/ferme/BarreBasseFerme';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';
import { BullesLieu } from '@/features/accueil/ferme/BullesLieu';
import { ChevrerieInterieure } from '@/features/accueil/ferme/ChevrerieInterieure';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { EnclosFerme } from '@/features/accueil/ferme/EnclosFerme';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { NomFerme } from '@/features/accueil/ferme/NomFerme';
import { HAUTEUR_MIN_EXPLOITATION, TransformationFerme } from '@/features/accueil/ferme/TransformationFerme';
import { TransformationInterieure } from '@/features/accueil/ferme/TransformationInterieure';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  decalageVertical,
  ecartDesBulles,
  positionsEnArc,
  rayonDesBulles,
} from '@/features/accueil/services/bullesFerme';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { PanneauInterieur } from '@/features/accueil/ferme/PanneauInterieur';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

const C = TEXTES.accueil.ferme.colonnes;
const TAILLE_ICONE = 30;
/** Les couleurs des lieux : un achat est bordeaux, une vente (une recette) est verte (la couleur de la ferme), une démarche est orange. */
const ACHAT = '#8E1F33';
const VENTE = colors.primary;
const ORANGE = '#D2793B';

/**
 * Les boutons de la chèvrerie qui ouvrent directement leur écran, sans bulles. Le suivi des mouvements, le bordereau de perte et le recensement
 * se génèrent depuis le dossier PAC, qui garde leur année et leur état.
 */
const ROUTE_DIRECTE: Record<string, string> = {
  lots: ROUTES.CHEPTEL_LOTS,
  boucles: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES),
  bilanAnnuel: ROUTES.CHEPTEL_BILAN,
  carnetNaissance: ROUTES.CHEPTEL_NAISSANCES,
  // Les fiches des intervenants : une page qui regroupe leurs contacts, leurs factures et toutes leurs actions.
  abattoir: ROUTES.lieu('abattoir'),
  veterinaire: ROUTES.lieu('veterinaire'),
  aliments: ROUTES.lieu('aliments'),
  equarrissage: ROUTES.lieu('equarrissage'),
  carburant: ROUTES.lieu('carburant'),
  garage: ROUTES.lieu('garage'),
  assurance: ROUTES.lieu('assurance'),
  banque: ROUTES.lieu('banque'),
  groupement: ROUTES.lieu('groupement'),
  groupementSanitaire: ROUTES.lieu('groupementSanitaire'),
  organismes: ROUTES.lieu('organismes'),
  emballages: ROUTES.lieu('emballages'),
  laiterie: ROUTES.PRODUCTION_LAITERIE,
  // Les clients du travail du produit, par catégorie.
  particuliers: ROUTES.lieu('particuliers'),
  surfacesCommerciales: ROUTES.lieu('surfacesCommerciales'),
  entreprises: ROUTES.lieu('entreprises'),
  // Dans la transformation : fabriquer, les lots, leurs rappels, la qualité du lait et la réservation d'un produit.
  fabriquerFromage: ROUTES.productionFabrication(PRODUIT_A_LOTS.FROMAGE),
  fabriquerCharcuterie: ROUTES.productionFabrication(PRODUIT_A_LOTS.CHARCUTERIE),
  lotsFromages: ROUTES.PRODUCTION_FROMAGES,
  rappelsLots: ROUTES.PRODUCTION_RAPPELS_LOTS,
  qualiteLait: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
  reserver: ROUTES.COMMERCIAL_COMMANDE,
};

/** Où est le bouton : dans la colonne des intervenants, à gauche d'une carte, ou dans le panneau du bas d'un intérieur. */
type Zone = 'interieur' | 'cote';

/** Ce qu'on a ouvert en entrant par la porte d'une carte : la chèvrerie (l'exploitation) ou la transformation. */
type Interieur = 'exploitation' | 'transformation';

/**
 * La direction de l'arc des bulles d'après la place du bouton (0 : vers la droite, 90 : vers le haut, 180 : vers la gauche, 270 : vers le bas) :
 * les boutons à gauche d'une carte ouvrent vers la droite, sur la carte ; ceux d'un intérieur (en bas de l'écran) vers le haut.
 */
export function directionDesBulles(zone: Zone, x: number, largeur: number): number {
  // Un bouton à gauche d'une carte : les bulles s'ouvrent vers la droite, sur la carte.
  if (zone === 'cote') return 0;
  // Dans un intérieur, les boutons sont en bas : les bulles s'ouvrent vers le haut, de biais vers le côté libre près d'un bord.
  return x < largeur / 3 ? 45 : x > (2 * largeur) / 3 ? 135 : 90;
}

/** Ce qui reste éclairé quand le reste s'assombrit : le bouton touché, refait par-dessus l'ombre (sa place, sa taille, son dessin). */
interface Lumiere {
  gauche: number;
  haut: number;
  diametre: number;
  icone: ReactNode;
}

interface Menu {
  cible: CibleDesBulles;
  /** La direction de l'arc des bulles. */
  direction: number;
  /** Le centre du bouton dans l'accueil, et la hauteur de l'accueil (pour garder les bulles à l'écran). */
  x: number;
  y: number;
  hauteur: number;
  largeur: number;
  /** La couleur des bulles : celle du bouton touché. */
  couleur: string;
  lumiere: Lumiere;
  /** Le nom du bouton touché : on l'écrit sous lui, puisque les boutons n'ont pas de texte. */
  titre?: string;
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
 * chèvrerie, ses boutons (santé, grange, organismes, nouveau, lots, boucles, estive, bilan, carnet) ; sous elle la carte Transformation (fromages, boucherie / charcuterie, viande), dont l'intérieur a la
 * fromagerie, la viande, la charcuterie et le stock. Chaque bouton fait sortir ses actions en bulles. En bas, l'année, l'espèce, le didacticiel
 * et les réglages. Une fenêtre annonce une fois par jour ce qui attend.
 */
export default function AccueilFerme() {
  const router = useRouter();
  const f = useFermeAccueil();
  const { espece } = useEtablissement();
  // Sans en-tête, le contenu commence sous l'encoche et la barre d'état.
  const { top: haut } = useSafeAreaInsets();
  const racine = useRef<View>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const [estiveOuverte, setEstiveOuverte] = useState(false);
  const [interieur, setInterieur] = useState<Interieur | null>(null);
  // L'accueil est rouvert par son adresse : la maison (le paramètre change à chaque appui) le montre sur la carte ; la flèche de retour d'une page ouverte
  // depuis un bouton le montre dans l'intérieur où l'on était (« interieur »).
  const { accueil, interieur: interieurDemande } = useLocalSearchParams<{
    accueil?: string;
    interieur?: string;
  }>();
  const cleAccueil = `${accueil ?? ''}|${interieurDemande ?? ''}`;
  const [cleVue, setCleVue] = useState(cleAccueil);
  if (cleAccueil !== cleVue) {
    setCleVue(cleAccueil);
    setInterieur(
      interieurDemande === 'exploitation' || interieurDemande === 'transformation' ? interieurDemande : null,
    );
    setMenu(null);
  }
  /** Ouvre une page depuis un bouton : la flèche de retour y ramènera, dans l'intérieur où l'on était. */
  const ouvrir = (route: string) => {
    noterOrigine(ROUTES.retourAccueil(interieur ?? undefined), route);
    router.push(route as never);
  };
  const jour = useFenetreDuJour(f.minuteurs, f.stats !== null);

  // Les intervenants extérieurs, en colonnes sans texte sur les cartes (le nom s'affiche quand on touche le bouton) : sur celle de l'exploitation,
  // ceux qui interviennent sur les bêtes (l'abattoir, le vétérinaire, l'aliment, l'équarrisseur) et ses fournisseurs et partenaires (la pompe,
  // le garage, l'assurance, la banque, les groupements) ; sur celle de la transformation, les clients (la laiterie, le commerce), les fournisseurs
  // d'emballages et les contacts. Les organismes et la qualité du lait (des démarches) sont en orange.
  const surLesBetes: EntreeDeColonne[] = [
    {
      cle: 'abattoir',
      titre: C.abattoir,
      icone: iconeMCI('factory'),
      pastille: f.lotsAFacturer,
      couleur: ACHAT,
    },
    { cle: 'veterinaire', titre: C.veterinaire, icone: iconeMCI('stethoscope'), couleur: ACHAT },
    { cle: 'aliments', titre: C.alimentation, icone: iconeIon('nutrition'), couleur: ACHAT },
    {
      cle: 'equarrissage',
      titre: C.equarrissage,
      icone: iconeMCI('grave-stone'),
      pastille: f.morts,
      couleur: ACHAT,
    },
    // Les fournisseurs et partenaires de l'exploitation : le carburant, les réparations, l'assurance, la banque, les groupements.
    { cle: 'carburant', titre: C.carburant, icone: iconeMCI('gas-station'), couleur: ACHAT },
    { cle: 'garage', titre: C.garage, icone: iconeMCI('car-wrench'), couleur: ACHAT },
    { cle: 'assurance', titre: C.assurance, icone: iconeIon('shield-checkmark'), couleur: ACHAT },
    { cle: 'banque', titre: C.banque, icone: iconeIon('card'), couleur: ACHAT },
    { cle: 'groupement', titre: C.groupement, icone: iconeMCI('handshake'), couleur: ACHAT },
    { cle: 'groupementSanitaire', titre: C.groupementSanitaire, icone: iconeMCI('shield-cross'), couleur: ACHAT },
  ];
  // Les démarches (les organismes, les contrôles) se distinguent des personnes et des entreprises par leur couleur : l'orange.
  const demarchesExploitation: EntreeDeColonne[] = [
    { cle: 'organismes', titre: C.organismes, icone: iconeMCI('bank'), couleur: ORANGE },
  ];
  const commerce: EntreeDeColonne[] = [
    { cle: 'laiterie', titre: C.laiterie, icone: iconeIon('water'), couleur: VENTE },
    // Les clients, par catégorie : les particuliers, les surfaces commerciales, les entreprises.
    { cle: 'particuliers', titre: C.particuliers, icone: iconeIon('person'), couleur: VENTE },
    { cle: 'surfacesCommerciales', titre: C.surfacesCommerciales, icone: iconeIon('storefront'), couleur: VENTE },
    { cle: 'entreprises', titre: C.entreprises, icone: iconeIon('business'), couleur: VENTE },
    { cle: 'emballages', titre: C.emballages, icone: iconeMCI('package-variant-closed'), couleur: ACHAT },
  ];
  const demarchesTransformation: EntreeDeColonne[] = [
    { cle: 'qualiteLait', titre: C.qualiteLait, icone: iconeIon('flask'), couleur: ORANGE },
  ];
  // Dans la chèvrerie : ce qu'on fait avec les animaux, puis leurs documents (tous avec la même icône).
  const interneExploitation: EntreeDeColonne[][] = [
    // La ligne du haut : le troupeau au quotidien (la santé, la grange, ce qu'on ajoute, les lots).
    [
      { cle: 'sante', titre: C.sante, icone: iconeIon('medkit'), couleur: ORANGE },
      { cle: 'grange', titre: C.grange, icone: iconeMCI('corn'), couleur: ORANGE },
      { cle: 'nouveau', titre: C.nouveau, icone: iconeIon('add-circle'), couleur: ORANGE },
      { cle: 'lots', titre: C.lots, icone: iconeIon('layers'), couleur: ORANGE },
    ],
    // La ligne du bas : l'administratif et les suivis (organismes, boucles, estive, bilan, carnet).
    [
      { cle: 'organismes', titre: C.organismes, icone: iconeMCI('bank'), couleur: ORANGE },
      { cle: 'boucles', titre: C.boucles, icone: iconeIon('pricetag'), couleur: ORANGE },
      { cle: 'estive', titre: C.estive, icone: iconeIon('trail-sign'), couleur: ORANGE },
      { cle: 'bilanAnnuel', titre: C.bilanAnnuel, icone: iconeIon('stats-chart'), couleur: ORANGE },
      { cle: 'carnetNaissance', titre: C.carnetNaissance, icone: iconeIon('book'), couleur: ORANGE },
    ],
  ];
  // Dans la transformation : fabriquer, les lots, leurs rappels, la qualité du lait et la réservation d'un produit.
  const interneTransformation: EntreeDeColonne[] = [
    { cle: 'fabriquerFromage', titre: C.fabriquerFromage, icone: iconeMCI('pot-mix'), couleur: VENTE },
    { cle: 'fabriquerCharcuterie', titre: C.fabriquerCharcuterie, icone: iconeMCI('knife'), couleur: VENTE },
    { cle: 'lotsFromages', titre: C.lotsFromages, icone: iconeIon('layers'), couleur: VENTE },
    {
      cle: 'rappelsLots',
      titre: C.rappelsLots,
      icone: iconeIon('notifications'),
      pastille: f.lotsARappeler,
      couleur: VENTE,
    },
    { cle: 'qualiteLait', titre: C.qualiteLait, icone: iconeIon('flask'), couleur: VENTE },
    { cle: 'reserver', titre: C.reserver, icone: iconeIon('bookmark'), couleur: VENTE },
  ];

  /** Ouvre le menu d'un bouton à partir de sa place dans la fenêtre : on la ramène à celle de l'accueil. */
  const ouvrirMenu = (cible: CibleDesBulles, zone: Zone, ancre: AncreBouton, entree: EntreeDeColonne) => {
    racine.current?.measureInWindow((rx, ry, largeur, hauteur) => {
      const gauche = ancre.x - rx;
      const haut = ancre.y - ry;
      const x = gauche + ancre.largeur / 2;
      setMenu({
        cible,
        direction: directionDesBulles(zone, x, largeur),
        x,
        y: haut + ancre.hauteur / 2,
        hauteur,
        largeur,
        // Les bulles ont la couleur du bouton d'où elles sortent.
        titre: entree.titre,
        couleur: entree.couleur ?? colors.primary,
        lumiere: { gauche, haut, diametre: ancre.largeur, icone: entree.icone },
      });
    });
  };
  const surBouton = (zone: Zone, cle: string, ancre: AncreBouton) => {
    if (cle === 'estive') setEstiveOuverte(true);
    else if (cle === 'stock') ouvrir(ROUTES.lieu('entrepot'));
    else if (ROUTE_DIRECTE[cle]) ouvrir(ROUTE_DIRECTE[cle]);
    else {
      const entree = [
        ...surLesBetes,
        ...demarchesExploitation,
        ...commerce,
        ...demarchesTransformation,
        ...interneExploitation.flat(),
        ...interneTransformation,
      ].find((e) => e.cle === cle);
      if (entree) ouvrirMenu(cle as CibleDesBulles, zone, ancre, entree);
    }
  };
  const surCote = (cle: string, ancre: AncreBouton) => surBouton('cote', cle, ancre);
  const surInterne = (cle: string, ancre: AncreBouton) => surBouton('interieur', cle, ancre);
  const choisir = (action: ActionDeLieu) => {
    setMenu(null);
    ouvrir(action.route);
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
          {estBureau() ? (
            <BandeauFerme onRappels={() => setRappelsOuverts(true)} />
          ) : (
            // Sur le téléphone : les menus qu'on touche rarement sont en haut, loin du pouce ; le bandeau qu'on utilise sans cesse est tout en bas.
            <BarreHauteFerme />
          )}
          {estBureau() ? null : <NomFerme />}
          <RappelSauvegarde />
        </View>
      </View>
      <ScrollView
        style={styles.corps}
        contentContainerStyle={[styles.corpsContenu, interieur ? styles.corpsInterieur : null]}
        showsVerticalScrollIndicator={false}
      >
        {/* Le contenu est recréé quand l'espèce change : il relit ses données et reprend les mots et les dessins de la nouvelle espèce. */}
        <View key={espece} style={[styles.centre, interieur ? styles.centreInterieur : null]}>
          {interieur === 'exploitation' ? (
            <View style={styles.interieur}>
              <ChevrerieInterieure vedettes={f.vedettes} />
            </View>
          ) : interieur === 'transformation' ? (
            <View style={styles.interieur}>
              <TransformationInterieure />
            </View>
          ) : (
            <>
              <View style={[styles.panneau, f.estive ? styles.panneauEstive : null]}>
                <ColonneFerme
                  entrees={[...surLesBetes, ...demarchesExploitation]}
                  onAppui={surCote}
                  cote
                  titre={TEXTES.accueil.ferme.intervenants}
                />
                <View style={styles.enclos}>
                  <EnclosFerme
                    vedettes={f.vedettes}
                    nombreAnimaux={f.stats?.totalVivantes}
                    naissances={f.stats?.cabritsAnnee}
                    estive={f.estive}
                    onAppui={() => setInterieur('exploitation')}
                    onEntrer={() => setInterieur('exploitation')}
                  />
                </View>
              </View>
              <TransformationFerme
                compte={f.transformation}
                onEntrer={() => setInterieur('transformation')}
                cote={
                  <ColonneFerme
                    entrees={[...commerce, ...demarchesTransformation]}
                    onAppui={surCote}
                    cote
                    deuxColonnes
                    titre={TEXTES.accueil.ferme.intervenants}
                  />
                }
              />
            </>
          )}
        </View>
      </ScrollView>
      {/* Les boutons de l'intérieur où l'on est : en bas, sous le pouce, juste au-dessus de la barre du bas. */}
      {interieur === 'exploitation' ? (
        <PanneauInterieur lignes={interneExploitation} onAppui={surInterne} accent={ORANGE} />
      ) : interieur === 'transformation' ? (
        <PanneauInterieur lignes={[interneTransformation]} onAppui={surInterne} accent={VENTE} />
      ) : null}
      {/* Sous Windows, les menus sont en bas comme avant ; sur le téléphone, ils sont dans la barre du haut. */}
      {estBureau() ? (
        <BarreBasseFerme annees={f.annees} annee={f.annee} onChoisirAnnee={f.setAnneeActive} />
      ) : null}

      {/* Les bulles du bouton touché : par-dessus tout ; un appui à côté les referme. */}
      {menu ? (
        <View style={styles.couche}>
          {/* Le reste s'assombrit ; un appui sur l'ombre referme les bulles. */}
          <>
            <Pressable
              style={styles.fond}
              onPress={() => setMenu(null)}
              accessibilityRole="button"
              accessibilityLabel={TEXTES.commun.general.fermer}
            />
            {/* Le bouton touché, refait par-dessus l'ombre : il reste en pleine couleur. */}
            <View
              pointerEvents="none"
              style={[
                styles.boutonEclaire,
                {
                  left: menu.lumiere.gauche,
                  top: menu.lumiere.haut,
                  width: menu.lumiere.diametre,
                  height: menu.lumiere.diametre,
                  borderRadius: menu.lumiere.diametre / 2,
                  backgroundColor: menu.couleur,
                },
              ]}
            >
              {menu.lumiere.icone}
            </View>
            {menu.titre ? (
              <View
                pointerEvents="none"
                style={[
                  styles.etiquette,
                  {
                    left: Math.min(
                      Math.max(4, menu.lumiere.gauche + menu.lumiere.diametre / 2 - 70),
                      menu.largeur - 144,
                    ),
                    top: menu.lumiere.haut + menu.lumiere.diametre + 4,
                  },
                ]}
              >
                <Text style={styles.etiquetteTexte}>{menu.titre}</Text>
              </View>
            ) : null}
          </>
          <BullesLieu
            x={menu.x}
            y={yBulles}
            actions={actions}
            centreDeg={menu.direction}
            couleur={menu.couleur}
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
  // Le corps remplit la hauteur : les deux cartes (exploitation et transformation) se la partagent à parts égales, sans dépasser l'écran.
  corpsContenu: { flexGrow: 1, paddingHorizontal: 10, paddingBottom: 12, gap: 10 },
  // Les six premiers intervenants se partagent la largeur ; les contacts, seuls au bout, ont la part d'un bouton.
  centre: { flex: 1, gap: 10 },
  panneau: {
    flex: 3,
    flexDirection: 'row',
    minHeight: HAUTEUR_MIN_EXPLOITATION,
    backgroundColor: '#E1ECCB',
    borderRadius: 18,
    padding: 10,
    gap: 10,
    borderWidth: 2,
    borderColor: '#B8CC94',
  },
  panneauEstive: { backgroundColor: '#DCE8F2', borderColor: '#B4C9DC' },
  enclos: { flex: 1, minHeight: 130 },
  // Dans la chèvrerie, l'intérieur remplit toute la place, jusqu'à la barre du bas.
  // Pas d'overflow: hidden ici : sur Android, le rognage reste figé à la hauteur du premier calcul et cache tout l'intérieur.
  interieur: { minHeight: 520, flexGrow: 1 },
  corpsInterieur: { flexGrow: 1 },
  centreInterieur: { flexGrow: 1 },
  couche: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50 },
  fond: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  etiquette: { position: 'absolute', width: 140, alignItems: 'center' },
  etiquetteTexte: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  boutonEclaire: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.blanc,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
