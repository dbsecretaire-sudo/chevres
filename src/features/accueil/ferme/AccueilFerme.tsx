import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { actionsDuLieu, type ActionDeLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { BarreBasseFerme } from '@/features/accueil/ferme/BarreBasseFerme';
import { BullesLieu } from '@/features/accueil/ferme/BullesLieu';
import { ChevrerieInterieure } from '@/features/accueil/ferme/ChevrerieInterieure';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { EnclosFerme } from '@/features/accueil/ferme/EnclosFerme';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { NomFerme } from '@/features/accueil/ferme/NomFerme';
import { TransformationFerme } from '@/features/accueil/ferme/TransformationFerme';
import { TransformationInterieure } from '@/features/accueil/ferme/TransformationInterieure';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  decalageVertical,
  ecartDesBulles,
  positionsEnArc,
  rayonDesBulles,
} from '@/features/accueil/services/bullesFerme';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
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
/** Le bleu de l'estive : la carte de l'exploitation et ses bulles, quand le troupeau est à la montagne. */
const ESTIVE = '#3E7CB1';
/** La hauteur au moins de chaque carte : de quoi y loger la colonne de ses boutons. */
const HAUTEUR_MIN_DES_CARTES = 236;

/**
 * Les boutons de la chèvrerie qui ouvrent directement leur écran, sans bulles. Le suivi des mouvements, le bordereau de perte et le recensement
 * se génèrent depuis le dossier PAC, qui garde leur année et leur état.
 */
const ROUTE_DIRECTE: Record<string, string> = {
  alimentation: ROUTES.SANTE_ALIMENTATION,
  lots: ROUTES.CHEPTEL_LOTS,
  traitements: ROUTES.CHEPTEL_TRAITEMENTS,
  boucles: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES),
  suivi: ROUTES.CHEPTEL_DOSSIER_PAC,
  circulation: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION,
  bordereau: ROUTES.CHEPTEL_DOSSIER_PAC,
  recensement: ROUTES.CHEPTEL_DOSSIER_PAC,
  generes: ROUTES.CHEPTEL_BIBLIOTHEQUE,
  // Sur la carte de la transformation : les clients et leurs ventes.
  clients: ROUTES.lieu('commercial'),
  // Dans la transformation : fabriquer, les lots, leurs rappels, la qualité du lait et la réservation d'un produit.
  fabriquerFromage: ROUTES.productionFabrication(PRODUIT_A_LOTS.FROMAGE),
  fabriquerCharcuterie: ROUTES.productionFabrication(PRODUIT_A_LOTS.CHARCUTERIE),
  lotsFromages: ROUTES.PRODUCTION_FROMAGES,
  rappelsLots: ROUTES.PRODUCTION_RAPPELS_LOTS,
  qualiteLait: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
  reserver: ROUTES.COMMERCIAL_COMMANDE,
};

/** Où est le bouton : parmi les intervenants du haut, sur une carte (l'exploitation), ou dans l'un des deux intérieurs. */
type Zone = 'lieux' | 'exploitation' | 'interieur' | 'cote';

/** Ce qu'on a ouvert en entrant par la porte d'une carte : la chèvrerie (l'exploitation) ou la transformation. */
type Interieur = 'exploitation' | 'transformation';

/**
 * La direction de l'arc des bulles d'après la place du bouton (0 : vers la droite, 90 : vers le haut, 180 : vers la gauche, 270 : vers le bas) :
 * les lieux du haut ouvrent vers le côté libre (la droite au bord gauche, la gauche au bord droit) ou vers le bas ; les boutons de l'exploitation, vers le haut.
 */
export function directionDesBulles(zone: Zone, x: number, largeur: number): number {
  if (zone === 'exploitation') return 90;
  // Un bouton sur le côté d'une carte : les bulles s'ouvrent vers la gauche, sur la carte.
  if (zone === 'cote') return 180;
  // Dans un intérieur, les boutons sont en haut : les bulles s'ouvrent vers le bas, de biais vers le côté libre près d'un bord.
  if (zone === 'interieur') return x < largeur / 3 ? 315 : x > (2 * largeur) / 3 ? 225 : 270;
  if (x < largeur / 3) return 0;
  if (x > (2 * largeur) / 3) return 180;
  return 270;
}

/** Ce qui reste éclairé quand le reste s'assombrit : la carte touchée (la zone telle quelle), ou le bouton touché (refait par-dessus l'ombre). */
type Lumiere =
  | { forme: 'carte'; gauche: number; haut: number; largeur: number; hauteur: number }
  | { forme: 'bouton'; gauche: number; haut: number; diametre: number; icone: ReactNode };

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

