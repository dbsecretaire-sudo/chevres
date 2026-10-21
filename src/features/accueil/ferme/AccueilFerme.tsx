import { useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { noterOrigine } from '@/shared/navigation/origineRetour';
import { actionsDuLieu, type ActionDeLieu, type CibleDesBulles } from '@/features/accueil/ferme/actionsLieu';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { BarreBasseFerme } from '@/features/accueil/ferme/BarreBasseFerme';
import { BarreHauteFerme } from '@/features/accueil/ferme/BarreHauteFerme';
import { BasculeFerme, type CoteDeLaFerme } from '@/features/accueil/ferme/BasculeFerme';
import { BullesLieu } from '@/features/accueil/ferme/BullesLieu';
import type { AncreBouton, EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { ColonnesDeScene, useColonnesDeScene } from '@/features/accueil/ferme/ColonnesDeScene';
import { lireDernierCote, noterDernierCote } from '@/features/accueil/ferme/dernierCote';
import { EnclosFerme } from '@/features/accueil/ferme/EnclosFerme';
import { FeuilleRappels, FenetreDuJour, useFenetreDuJour } from '@/features/accueil/ferme/FenetresFerme';
import { NomFerme } from '@/features/accueil/ferme/NomFerme';
import { SceneTransformation } from '@/features/accueil/ferme/SceneTransformation';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  decalageVertical,
  ecartDesBulles,
  positionsEnArc,
  rayonDesBulles,
} from '@/features/accueil/services/bullesFerme';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { RappelSauvegarde } from '@/features/sauvegarde/components/RappelSauvegarde';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';
import { TEXTES } from '@/shared/textes';
import { estBureau } from '@/shared/utils/plateforme';

const C = TEXTES.accueil.ferme.colonnes;
const TAILLE_ICONE = 30;
/** Les couleurs des lieux : un achat est bordeaux, une vente (une recette) est verte (la couleur de la ferme), une démarche est orange. */
const ACHAT = '#8E1F33';
const VENTE = colors.primary;
const ORANGE = '#D2793B';

/**
 * Les boutons qui ouvrent directement leur page, sans bulles : les fiches des intervenants (leurs contacts, leurs factures et toutes leurs actions),
 * et les pages de la gestion. Le suivi des mouvements, le bordereau de perte et le recensement se génèrent depuis le dossier PAC, qui garde leur
 * année et leur état.
 */
const ROUTE_DIRECTE: Record<string, string> = {
  // La gestion de l'exploitation : le cheptel (liste, lots, ajouts, boucles, carnet de naissance) et les documents.
  cheptel: ROUTES.lieu('cheptel'),
  documents: ROUTES.lieu('documents'),
  organismes: ROUTES.lieu('organismes'),
  // Les intervenants de l'exploitation.
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
  // Les intervenants du travail du produit : la laiterie, les clients par catégorie, les emballages.
  emballages: ROUTES.lieu('emballages'),
  laiterie: ROUTES.PRODUCTION_LAITERIE,
  particuliers: ROUTES.lieu('particuliers'),
  surfacesCommerciales: ROUTES.lieu('surfacesCommerciales'),
  entreprises: ROUTES.lieu('entreprises'),
  qualiteLait: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
  // La gestion du travail du produit : fabriquer, les lots, leurs rappels, la réservation d'un produit, et le stock de la fromagerie.
  fabriquerFromage: ROUTES.productionFabrication(PRODUIT_A_LOTS.FROMAGE),
  fabriquerCharcuterie: ROUTES.productionFabrication(PRODUIT_A_LOTS.CHARCUTERIE),
  lotsFromages: ROUTES.PRODUCTION_FROMAGES,
  rappelsLots: ROUTES.PRODUCTION_RAPPELS_LOTS,
  reserver: ROUTES.COMMERCIAL_COMMANDE,
  stockFromagerie: ROUTES.lieu('fromagerie'),
};

/** Où est le bouton : dans la colonne de gauche (les intervenants) ou celle de droite (la gestion) de la scène. */
type Zone = 'gauche' | 'droite';

/** Le côté de la ferme montré : l'exploitation (le troupeau) ou le travail du produit (la fromagerie). */
type Cote = CoteDeLaFerme['cle'];


/**
 * La direction de l'arc des bulles d'après la place du bouton (0 : vers la droite, 90 : vers le haut, 180 : vers la gauche, 270 : vers le bas) :
 * les boutons de la colonne de gauche ouvrent vers la droite, ceux de la colonne de droite vers la gauche, sur la scène.
 */
export function directionDesBulles(zone: Zone): number {
  return zone === 'gauche' ? 0 : 180;
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
  const { espece } = useEtablissement();
  // Sans en-tête, le contenu commence sous l'encoche et la barre d'état.
  const { top: haut } = useSafeAreaInsets();
  const racine = useRef<View>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const [estiveOuverte, setEstiveOuverte] = useState(false);
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
    if (coteDemande === 'exploitation' || coteDemande === 'transformation') {
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

  // Un balayage de la scène change de côté : vers la gauche, le travail du produit ; vers la droite, l'exploitation.
  const balayage = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > 2 * Math.abs(g.dy),
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) {
            noterDernierCote('transformation');
            setCote('transformation');
            setMenu(null);
          } else if (g.dx > 50) {
            noterDernierCote('exploitation');
            setCote('exploitation');
            setMenu(null);
          }
        },
      }),
    [],
  );

  // À gauche de la scène de l'exploitation : ceux qui interviennent sur les bêtes (l'abattoir, le vétérinaire, l'aliment, l'équarrisseur) et ses
  // fournisseurs et partenaires (la pompe, le garage, l'assurance, la banque, les groupements). Les achats sont en bordeaux.
  const intervenantsExploitation: EntreeDeColonne[] = [
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
    { cle: 'carburant', titre: C.carburant, icone: iconeMCI('gas-station'), couleur: ACHAT },
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
    { cle: 'surfacesCommerciales', titre: C.surfacesCommerciales, icone: iconeIon('storefront'), couleur: VENTE },
    { cle: 'entreprises', titre: C.entreprises, icone: iconeIon('business'), couleur: VENTE },
    { cle: 'emballages', titre: C.emballages, icone: iconeMCI('package-variant-closed'), couleur: ACHAT },
    { cle: 'qualiteLait', titre: C.qualiteLait, icone: iconeIon('flask'), couleur: ORANGE },
  ];
  // À droite de la scène de l'exploitation : la santé et la grange (en bulles), le cheptel (les animaux : liste, lots, ajouts, boucles, carnet de
  // naissance), l'estive, les organismes, et les documents (bilan, dossier PAC, circulation, identification, historique).
  const gestionExploitation: EntreeDeColonne[] = [
    { cle: 'documents', titre: C.documents, icone: iconeIon('document-text'), couleur: ORANGE },
    { cle: 'organismes', titre: C.organismes, icone: iconeMCI('bank'), couleur: ORANGE },
    { cle: 'estive', titre: C.estive, icone: iconeIon('trail-sign'), couleur: ORANGE },
    { cle: 'cheptel', titre: C.cheptel, icone: iconeIon('paw'), couleur: ORANGE },
    { cle: 'grange', titre: C.grange, icone: iconeMCI('corn'), couleur: ORANGE },
    { cle: 'sante', titre: C.sante, icone: iconeIon('medkit'), couleur: ORANGE },
  ];
  // À droite de la scène du travail du produit : fabriquer, les lots, leurs rappels, la réservation d'un produit et le stock de la fromagerie.
  const gestionTransformation: EntreeDeColonne[] = [
    { cle: 'stockFromagerie', titre: C.stock, icone: iconeIon('cube'), couleur: VENTE },
    { cle: 'reserver', titre: C.reserver, icone: iconeIon('bookmark'), couleur: VENTE },
    {
      cle: 'rappelsLots',
      titre: C.rappelsLots,
      icone: iconeIon('notifications'),
      pastille: f.lotsARappeler,
      couleur: VENTE,
    },
    { cle: 'lotsFromages', titre: C.lotsFromages, icone: iconeIon('layers'), couleur: VENTE },
    { cle: 'fabriquerCharcuterie', titre: C.fabriquerCharcuterie, icone: iconeMCI('knife'), couleur: VENTE },
    { cle: 'fabriquerFromage', titre: C.fabriquerFromage, icone: iconeMCI('pot-mix'), couleur: VENTE },
  ];
  // La colonne est tout en bas de la scène, sous le pouce : les plus utilisés (l'abattoir, le vétérinaire ; la laiterie, les particuliers), qui
  // ouvrent chaque liste, sont donc rangés en dernier.
  const intervenants = (cote === 'exploitation' ? intervenantsExploitation : intervenantsTransformation)
    .slice()
    .reverse();
  const gestion = cote === 'exploitation' ? gestionExploitation : gestionTransformation;
  const colonnes = useColonnesDeScene(intervenants.length);

  /** Ouvre le menu d'un bouton à partir de sa place dans la fenêtre : on la ramène à celle de l'accueil. */
  const ouvrirMenu = (cible: CibleDesBulles, zone: Zone, ancre: AncreBouton, entree: EntreeDeColonne) => {
    racine.current?.measureInWindow((rx, ry, largeur, hauteur) => {
      const gauche = ancre.x - rx;
      const sommet = ancre.y - ry;
      setMenu({
        cible,
        direction: directionDesBulles(zone),
        x: gauche + ancre.largeur / 2,
        y: sommet + ancre.hauteur / 2,
        hauteur,
        largeur,
        // Les bulles ont la couleur du bouton d'où elles sortent.
        titre: entree.titre,
        couleur: entree.couleur ?? colors.primary,
        lumiere: { gauche, haut: sommet, diametre: ancre.largeur, icone: entree.icone },
      });
    });
  };
  const surBouton = (zone: Zone, cle: string, ancre: AncreBouton) => {
    if (cle === 'estive') setEstiveOuverte(true);
    else if (ROUTE_DIRECTE[cle]) ouvrir(ROUTE_DIRECTE[cle]);
    else {
      const entree = [...gestionExploitation, ...gestionTransformation].find((e) => e.cle === cle);
      if (entree) ouvrirMenu(cle as CibleDesBulles, zone, ancre, entree);
    }
  };
  const surGauche = (cle: string, ancre: AncreBouton) => surBouton('gauche', cle, ancre);
  const surDroite = (cle: string, ancre: AncreBouton) => surBouton('droite', cle, ancre);
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
          {/* Le nom de l'exploitation : il ouvre le choix de l'établissement. */}
          <NomFerme />
          <RappelSauvegarde />
        </View>
      </View>
      {/* La scène sur tout l'écran ; elle est recréée quand l'espèce change (elle relit ses données et reprend les mots et dessins de l'espèce). */}
      <View key={espece} style={styles.zoneDeScene} {...balayage.panHandlers}>
        <View style={styles.scene}>
          {cote === 'exploitation' ? (
            <EnclosFerme
              vedettes={f.vedettes}
              nombreAnimaux={f.stats?.totalVivantes}
              naissances={f.stats?.cabritsAnnee}
              estive={f.estive}
              onAppui={() => ouvrir(ROUTES.lieu('cheptel'))}
              margeGauche={colonnes.margeGauche}
              margeDroite={colonnes.margeDroite}
            />
          ) : (
            <SceneTransformation
              compte={f.transformation}
              onAppui={() => ouvrir(ROUTES.lieu('fromagerie'))}
              margeGauche={colonnes.margeGauche}
              margeDroite={colonnes.margeDroite}
            />
          )}
          <ColonnesDeScene
            intervenants={intervenants}
            gestion={gestion}
            onIntervenant={surGauche}
            onGestion={surDroite}
            hauteur={colonnes.hauteur}
            surHauteur={colonnes.surHauteur}
          />
        </View>
      </View>
      <BasculeFerme
        cotes={[
          { cle: 'exploitation', titre: TEXTES.accueil.ferme.zones.enclos },
          { cle: 'transformation', titre: TEXTES.accueil.ferme.transformation.titre },
        ]}
        actif={cote}
        onChoisir={choisirCote}
      />
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
  colonneHaut: { ...colonneCentree, gap: 8 },
  // La scène remplit toute la place entre le haut et la bascule, dans une colonne de largeur limitée.
  zoneDeScene: { flex: 1, paddingHorizontal: 10 },
  scene: { ...colonneCentree, flex: 1 },
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
