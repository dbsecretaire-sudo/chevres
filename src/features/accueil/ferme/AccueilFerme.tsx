import { useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { actionsDuLieu, type ActionDeLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';
import { BasculeFerme, type CoteDeLaFerme } from '@/features/accueil/ferme/BasculeFerme';
import { BullesLieu } from '@/features/accueil/ferme/BullesLieu';
import { ROUTE_DIRECTE } from '@/features/accueil/ferme/routesFerme';
import { coteVoisin, estUnCote, lireDernierCote, noterDernierCote } from '@/features/accueil/ferme/dernierCote';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { NomFerme } from '@/features/accueil/ferme/NomFerme';
import { routeDuTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { SceneExploitation } from '@/features/accueil/ferme/SceneExploitation';
import { AccueilSobre } from '@/features/accueil/ferme/AccueilSobre';
import { lignesDeTransformation, SceneTransformation } from '@/features/accueil/ferme/SceneTransformation';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { afficheSobre } from '@/shared/utils/affichage';
import type { AncreBouton, EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  decalageVertical,
  ecartDesBulles,
  positionsEnArc,
  rayonDesBulles,
} from '@/features/accueil/services/bullesFerme';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';

const C = TEXTES.accueil.ferme.colonnes;
const TAILLE_ICONE = 30;
/** Les symboles qui se baladent sur la plaque du côté Agritourisme : le 4x4, le repas, la dégustation. */
const SYMBOLES_AGRITOURISME = [
  { cle: 'quatre-quatre', emoji: '🚙' },
  { cle: 'repas', emoji: '🍽️' },
  { cle: 'fromage', emoji: '🧀' },
];
/** Le diamètre du disque qui reste éclairé quand on touche un compartiment. */
const DIAMETRE_ECLAIRE = 52;
/** Les couleurs des lieux : un achat est bordeaux, une vente (une recette) est verte (la couleur de la ferme), une démarche est orange. */
const ACHAT = '#8E1F33';
const VENTE = colors.primary;
const ORANGE = '#D2793B';


/** Le côté de la ferme montré : l'exploitation (le troupeau) ou le travail du produit (la fromagerie). */
type Cote = CoteDeLaFerme['cle'];


/**
 * La direction de l'arc des bulles d'après la place du compartiment (0 : vers la droite, 90 : vers le haut, 180 : vers la gauche, 270 : vers le bas) :
 * les compartiments sont en bas de la scène, les bulles s'ouvrent donc vers le haut, de biais vers le côté libre près d'un bord.
 */
export function directionDesBulles(x: number, largeur: number, nombre = 3): number {
  // Quatre bulles ou plus (les lots) s'étalent davantage : près d'un bord, l'arc penche plus vers l'intérieur pour rester à l'écran.
  const penche = nombre >= 4 ? 30 : 45;
  return x < largeur / 3 ? penche : x > (2 * largeur) / 3 ? 180 - penche : 90;
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
  /** Le nom du bouton touché : on l'écrit sous lui, puisque les boutons de la colonne de gauche n'ont pas de texte. */
  titre?: string;
}

const iconeMCI = (nom: keyof typeof MaterialCommunityIcons.glyphMap) => (
  <MaterialCommunityIcons name={nom} size={TAILLE_ICONE} color={colors.blanc} />
);
const iconeIon = (nom: keyof typeof Ionicons.glyphMap) => (
  <Ionicons name={nom} size={TAILLE_ICONE} color={colors.blanc} />
);

/**
 * L'accueil « ferme » de l'élevage : une scène sur tout l'écran, celle du côté choisi. L'exploitation : l'enclos, ses chèvres qui se promènent et
 * l'effectif. Le travail du produit : la fromagerie (inox, carrelage) et ce qu'on y fabrique et garde. À gauche de la scène, les intervenants (les
 * personnes et entreprises à qui l'on a affaire) ; à droite, la gestion (les rubriques de l'application, avec leur nom). En bas, la bascule entre les
 * deux côtés (ou un balayage de la scène), puis le bandeau de la ferme. Une fenêtre annonce une fois par jour ce qui attend.
 */
export default function AccueilFerme() {
  const router = useRouter();
  const f = useFermeAccueil();
  const comptable = useDispositionComptable();
  const { espece } = useEtablissement();
  // Sans en-tête, le contenu commence sous l'encoche et la barre d'état.
  const { top: haut } = useSafeAreaInsets();
  const racine = useRef<View>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const [cote, setCote] = useState<Cote>(lireDernierCote());
  const choisirCote = (nouveau: Cote) => {
    noterDernierCote(nouveau);
    setCote(nouveau);
    setMenu(null);
  };
  // L'accueil est rouvert par son adresse : la maison (le paramètre change à chaque appui) le montre sur le dernier côté vu ; la flèche de retour d'une
  // page ouverte depuis un bouton le montre sur le côté où l'on était (« interieur »).
  const { accueil, interieur: coteDemande } = useLocalSearchParams<{
    accueil?: string;
    interieur?: string;
  }>();
  const cleAccueil = `${accueil ?? ''}|${coteDemande ?? ''}`;
  const [cleVue, setCleVue] = useState(cleAccueil);
  if (cleAccueil !== cleVue) {
    setCleVue(cleAccueil);
    if (estUnCote(coteDemande)) {
      noterDernierCote(coteDemande);
      setCote(coteDemande);
    }
    setMenu(null);
  }
  /** Ouvre une page depuis un bouton : la flèche de retour y ramènera, sur le côté où l'on était. */
  const ouvrir = (route: string) => {
    noterOrigine(ROUTES.retourAccueil(cote), route);
    router.push(route as never);
  };
  const jour = useFenetreDuJour(f.minuteurs, f.stats !== null);

  // Un balayage de la scène change de côté : vers la gauche, le suivant (exploitation, atelier, agritourisme) ; vers la droite, le précédent.
  const balayage = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > 2 * Math.abs(g.dy),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) <= 50) return;
          const voisin = coteVoisin(lireDernierCote(), g.dx < 0 ? 1 : -1);
          noterDernierCote(voisin);
          setCote(voisin);
          setMenu(null);
        },
      }),
    [],
  );

  // À gauche de la scène de l'exploitation : ceux qui interviennent sur les bêtes (l'abattoir, le vétérinaire, l'aliment, l'équarrisseur) et ses
  // fournisseurs et partenaires (la pompe, le garage, l'assurance, la banque, les groupements). Les achats sont en bordeaux.
  const intervenantsExploitation: EntreeDeColonne[] = [
    // Une dépense (facture reçue) à saisir d'un appui : l'aliment, le carburant ou tout autre achat se rangent par leur catégorie.
    { cle: 'nouvelleFacture', titre: C.nouvelleFacture, icone: iconeIon('add-circle'), couleur: ACHAT },
    {
      cle: 'abattoir',
      titre: C.abattoir,
      icone: iconeMCI('factory'),
      pastille: f.lotsAFacturer,
      couleur: ACHAT,
    },
    {
      cle: 'equarrissage',
      titre: C.equarrissage,
      icone: iconeMCI('grave-stone'),
      couleur: ACHAT,
    },
    { cle: 'garage', titre: C.garage, icone: iconeMCI('car-wrench'), couleur: ACHAT },
    { cle: 'assurance', titre: C.assurance, icone: iconeIon('shield-checkmark'), couleur: ACHAT },
    { cle: 'banque', titre: C.banque, icone: iconeIon('card'), couleur: ACHAT },
    { cle: 'groupement', titre: C.groupement, icone: iconeMCI('handshake'), couleur: ACHAT },
    { cle: 'groupementSanitaire', titre: C.groupementSanitaire, icone: iconeMCI('shield-cross'), couleur: ACHAT },
  ];
  // À gauche de la scène du travail du produit : les clients (la laiterie, les particuliers, les surfaces commerciales, les entreprises), les
  // emballages, et la qualité du lait (une démarche : en orange).
  const intervenantsTransformation: EntreeDeColonne[] = [
    { cle: 'laiterie', titre: C.laiterie, icone: iconeIon('water'), couleur: VENTE },
    { cle: 'particuliers', titre: C.particuliers, icone: iconeIon('person'), couleur: VENTE },
    { cle: 'entreprises', titre: C.entreprises, icone: iconeIon('business'), couleur: VENTE },
    { cle: 'emballages', titre: C.emballages, icone: iconeMCI('package-variant-closed'), couleur: ACHAT },
    { cle: 'analyses', titre: C.analyses, icone: iconeIon('flask'), couleur: ORANGE },
    { cle: 'cadreReglementaireAtelier', titre: C.cadreReglementaire, icone: iconeIon('shield-checkmark'), couleur: ORANGE },
  ];
  // À droite de la scène de l'exploitation : la santé et la grange (en bulles), le cheptel (les animaux : liste, lots, ajouts, boucles, carnet de
  // naissance), les organismes, et les documents (l'estive) (bilan, dossier PAC, circulation, identification, historique).
  const gestionExploitation: EntreeDeColonne[] = [
    { cle: 'documents', titre: C.documents, icone: iconeIon('document-text'), couleur: ORANGE },
    { cle: 'organismes', titre: C.organismes, icone: iconeMCI('bank'), couleur: ORANGE },
    { cle: 'cheptel', titre: C.cheptel, icone: iconeIon('paw'), pastille: f.aCompleter, couleur: ORANGE },
    { cle: 'grange', titre: C.grange, icone: iconeMCI('barn'), couleur: ORANGE },
    { cle: 'bilanAnnuel', titre: C.bilanAnnuel, icone: iconeIon('stats-chart'), couleur: ORANGE },
    { cle: 'venteVivant', titre: C.venteVivant, icone: iconeMCI('truck-delivery'), pastille: f.ventesSansDocument, couleur: ORANGE },
  ];
  // À droite de la scène du travail du produit : le stock, la réservation d'un produit, les lots et fabriquer (en bulles), les ventes et la rentabilité de ce qu'on fabrique.
  const gestionTransformation: EntreeDeColonne[] = [
    { cle: 'stockFromagerie', titre: C.stock, icone: iconeIon('cube'), couleur: VENTE },
    { cle: 'reserver', titre: C.reserver, icone: iconeIon('bookmark'), couleur: VENTE },
    // Les lots : un seul bouton, dont les bulles ouvrent les lots (fromages, viande, charcuterie, plats préparés) ou leurs rappels (la pastille : ceux à faire).
    { cle: 'lots', titre: C.lotsAtelier, icone: iconeIon('layers'), pastille: f.lotsARappeler, couleur: '#6A767E' },
    // Fabriquer : un seul bouton, dont les bulles ouvrent la fabrication d'un fromage ou de charcuterie.
    { cle: 'fabriquer', titre: C.fabriquer, icone: iconeMCI('pot-mix'), couleur: '#6A767E' },
    { cle: 'ventesAtelier', titre: C.ventesAtelier, icone: iconeIon('cash'), couleur: VENTE },
    { cle: 'rentabiliteAtelier', titre: C.rentabilite, icone: iconeIon('stats-chart'), couleur: VENTE },
    { cle: 'registreAnalyses', titre: C.registreAnalyses, icone: iconeIon('flask'), couleur: '#6A767E' },
    { cle: 'recettes', titre: C.recettes, icone: iconeIon('book'), couleur: '#6A767E' },
  ];
  // Le côté Agritourisme : ceux qui viennent (les visiteurs, leurs groupes), ceux qui les envoient (l'office de tourisme) et ceux qui fournissent le repas.
  const intervenantsAgritourisme: EntreeDeColonne[] = [
    { cle: 'visiteurs', titre: C.visiteurs, icone: iconeMCI('hiking'), couleur: VENTE },
    { cle: 'groupesVisiteurs', titre: C.groupesVisiteurs, icone: iconeMCI('bus'), couleur: VENTE },
    { cle: 'repas', titre: C.repas, icone: iconeMCI('silverware-fork-knife'), couleur: ACHAT },
    { cle: 'tourisme', titre: C.tourisme, icone: iconeIon('compass'), couleur: ACHAT },
    { cle: 'cadreReglementaire', titre: C.cadreReglementaire, icone: iconeIon('shield-checkmark'), couleur: VENTE },
  ];
  // En bas de l'agritourisme : l'accueil des visiteurs, dont les compartiments sont les pages qui existent déjà (visites, formules, tarifs, ventes, rentabilité).
  const gestionAgritourisme: EntreeDeColonne[] = [
    { cle: 'nouvelleVisite', titre: C.nouvelleVisite, icone: iconeIon('add-circle'), couleur: VENTE },
    { cle: 'visites', titre: C.visites, icone: iconeIon('trail-sign'), couleur: VENTE },
    { cle: 'formules', titre: C.formules, icone: iconeIon('list'), couleur: VENTE },
    { cle: 'tarifs', titre: C.tarifs, icone: iconeIon('pricetag'), couleur: VENTE },
    { cle: 'ventesAgritourisme', titre: C.ventesAgritourisme, icone: iconeIon('cash'), couleur: VENTE },
    { cle: 'rentabilite', titre: C.rentabilite, icone: iconeIon('stats-chart'), couleur: VENTE },
  ];
  // La colonne est tout en bas de la scène, sous le pouce : les plus utilisés (l'abattoir, le vétérinaire ; la laiterie, les particuliers ; les
  // visiteurs), qui ouvrent chaque liste, sont donc rangés en dernier.
  const intervenants = (
    cote === 'exploitation'
      ? intervenantsExploitation
      : cote === 'transformation'
        ? intervenantsTransformation
        : intervenantsAgritourisme
  )
    .slice()
    .reverse();
  const gestion =
    cote === 'exploitation' ? gestionExploitation : cote === 'transformation' ? gestionTransformation : gestionAgritourisme;

  /** Ouvre le menu d'un compartiment à partir de sa place dans la fenêtre : on la ramène à celle de l'accueil. */
  const ouvrirMenu = (cible: CibleDesBulles, ancre: AncreBouton, entree: EntreeDeColonne) => {
    racine.current?.measureInWindow((rx, ry, largeur, hauteur) => {
      const gauche = ancre.x - rx;
      const sommet = ancre.y - ry;
      setMenu({
        cible,
        direction: directionDesBulles(gauche + ancre.largeur / 2, largeur, actionsDuLieu(cible).length),
        x: gauche + ancre.largeur / 2,
        y: sommet + ancre.hauteur / 2,
        hauteur,
        largeur,
        // Les bulles ont la couleur du bouton d'où elles sortent.
        titre: entree.titre,
        couleur: entree.couleur ?? colors.primary,
        // Le bouton éclairé est un disque (pas tout le compartiment), centré sur lui.
        lumiere: {
          gauche: gauche + ancre.largeur / 2 - DIAMETRE_ECLAIRE / 2,
          haut: sommet + ancre.hauteur / 2 - DIAMETRE_ECLAIRE / 2,
          diametre: DIAMETRE_ECLAIRE,
          icone: entree.icone,
        },
      });
    });
  };
  /** Un appui sur une maison (un intervenant) : sa fiche. */
  const surMaison = (cle: string) => {
    if (ROUTE_DIRECTE[cle]) ouvrir(ROUTE_DIRECTE[cle]);
  };
  /** Un appui sur un compartiment (la gestion) : sa page, ou ses bulles (la santé, la grange). */
  const surGestion = (cle: string, ancre: AncreBouton) => {
    if (ROUTE_DIRECTE[cle]) ouvrir(ROUTE_DIRECTE[cle]);
    else {
      const entree = [...gestionExploitation, ...gestionTransformation, ...gestionAgritourisme].find((e) => e.cle === cle);
      if (entree) ouvrirMenu(cle as CibleDesBulles, ancre, entree);
    }
  };
  const choisir = (action: ActionDeLieu) => {
    setMenu(null);
    ouvrir(action.route);
  };
  // L'affichage sobre n'a pas de bulles : un bouton qui en ouvrait (la grange, les lots, fabriquer) ouvre une petite liste.
  const [listeSobre, setListeSobre] = useState<CibleDesBulles | null>(null);
  const surGestionSobre = (cle: string) => {
    if (ROUTE_DIRECTE[cle]) ouvrir(ROUTE_DIRECTE[cle]);
    else setListeSobre(cle as CibleDesBulles);
  };
  /** Ce que le côté montré garde ou compte, en lignes (la plaque de l'atelier ou de l'agritourisme, l'effectif de l'exploitation). */
  const resumeSobre =
    cote === 'exploitation'
      ? [
          {
            cle: 'animaux',
            texte: f.estive ? TEXTES.accueil.ferme.zones.estive(f.estive.zone) : TEXTES.accueil.ferme.bandeau.animaux(f.stats?.totalVivantes ?? 0),
          },
          ...(f.stats ? [{ cle: 'nes', texte: TEXTES.accueil.ferme.zones.nes(f.stats.cabritsAnnee) }] : []),
        ]
      : cote === 'transformation'
        ? [
            ...lignesDeTransformation(f.transformation),
            ...(f.stockNegatif ? [{ cle: 'stock', texte: TEXTES.accueil.ferme.transformation.stockNegatif, alerte: true }] : []),
          ]
        : [
            { cle: 'aVenir', texte: TEXTES.accueil.ferme.agritourisme.visitesAVenir(f.agritourisme.aVenir) },
            { cle: 'visiteurs', texte: TEXTES.accueil.ferme.agritourisme.visiteurs(f.agritourisme.visiteurs) },
            ...(f.stockManquant ? [{ cle: 'stock', texte: TEXTES.accueil.ferme.agritourisme.stockManquant, alerte: true }] : []),
          ];
  const titreSobre =
    cote === 'exploitation'
      ? TEXTES.accueil.ferme.zones.enclos
      : cote === 'transformation'
        ? TEXTES.accueil.ferme.transformation.titre
        : TEXTES.accueil.ferme.agritourisme.titre;

  // Les bulles du menu ouvert : le bouton est décalé si elles sortaient de l'écran.
  // Les rappels de lots à faire s'affichent aussi en pastille sur leur bulle.
  const actions = (menu ? actionsDuLieu(menu.cible) : []).map((a) =>
    a.cle === 'rappelsLots' && f.lotsARappeler > 0 ? { ...a, pastille: f.lotsARappeler } : a,
  );
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
      <View style={[styles.haut, { paddingTop: 12 + haut }]}>
        <View style={[styles.colonneHaut, comptable && styles.largeComptable]}>
          {/* Les menus qu'on touche rarement sont en haut (téléphone comme Windows) ; le bandeau qu'on utilise sans cesse est tout en bas. */}
          {comptable ? null : <BarreHauteFerme />}
          {/* Le nom de l'exploitation : il ouvre le choix de l'établissement. */}
          {comptable ? null : <NomFerme />}
          <RappelSauvegarde />
        </View>
      </View>
      {/* La scène sur tout l'écran ; elle est recréée quand l'espèce change (elle relit ses données et reprend les mots et dessins de l'espèce). */}
      <View key={espece} style={styles.zoneDeScene} {...balayage.panHandlers}>
        <View style={[styles.scene, comptable && styles.largeComptable]}>
          {afficheSobre() ? (
            // L'affichage sobre : les mêmes informations et la même organisation, en listes, sans scène ni dessin.
            <AccueilSobre
              large={comptable}
              titre={titreSobre}
              resume={resumeSobre}
              // Les intervenants dans l'ordre de la liste (la scène les renverse : les plus utilisés sont près du pouce).
              intervenants={[...intervenants].reverse()}
              gestion={gestion}
              onIntervenant={surMaison}
              onGestion={surGestionSobre}
            />
          ) : cote === 'exploitation' ? (
            <SceneExploitation
              vedettes={f.vedettes}
              nombreAnimaux={f.stats?.totalVivantes}
              naissances={f.stats?.cabritsAnnee}
              estive={f.estive}
              onAppui={() => ouvrir(routeDuTerrain('troupeau'))}
              intervenants={intervenants}
              gestion={gestion}
              onMaison={surMaison}
              onGestion={surGestion}
            />
          ) : cote === 'agritourisme' ? (
            // La même scène que l'atelier (une rue étroite, une plaque blanche, un bâtiment de gestion), avec les comptes de l'agritourisme.
            <SceneTransformation
              decor="campagne"
              plaque={{
                titre: TEXTES.accueil.ferme.agritourisme.titre,
                symboles: SYMBOLES_AGRITOURISME,
                lignes: [
                  { cle: 'aVenir', texte: TEXTES.accueil.ferme.agritourisme.visitesAVenir(f.agritourisme.aVenir) },
                  { cle: 'visiteurs', texte: TEXTES.accueil.ferme.agritourisme.visiteurs(f.agritourisme.visiteurs) },
                  // Le stock d'une visite ou d'une commande des jours qui viennent manque : le rappel (« Stock à prévoir ») le détaille.
                  ...(f.stockManquant
                    ? [{ cle: 'stock', texte: TEXTES.accueil.ferme.agritourisme.stockManquant, alerte: true }]
                    : []),
                ],
              }}
              nomBatiment={TEXTES.accueil.ferme.agritourisme.batiment}
              entrer={TEXTES.accueil.ferme.agritourisme.entrer}
              onAppui={() => ouvrir(routeDuTerrain('accueil'))}
              intervenants={intervenants}
              gestion={gestion}
              onMaison={surMaison}
              onGestion={surGestion}
            />
          ) : (
            <SceneTransformation
              compte={f.transformation}
              alerteStock={f.stockNegatif}
              onAppui={() => ouvrir(routeDuTerrain('atelier'))}
              intervenants={intervenants}
              gestion={gestion}
              onMaison={surMaison}
              onGestion={surGestion}
            />
          )}
        </View>
      </View>
      {comptable ? null : (
      <BasculeFerme
        cotes={[
          { cle: 'exploitation', titre: TEXTES.accueil.ferme.zones.enclos },
          { cle: 'transformation', titre: TEXTES.accueil.ferme.transformation.pastille },
          { cle: 'agritourisme', titre: TEXTES.accueil.ferme.agritourisme.titre },
        ]}
        actif={cote}
        onChoisir={choisirCote}
      />
      )}

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

      <OptionsModal
        visible={listeSobre !== null}
        onClose={() => setListeSobre(null)}
        options={(listeSobre ? actionsDuLieu(listeSobre) : []).map((a) => ({
          label: a.titre,
          icon: a.icone,
          onPress: () => ouvrir(a.route),
        }))}
      />
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
  colonneHaut: { ...colonneCentree, gap: 8 },
  // La scène remplit toute la place entre le haut et la bascule, dans une colonne de largeur limitée.
  zoneDeScene: { flex: 1, paddingHorizontal: 10 },
  scene: { ...colonneCentree, flex: 1 },
  // Le poste de comptabilité : l'accueil prend toute la largeur de la fenêtre, pas celle d'un téléphone.
  largeComptable: { maxWidth: 1400 },
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