/** Les quatre plaques d'ombre autour d'une zone éclairée (en haut, en bas, à gauche, à droite) : la zone elle-même reste à découvert. */
function plaques(
  zone: { gauche: number; haut: number; largeur: number; hauteur: number },
  largeur: number,
  hauteur: number,
) {
  const bas = zone.haut + zone.hauteur;
  const droite = zone.gauche + zone.largeur;
  return [
    { left: 0, right: 0, top: 0, bottom: hauteur - zone.haut },
    { left: 0, right: 0, top: bas, bottom: 0 },
    { left: 0, width: zone.gauche, top: zone.haut, height: zone.hauteur },
    { left: droite, right: 0, top: zone.haut, height: zone.hauteur },
  ] satisfies object[];
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
 * chèvrerie, ses boutons (alimentation, lots, traitements, boucles, estive, documents) ; sous elle la carte Transformation (fromages, boucherie / charcuterie, viande), dont l'intérieur a la
 * fromagerie, la viande, la charcuterie et le stock. Chaque bouton fait sortir ses actions en bulles. En bas, l'année, l'espèce, le didacticiel
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
  const [interieur, setInterieur] = useState<Interieur | null>(null);
  const jour = useFenetreDuJour(f.minuteurs, f.stats !== null);

  // Les intervenants extérieurs, en trois groupes, sans texte (le nom s'affiche quand on touche le bouton) :
  // ceux qui interviennent sur les bêtes (le vétérinaire, l'équarrisseur, l'abattoir, l'aliment), en colonne sur la carte de l'exploitation ;
  // le commerce (la laiterie, les clients), en colonne sur la carte de la transformation ; et le fonctionnement (fournisseurs, organismes,
  // contacts), en haut.
  const surLesBetes: EntreeDeColonne[] = [
    { cle: 'veterinaire', titre: C.veterinaire, icone: iconeIon('add'), couleur: ACHAT },
    {
      cle: 'equarrissage',
      titre: C.equarrissage,
      icone: iconeMCI('grave-stone'),
      pastille: f.morts,
      couleur: ACHAT,
    },
    {
      cle: 'abattoir',
      titre: C.abattoir,
      icone: iconeMCI('factory'),
      pastille: f.lotsAFacturer,
      couleur: ACHAT,
    },
    { cle: 'aliments', titre: C.alimentation, icone: iconeIon('nutrition'), couleur: ACHAT },
  ];
  const commerce: EntreeDeColonne[] = [
    { cle: 'laiterie', titre: C.laiterie, icone: iconeIon('water'), couleur: VENTE },
    { cle: 'clients', titre: C.clients, icone: iconeIon('cart'), couleur: VENTE },
  ];
  const fonctionnement: EntreeDeColonne[] = [
    { cle: 'fournisseurs', titre: C.fournisseurs, icone: iconeMCI('truck-delivery'), couleur: ACHAT },
    { cle: 'organismes', titre: C.organismes, icone: iconeMCI('bank'), couleur: VENTE },
    { cle: 'contacts', titre: C.contacts, icone: iconeIon('people'), couleur: NEUTRE },
  ];
  // Dans la chèvrerie : ce qu'on fait avec les animaux, puis leurs documents (tous avec la même icône).
  const interneExploitation: EntreeDeColonne[] = [
    { cle: 'alimentation', titre: C.alimentation, icone: iconeIon('nutrition'), couleur: ORANGE },
    { cle: 'lots', titre: C.lots, icone: iconeIon('layers'), couleur: ORANGE },
    { cle: 'traitements', titre: C.traitements, icone: iconeIon('medkit'), couleur: ORANGE },
    { cle: 'boucles', titre: C.boucles, icone: iconeIon('pricetag'), couleur: ORANGE },
    { cle: 'estive', titre: C.estive, icone: iconeIon('trail-sign'), couleur: ORANGE },
    { cle: 'suivi', titre: C.suivi, icone: iconeIon('document-text'), couleur: ORANGE },
    { cle: 'circulation', titre: C.circulation, icone: iconeIon('document-text'), couleur: ORANGE },
    { cle: 'bordereau', titre: C.bordereau, icone: iconeIon('document-text'), couleur: ORANGE },
    { cle: 'recensement', titre: C.recensement, icone: iconeIon('document-text'), couleur: ORANGE },
    { cle: 'generes', titre: C.generes, icone: iconeIon('document-text'), couleur: ORANGE },
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
  const ouvrirMenu = (cible: CibleDesBulles, zone: Zone, ancre: AncreBouton, entree?: EntreeDeColonne) => {
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
        // Les bulles ont la couleur du bouton d'où elles sortent ; l'exploitation, la sienne (le bleu quand le troupeau est à l'estive).
        titre: entree?.titre,
        couleur: entree?.couleur ?? (f.estive ? ESTIVE : colors.primary),
        lumiere: entree
          ? { forme: 'bouton', gauche, haut, diametre: ancre.largeur, icone: entree.icone }
          : { forme: 'carte', gauche, haut, largeur: ancre.largeur, hauteur: ancre.hauteur },
      });
    });
  };
  const surBouton = (zone: Zone, cle: string, ancre: AncreBouton) => {
    if (cle === 'estive') setEstiveOuverte(true);
    else if (cle === 'stock') router.push(ROUTES.lieu('entrepot') as never);
    else if (ROUTE_DIRECTE[cle]) router.push(ROUTE_DIRECTE[cle] as never);
    else {
      const entree = [
        ...surLesBetes,
        ...commerce,
        ...fonctionnement,
        ...interneExploitation,
        ...interneTransformation,
      ].find((e) => e.cle === cle);
      ouvrirMenu(cle as CibleDesBulles, zone, ancre, entree);
    }
  };
  const surLieu = (cle: string, ancre: AncreBouton) => surBouton('lieux', cle, ancre);
  const surCote = (cle: string, ancre: AncreBouton) => surBouton('cote', cle, ancre);
  const surInterne = (cle: string, ancre: AncreBouton) => surBouton('interieur', cle, ancre);
  const surEnclos = () => {
    enclos.current?.measureInWindow((x, y, largeur, hauteur) =>
      ouvrirMenu('enclos', 'exploitation', { x, y, largeur, hauteur }),
    );
  };
  const choisir = (action: ActionDeLieu) => {
    setMenu(null);
    router.push(action.route as never);
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
          <BandeauFerme
            balance={f.stats?.soldeFactures}
            rappels={f.nombreDeRappels}
            onRappels={() => setRappelsOuverts(true)}
          />
          {estBureau() ? null : <NomFerme />}
          <RappelSauvegarde />
        </View>
      </View>
      <ScrollView
        style={styles.corps}
        contentContainerStyle={[styles.corpsContenu, interieur ? styles.corpsInterieur : null]}
        showsVerticalScrollIndicator={false}
      >
        {/* Le fonctionnement de l'exploitation, en haut : pas dans un intérieur, où l'on est chez soi. */}
        {interieur ? null : (
          <View style={styles.lieux}>
            <ColonneFerme entrees={fonctionnement} onAppui={surLieu} grille sansTitre />
          </View>
        )}
        <View style={[styles.centre, interieur ? styles.centreInterieur : null]}>
          {interieur === 'exploitation' ? (
            <View style={styles.interieur}>
              <ChevrerieInterieure
                vedettes={f.vedettes}
                onSortir={() => setInterieur(null)}
                boutons={interneExploitation}
                onAppuiBouton={surInterne}
              />
            </View>
          ) : interieur === 'transformation' ? (
            <View style={styles.interieur}>
              <TransformationInterieure
                onSortir={() => setInterieur(null)}
                boutons={interneTransformation}
                onAppuiBouton={surInterne}
              />
            </View>
          ) : (
            <>
              {/* Toute la carte : c'est elle qui reste éclairée quand ses bulles s'ouvrent. */}
              <View
                ref={enclos}
                collapsable={false}
                style={[styles.panneau, f.estive ? styles.panneauEstive : null]}
              >
                <View style={styles.enclos}>
                  <EnclosFerme
                    vedettes={f.vedettes}
                    nombreAnimaux={f.stats?.totalVivantes}
                    naissances={f.stats?.cabritsAnnee}
                    estive={f.estive}
                    onAppui={surEnclos}
                    onEntrer={() => setInterieur('exploitation')}
                  />
                </View>
                <ColonneFerme entrees={surLesBetes} onAppui={surCote} cote />
              </View>
              <TransformationFerme
                compte={f.transformation}
                onEntrer={() => setInterieur('transformation')}
                cote={<ColonneFerme entrees={commerce} onAppui={surCote} cote />}
              />
            </>
          )}
        </View>
      </ScrollView>
      <BarreBasseFerme annees={f.annees} annee={f.annee} onChoisirAnnee={f.setAnneeActive} />

      {/* Les bulles du bouton touché : par-dessus tout ; un appui à côté les referme. */}
      {menu ? (
        <View style={styles.couche}>
          {menu.lumiere.forme === 'carte' ? (
            // La carte touchée reste éclairée : l'ombre l'entoure de quatre côtés.
            <>
              {plaques(menu.lumiere, menu.largeur, menu.hauteur).map((style, i) => (
                <Pressable
                  key={i}
                  style={[styles.fond, style]}
                  onPress={() => setMenu(null)}
                  accessibilityRole="button"
                  accessibilityLabel={TEXTES.commun.general.fermer}
                />
              ))}
            </>
          ) : (
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
          )}
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
  lieux: { marginBottom: 16 },
  centre: { flex: 1, gap: 10 },
  panneau: {
    flex: 1,
    flexDirection: 'row',
    minHeight: HAUTEUR_MIN_DES_CARTES,
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
  interieur: { minHeight: 520, flexGrow: 1, borderRadius: 16, overflow: 'hidden' },
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
