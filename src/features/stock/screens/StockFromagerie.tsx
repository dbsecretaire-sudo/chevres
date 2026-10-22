import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CATEGORIES,
  SECTIONS,
  categoriesAvecAjoutees,
  type Section,
} from '@/features/stock/utils/categories';
import { AncreVisite } from '@/features/didacticiel/components/AncreVisite';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { ROUTES } from '@/shared/constants/routes';
import { Fab } from '@/shared/components/Fab';
import { OptionsModal, type Option } from '@/shared/components/OptionsModal';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { useFiltreEspeceStock } from '@/features/stock/hooks/useFiltreEspeceStock';
import { SelectField } from '@/shared/components/SelectField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ArticleStockModal } from '@/features/stock/components/ArticleStockModal';
import { DetailBouclesModal } from '@/features/stock/components/DetailBouclesModal';
import { DetailLotsModal } from '@/features/stock/components/DetailLotsModal';
import { estArticleAvecLots, lotsDeLInventaire } from '@/features/stock/services/lots';
import { Button } from '@/shared/components/Button';
import {
  bouclesDeLEspece,
  estBoucleDeRemplacement,
  numerosTiptag,
  synchroniserPoseBoucles,
  bouclesPossiblesDuCheptel,
  synchroniserBouclesDuCheptel,
  type BouclePossible,
} from '@/features/stock/services/boucles';
import { ModalSynchroBoucles } from '@/features/stock/components/ModalSynchroBoucles';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { getSettings, synchroBouclesActive } from '@/features/settings/settings';
import { idsDesInconsommables } from '@/features/exploitation/services/lots';
import { JournalLait } from '@/features/stock/components/JournalLait';
import { LaitJourModal } from '@/features/stock/components/LaitJourModal';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { coutsUnitairesAchats } from '@/features/comptabilite/services/repartitionLait';
import { montantsHorsTaxes } from '@/features/comptabilite/utils/reglagesTva';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { effectifsVivants, type EffectifVivant } from '@/features/cheptel/repository/chevres';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDeLaSection, listesAffichees, sectionsAffichees } from '@/features/stock/utils/structureStock';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import {
  ajouterArticle,
  ajouterMouvementManuel,
  articlesDuGenre,
  bilanLait,
  cleArticle,
  definirLitresParFromage,
  definirPrixArticle,
  prixDesOeufs,
  enregistrerLaitJour,
  positionnerArticle,
  renommerArticle,
  masquerArticle,
  supprimerArticle,
  roleDeLaViande,
  estLigneDuCheptel,
  niveauxDeStock,
  resynchroniserStockDesVentes,
  type ArticleAffiche,
  type FiltreStock,
} from '@/features/stock/services/stock';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { CarteDeStock, grilleDeCartes } from '@/features/stock/components/CartesDuStock';
import { HistoriqueArticleModal } from '@/features/stock/components/HistoriqueArticleModal';
import { definirImageArticle, type ChoixImage } from '@/features/stock/services/imagesArticles';
import { CadreDeJeu } from '@/features/stock/components/CadreDeJeu';
import type { ArchiveStock, GenreArticle, LaitJour, ListeInventaire } from '@/features/stock/types';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { COMPTE_PAR_SECTION_INVENTAIRE } from '@/shared/constants/planComptable';
import {
  CLE_PRIX_LAIT,
  CLE_PRIX_OEUFS,
  FILTRE_STOCK_TOUT,
  GENRE_ARTICLE,
  NATURE_PAR_GENRE,
  NATURE_STOCK,
  ORIGINE_MOUVEMENT,
  SECTION_STOCK,
  CATEGORIE_INVENTAIRE,
} from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/** La couleur des catégories déroulées du stock en cadre de jeu : un beige parchemin un peu plus soutenu que le fond, avec son cercle. */
const PANNEAU_DE_JEU = { panneau: '#EFE3C4', bord: '#C2A76B' };

/** De combien de points les flèches de la barre de navigation font défiler la liste. */
const PAS_DE_DEFILEMENT = 190;

/** Les boucles d'identification ne s'ajoutent pas à la main : elles entrent par un achat en comptabilité. */
type GenreAjoutable = Exclude<GenreArticle, typeof GENRE_ARTICLE.BOUCLE>;

const TEXTES_AJOUT: Record<GenreAjoutable, { titre: string; exemple: string }> = {
  [GENRE_ARTICLE.FROMAGE]: { titre: T.ajouter.fromage, exemple: T.ajouter.exempleFromage },
  [GENRE_ARTICLE.EMBALLAGE]: { titre: T.ajouter.emballages, exemple: T.ajouter.exempleEmballage },
  [GENRE_ARTICLE.MATERIEL]: { titre: T.ajouter.materiel, exemple: T.ajouter.exempleMateriel },
  [GENRE_ARTICLE.BATIMENT]: { titre: T.ajouter.batiment, exemple: T.ajouter.exempleBatiment },
  [GENRE_ARTICLE.ALIMENT]: { titre: T.ajouter.aliment, exemple: T.ajouter.exempleAliment },
  [GENRE_ARTICLE.ENTRETIEN]: { titre: T.ajouter.entretien, exemple: T.ajouter.exempleEntretien },
  [GENRE_ARTICLE.EQUIPEMENT]: {
    titre: T.ajouter.equipementConsommable,
    exemple: T.ajouter.exempleEquipementConsommable,
  },
  [GENRE_ARTICLE.VIANDE]: { titre: T.ajouter.viande, exemple: T.ajouter.exempleViande },
  [GENRE_ARTICLE.PLAT]: { titre: T.ajouter.plat, exemple: T.ajouter.exemplePlat },
  [GENRE_ARTICLE.PERSONNALISE]: { titre: T.ajouter.article, exemple: T.ajouter.exempleArticle },
};

/** Les catégories où l'inventaire ajoute et supprime des articles : les immobilisations et les autres approvisionnements. */
const categorieAjoutable = (categorie: string | undefined): boolean =>
  categorie === CATEGORIE_INVENTAIRE.IMMOBILISATIONS || categorie === CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS;

/** Un fromage ou une viande se vend : il a un prix de vente. */
const seVend = (cle: string): boolean =>
  cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`) || cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`) || cle.startsWith(`${GENRE_ARTICLE.PLAT}:`);

/**
 * Le stock d'une exploitation agricole, en trois onglets rangés par nature : ce qui se vend (fromages, lait, viande), ce qui se
 * consomme (aliments, emballages et leur conditionnement, entretien) et les investissements (équipement de fromagerie,
 * matériel). Chaque onglet a ses sections qui se déroulent. Chaque vente de fromage fait baisser tout seul le fromage et ses
 * emballages ; le bouton « + » ajoute un article au nom de son choix, qu'un crayon renomme et qu'une poignée déplace.
 */
export default function StockFromagerie() {
  // La fromagerie n'existe que pour des chèvres ou des brebis ; les aliments et l'entretien sont là pour toute exploitation.
  // Un lien peut ouvrir directement un onglet.
  const router = useRouter();
  const { especes, especeActive, filtreCourant, setFiltre, concernees, fromagerie, poules } =
    useFiltreEspeceStock();
  /** L'activité choisie à la création d'un article : « toutes les activités » (vide) d'office. */
  const [activiteAjout, setActiviteAjout] = useState('');
  const { onglet: ongletDemande, espece: especeDemandee, vue } = useLocalSearchParams<{
    onglet?: string;
    espece?: string;
    vue?: string;
  }>();
  /** Le stock de l'atelier : sans les matières premières (aliments, boucles), qui sont à la grange ; « Tout le stock » les montre. */
  const vueAtelier = vue === 'atelier';
  /** La catégorie qui est déroulée (une seule à la fois) : aucune au départ, tout est réduit. */
  const [ouvertes, setOuvertes] = useState<string[]>([]);
  /** Le menu des ajouts d'une catégorie, ouvert depuis le bouton « + » quand plusieurs catégories sont en vue. */
  const [menuAjout, setMenuAjout] = useState<{ titre: string; options: Option[] } | null>(null);
  // Un lien (le crayon d'un formulaire) peut ouvrir une liste et un animal précis, même si l'inventaire était déjà ouvert.
  const demande = `${ongletDemande ?? ''}|${especeDemandee ?? ''}`;
  const [demandeVue, setDemandeVue] = useState('|');
  if (demande !== demandeVue) {
    setDemandeVue(demande);
    if (especeDemandee) setFiltre(especeDemandee as FiltreStock);
    // Le lien nomme une liste (les aliments, les animaux…) ou une catégorie : on déroule la catégorie qui la contient.
    const categorieDemandee =
      SECTIONS.find((x) => x.section === ongletDemande)?.categorie ??
      CATEGORIES.find((x) => x.categorie === ongletDemande)?.categorie;
    if (categorieDemandee) {
      setOuvertes([categorieDemandee]);
    }
  }
  /** Les animaux vivants de chaque espèce du cheptel : le niveau des petits, de l'animal sur pied et de l'animal vivant. */
  const [effectifs, setEffectifs] = useState<Partial<Record<EspeceAnimale, EffectifVivant>>>({});
  const [archive, setArchive] = useState<ArchiveStock>({
    mouvements: [],
    articles: [],
    conditionnements: {},
    ordres: {},
    noms: {},
    lait: [],
    prix: {},
  });
  const [article, setArticle] = useState<ArticleAffiche | null>(null);
  /** Le genre d'article qu'on est en train d'ajouter (la fenêtre de saisie est fermée quand il est absent). */
  const [ajout, setAjout] = useState<GenreAjoutable | null>(null);
  /** La sorte de boucles dont on regarde le détail, et si sa fenêtre est ouverte. */
  const [boucleOuverte, setBoucleOuverte] = useState<ArticleAffiche | null>(null);
  const [boucleVisible, setBoucleVisible] = useState(false);
  /** Le fromage dont on regarde les lots (par numéro de lot), et si sa fenêtre est ouverte. */
  const [fromageOuvert, setFromageOuvert] = useState<ArticleAffiche | null>(null);
  const [fromageVisible, setFromageVisible] = useState(false);
  /** La synchronisation des boucles avec le cheptel : les numéros que portent les animaux, et si sa fenêtre est ouverte. */
  const [possibles, setPossibles] = useState<BouclePossible[]>([]);
  const [synchroOuverte, setSynchroOuverte] = useState(false);
  const infosExploitation = useAppSettings().settings.exploitation;
  const synchro = synchroBouclesActive(infosExploitation);
  /** Le prix moyen d'une unité de chaque fourniture, d'après les factures d'achat qui l'ont ajoutée à l'inventaire. */
  const [achats, setAchats] = useState<Awaited<ReturnType<typeof listToutesFactures>>>([]);
  const horsTaxes = montantsHorsTaxes(infosExploitation);
  const coutsAchats = coutsUnitairesAchats(achats, horsTaxes);
  /** Pour un ajout dans une liste personnalisée : cette liste. */
  const [listeAjout, setListeAjout] = useState<ListeInventaire | null>(null);
  /** L'article qu'on s'apprête à supprimer (la confirmation est ouverte quand il est présent). */
  const [aSupprimer, setASupprimer] = useState<ArticleAffiche | null>(null);
  /** L'article dont on regarde l'historique (un appui sur sa carte). */
  const [historiqueDe, setHistoriqueDe] = useState<ArticleAffiche | null>(null);
  /** L'article dont on modifie le nom (le crayon de sa ligne). */
  const [renomme, setRenomme] = useState<ArticleAffiche | null>(null);
  /** Le litrage qu'on modifie (« nouveau » pour en noter un) ; la fenêtre est fermée quand il est absent. */
  const [prixLaitOuvert, setPrixLaitOuvert] = useState(false);
  const [prixOeufsOuvert, setPrixOeufsOuvert] = useState(false);
  const [laitOuvert, setLaitOuvert] = useState<LaitJour | 'nouveau' | null>(null);
  /** L'article pris par un appui long (sa clé) : on touche la carte où le mettre. */
  const [prise, setPrise] = useState<string | null>(null);
  /** La liste qui défile, et où elle en est : les flèches de la barre de navigation la font avancer d'un cran. */
  const defilement = useRef<ScrollView>(null);
  const position = useRef(0);
  const defiler = (pas: number) => {
    position.current = Math.max(0, position.current + pas);
    defilement.current?.scrollTo({ y: position.current, animated: true });
  };
  /** Le menu en haut à droite (burger) et la feuille des statistiques qu'il ouvre. */

  /** Les litres de lait vendus (les ventes de lait en comptabilité), pour le lait restant. */
  const [ventesLait, setVentesLait] = useState<{ id: string; date: string; litres: number }[]>([]);
  const litresVendus = ventesLait.reduce((total, v) => total + v.litres, 0);

  const charger = useCallback(async () => {
    // Le stock des ventes suit le conditionnement en vigueur à leur date (un conditionnement modifié avant cette mise à jour s'y retrouve).
    await synchroniserPoseBoucles();
    await resynchroniserStockDesVentes();
    const [stock, ventes, factures] = await Promise.all([
      lireArchiveStock(),
      listToutesVentes(),
      listToutesFactures(),
    ]);
    setArchive(stock);
    setAchats(factures);
    // Les animaux à l'abattoir que vend une facture du client ne comptent plus, ni les bêtes écartées d'un lot (jamais facturées) ; les autres (à facturer) sont du stock.
    setEffectifs(
      await effectifsVivants(
        new Set([...ventes.flatMap((v) => idsDesAnimaux(v)), ...idsDesInconsommables((await getSettings()).exploitation?.lots)]),
        numerosTiptag(stock.boucles),
      ),
    );
    setPossibles(await bouclesPossiblesDuCheptel());
    setVentesLait(
      ventes
        .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT && v.quantite)
        .map((v) => ({ id: v.id, date: v.date, litres: v.quantite ?? 0 })),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const niveaux = niveauxDeStock(archive.mouvements, effectifs);
  /** Les boucles de l'espèce active : chaque espèce a les siennes. */
  const bouclesEspece = bouclesDeLEspece(archive.boucles);
  /** Vrai quand un des articles de la liste a une quantité négative (une production ou un achat n'a pas été noté). */
  const aUnNegatif = (articles: ArticleAffiche[]) => articles.some((a) => (niveaux.get(a.cle) ?? 0) < 0);

  /** Le petit texte sous le nom d'un article : son prix de vente, ou le prix d'une unité d'une fourniture d'après ses achats ; la quantité négative s'y signale. */
  const sousLeNom = (a: ArticleAffiche): string | undefined => {
    const niveau = niveaux.get(a.cle) ?? 0;
    const prix = a.prix
      ? roleDeLaViande(a.cle)
        ? T.parKg(formatMontant(a.prix))
        : formatMontant(a.prix)
      : coutsAchats[a.cle]
        ? T.prixAchat(formatMontant(coutsAchats[a.cle]), horsTaxes)
        : undefined;
    return [prix, niveau < 0 ? T.negatif : undefined].filter(Boolean).join(' · ') || undefined;
  };

  /** Une sorte de boucles : le nombre de boucles à poser (celles de l'espèce : celles des chèvres ne sont pas celles des cochons) et son résumé. */
  const resumeDesBoucles = (a: ArticleAffiche) => {
    // Une boucle de remplacement (rouge, rebouclage) n'a pas de numéro à l'achat : son niveau est sa quantité en stock, et les
    // poses (avec leur numéro de remplacement) sont celles du cheptel.
    const remplacement = estBoucleDeRemplacement(a.cle);
    const posees = bouclesEspece.filter((b) => b.article === a.cle && !!b.chevreId).length;
    const niveau = remplacement
      ? (niveaux.get(a.cle) ?? 0)
      : bouclesEspece.filter((b) => b.article === a.cle && !b.chevreId).length;
    const resume = remplacement
      ? T.boucles.resumeRemplacement(niveau, posees)
      : T.boucles.resume(bouclesEspece.filter((b) => b.article === a.cle).length, posees);
    return { niveau, resume };
  };

  /** La liste d'articles d'une rubrique : un genre (filtré par activité), dont les lignes de viande se partagent entre deux catégories. */
  const articlesDeLaListe = (genre: GenreArticle, section?: Section, listeId?: string) =>
    articlesDeLaSection(genre, section, archive, filtreCourant, listeId);

  /**
   * Les articles d'une rubrique en cartes, comme à la grange. Un appui ouvre l'article (mouvement, lots, détail des boucles), le crayon le renomme, et un appui
   * long le prend (il frémit) : on touche alors la carte à sa place pour l'y mettre (la même carte une seconde fois le repose). Les boucles et les lignes qui suivent
   * le cheptel ne se déplacent pas.
   */
  const liste = (genre: GenreArticle, section?: Section, listeId?: string) => {
    const elements = articlesDeLaListe(genre, section, listeId);
    const boucles = genre === GENRE_ARTICLE.BOUCLE;
    const deplacable = !boucles && section !== SECTION_STOCK.ANIMAUX;
    const priseIci = prise !== null && elements.some((a) => a.cle === prise);
    /** La carte prise est mise à la place de celle qu'on touche : la liste affichée est une partie du genre, on la place là où se trouve celle qu'elle remplace. */
    const placer = async (cle: string, index: number) => {
      const autres = elements.filter((a) => a.cle !== cle);
      const complet = articlesDuGenre(genre, archive, filtreCourant)
        .map((a) => a.cle)
        .filter((c) => c !== cle);
      const cible = autres[index];
      const indexComplet = cible ? complet.indexOf(cible.cle) : complet.length;
      await positionnerArticle(genre, cle, indexComplet, filtreCourant);
      charger();
    };
    return (
      <View style={jeu.cartesStock}>
        {priseIci ? (
          <Text style={jeu.indiceDeplacement}>
            {T.deplacer(elements.find((a) => a.cle === prise)?.libelle ?? '')}
          </Text>
        ) : null}
        <View style={grilleDeCartes}>
          {elements.map((a, i) => {
            const resume = boucles ? resumeDesBoucles(a) : undefined;
            const niveau = resume ? resume.niveau : (niveaux.get(a.cle) ?? 0);
            return (
              <CarteDeStock
                key={a.cle}
                rang={i}
                cle={a.cle}
                emoji={emojiDeLArticle(genreDeLaCle(a.cle), a.libelle)}
                titre={a.libelle}
                quantite={a.cle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) ? T.kilos(niveau) : T.unites(niveau)}
                niveau={niveau}
                sous={resume ? resume.resume : sousLeNom(a)}
                selectionnee={prise === a.cle}
                onRenommer={boucles ? undefined : () => setRenomme(a)}
                onLongPress={deplacable ? () => setPrise(a.cle) : undefined}
                onPress={() => {
                  if (prise) {
                    if (prise !== a.cle && priseIci) placer(prise, i);
                    setPrise(null);
                    return;
                  }
                  if (boucles) {
                    setBoucleOuverte(a);
                    setBoucleVisible(true);
                  } else if (estLigneDuCheptel(a.cle)) {
                    // L'animal sur pied et l'animal vivant suivent le cheptel : on n'y ajoute ni ne retire à la main.
                  } else if (estArticleAvecLots(a.cle)) {
                    setFromageOuvert(a);
                    setFromageVisible(true);
                  } else {
                    // Les autres articles (aliments, emballages, entretien, matériel, listes ajoutées…) : leur historique ; la quantité se saisit depuis lui.
                    setHistoriqueDe(a);
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const synchroniserLesBoucles = async (tiptags: string[]) => {
    setSynchroOuverte(false);
    const reprises = await synchroniserBouclesDuCheptel(tiptags);
    await charger();
    Alert.alert(T.boucles.synchro.fait(reprises));
  };

  const valider = async (cle: string, delta: number, litres?: number) => {
    // Retirer d'un consommable (aliment, emballage, entretien), c'est ce qui a été consommé.
    const consomme =
      delta < 0 && NATURE_PAR_GENRE[cle.split(':')[0] as GenreArticle] === NATURE_STOCK.CONSOMMABLE;
    await ajouterMouvementManuel(
      cle,
      delta,
      todayISO(),
      litres,
      consomme ? ORIGINE_MOUVEMENT.CONSOMMATION : ORIGINE_MOUVEMENT.MANUEL,
    );
    setArticle(null);
    charger();
  };

  /** Supprime l'article confirmé : un article ajouté disparaît, un article d'office est masqué. */
  const retirer = async () => {
    if (aSupprimer?.id) await supprimerArticle(aSupprimer.id);
    else if (aSupprimer) await masquerArticle(aSupprimer.cle);
    setASupprimer(null);
    charger();
  };

  /**
   * Seuls les articles des immobilisations et des autres approvisionnements (l'entretien et le matériel, pas les emballages) s'ajoutent et se suppriment dans
   * l'inventaire, comme les listes ajoutées à ces catégories : les autres articles viennent des achats et des ventes.
   */
  const estAjoutable = (cle: string): boolean => {
    const genre = genreDeLaCle(cle);
    if (
      [GENRE_ARTICLE.MATERIEL, GENRE_ARTICLE.BATIMENT, GENRE_ARTICLE.ENTRETIEN, GENRE_ARTICLE.EQUIPEMENT].some((g) => g === genre)
    )
      return true;
    if (genre !== GENRE_ARTICLE.PERSONNALISE) return false;
    const listeId = archive.articles.find((a) => a.id === cle.split(':')[1])?.listeId;
    return categorieAjoutable((archive.listes ?? []).find((l) => l.id === listeId)?.categorie);
  };

  const ouvrirAjout = (genre: GenreAjoutable, liste?: ListeInventaire) => {
    setListeAjout(liste ?? null);
    // L'article est proposé pour l'animal actif ; on peut le passer à une autre activité, ou à toutes.
    setActiviteAjout(especes.includes(especeActive) ? especeActive : '');
    setAjout(genre);
  };

  const creer = async (nom: string) => {
    if (ajout) await ajouterArticle(ajout, nom, activiteAjout || undefined, listeAjout?.id);
    setAjout(null);
    setListeAjout(null);
    charger();
  };

  const renommer = async (nom: string, prix?: number, litres?: number, image?: ChoixImage) => {
    if (renomme) {
      if (image) await definirImageArticle(renomme.cle, image);
      if (nom) await renommerArticle(renomme.cle, nom);
      // Seuls les fromages et les viandes se vendent : eux seuls ont un prix.
      if (seVend(renomme.cle)) await definirPrixArticle(renomme.cle, prix);
      // Un fromage garde aussi les litres de lait qu'il faut pour le faire.
      if (renomme.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`))
        await definirLitresParFromage(renomme.cle, litres);
    }
    setRenomme(null);
    charger();
  };

  /** Vrai quand le crayon modifie un fromage ou une viande (produit fini ou animal) : on n'y change que le prix. */
  const produitFiniModifie =
    !!renomme && [GENRE_ARTICLE.FROMAGE, GENRE_ARTICLE.VIANDE, GENRE_ARTICLE.PLAT].some((g) => renomme.cle.startsWith(`${g}:`));

  /** Une seule catégorie est déroulée à la fois : en ouvrir une referme l'autre. */
  const basculerCategorie = (categorie: string) =>
    setOuvertes((actuelles) => (actuelles.includes(categorie) ? [] : [categorie]));

  // Les listes de ventes ne valent que pour les espèces qui les vendent (pas de lait ni de fromage pour des cochons).
  const listesVisibles = listesAffichees(archive, concernees);
  /** Les listes d'office dont le compte n'a pas été retiré pour l'espèce. */
  const lesSectionsAffichees = sectionsAffichees(archive, fromagerie, poules, concernees);

  /** Les ajouts d'une catégorie : le lait du jour (une saisie de quantité) ; pour les immobilisations et les autres approvisionnements, un article par liste (sauf les emballages). */
  const ajoutsDeLaCategorie = (categorie: string): Option[] => [
    ...lesSectionsAffichees
      .filter((x) => x.categorie === categorie)
      .map(({ section, genre }): Option | null =>
        section === SECTION_STOCK.LAIT
          ? { label: T.laitJour.ajouter, icon: 'add-circle', onPress: () => setLaitOuvert('nouveau') }
          : genre && genre !== GENRE_ARTICLE.BOUCLE && genre !== GENRE_ARTICLE.EMBALLAGE && categorieAjoutable(categorie)
            ? { label: TEXTES_AJOUT[genre].titre, icon: 'add-circle', onPress: () => ouvrirAjout(genre) }
            : null,
      )
      .filter((x): x is Option => x !== null),
    ...listesVisibles
      .filter((l) => l.categorie === categorie && categorieAjoutable(categorie))
      .map((l): Option => ({
        label: T.ajouter.dansLaListe(l.nom),
        icon: 'add-circle',
        onPress: () => ouvrirAjout(GENRE_ARTICLE.PERSONNALISE, l),
      })),
  ];
  /** Les catégories qui ont de quoi ajouter, avec leurs ajouts (celles déroulées seulement, toutes si aucune ne l'est). */
  const groupesAjout = categoriesAvecAjoutees(CATEGORIES, archive.categories, archive.reglagesCategories)
    .filter((c) => !(vueAtelier && c.categorie === CATEGORIE_INVENTAIRE.MATIERES_PREMIERES))
    .filter((c) => ouvertes.length === 0 || ouvertes.includes(c.categorie))
    // Classées par numéro de catégorie (21, 31, 32, 33…).
    .sort((x, y) => x.classe.localeCompare(y.classe, undefined, { numeric: true }))
    .map((c) => ({
      categorie: c.categorie,
      titre: T.enteteCategorie(c.classe, c.nom),
      options: ajoutsDeLaCategorie(c.categorie),
    }))
    .filter((g) => g.options.length > 0);
  /** Ce que le bouton « + » propose : les ajouts de la catégorie quand il n'y en a qu'une ; sinon une ligne par catégorie, qui ouvre ses ajouts. */
  const optionsAjout: Option[] =
    groupesAjout.length === 1
      ? groupesAjout[0].options
      : groupesAjout.map((g) => ({
          label: g.titre,
          icon: 'folder-open',
          onPress: () => setMenuAjout({ titre: g.titre, options: g.options }),
        }));

  return (
    <CadreDeJeu
      onHaut={() => defiler(-PAS_DE_DEFILEMENT)}
      onBas={() => defiler(PAS_DE_DEFILEMENT)}
      onToutLeStock={vueAtelier ? () => router.setParams({ vue: '' }) : undefined}
    >
    <Screen scroll={false} transparent>
      <ScrollView ref={defilement} onScroll={(e) => { position.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={64} showsVerticalScrollIndicator={false} contentContainerStyle={[commonStyles.listFab, jeu.listeLarge]}>
        {categoriesAvecAjoutees(CATEGORIES, archive.categories, archive.reglagesCategories)
          .filter((c) => !(vueAtelier && c.categorie === CATEGORIE_INVENTAIRE.MATIERES_PREMIERES))
          .map(({ categorie, nom, classe, perso }) => {
            const listes = lesSectionsAffichees.filter((x) => x.categorie === categorie);
            const listesPerso = listesVisibles.filter((l) => l.categorie === categorie);
            // Une catégorie ajoutée se montre même sans liste ; une catégorie d'office sans rien à montrer, non.
            if (listes.length === 0 && listesPerso.length === 0 && !perso) return null;
            return (
              <SectionDeroulante
                key={categorie}
                fond={PANNEAU_DE_JEU}
                titre={T.enteteCategorie(classe, nom)}
                ouverte={ouvertes.includes(categorie)}
                onBasculer={() => basculerCategorie(categorie)}
                alerte={
                  listes.some(
                    ({ section, genre }) => !!genre && aUnNegatif(articlesDeLaListe(genre, section)),
                  ) ||
                  listesPerso.some((l) =>
                    aUnNegatif(articlesDeLaListe(GENRE_ARTICLE.PERSONNALISE, undefined, l.id)),
                  )
                }
              >
                {listes.map(({ section, titre, genre }) => {
                  const compte = COMPTE_PAR_SECTION_INVENTAIRE[section];
                  return (
                    <AncreVisite key={section} id={`stock.${section}`}>
                    <View style={commonStyles.gap10}>
                      <View style={commonStyles.rowSpaceBetween}>
                        <View style={commonStyles.gap2}>
                          <Text style={commonStyles.lineBold}>{titre}</Text>
                          <Text style={commonStyles.note}>{T.compte(compte.numero, compte.libelle)}</Text>
                        </View>
                        <View style={commonStyles.row}>
                          {genre && aUnNegatif(articlesDeLaListe(genre, section)) ? <PastilleAlerte /> : null}
                          {section === SECTION_STOCK.FROMAGES && fromagerie ? (
                            <Pressable
                              onPress={() => router.push(ROUTES.STOCK_STATISTIQUES)}
                              hitSlop={10}
                              accessibilityLabel={T.statistiques.titre}
                            >
                              <Ionicons name="stats-chart" size={24} color={colors.primary} />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                      {genre ? (
                        <>
                          {/* Le message ne reste que pour les numéros que l'inventaire n'a pas encore repris du cheptel ; une fois tout repris, un simple lien permet de revoir les tiptag. */}
                          {genre === GENRE_ARTICLE.BOUCLE && synchro && possibles.length > 0 ? (
                            possibles.some((p) => !p.reprise) ? (
                              <Card>
                                <Text style={commonStyles.lineBold}>{T.boucles.synchro.titre}</Text>
                                <Text style={commonStyles.muted}>
                                  {T.boucles.synchro.message(possibles.filter((p) => !p.reprise).length)}
                                </Text>
                                <Button
                                  variant="secondary"
                                  label={T.boucles.synchro.bouton}
                                  onPress={() => setSynchroOuverte(true)}
                                />
                              </Card>
                            ) : (
                              <Pressable onPress={() => setSynchroOuverte(true)} hitSlop={8}>
                                <Text style={commonStyles.lien}>{T.boucles.synchro.revoir}</Text>
                              </Pressable>
                            )
                          ) : null}
                          {liste(genre, section)}
                        </>
                      ) : section === SECTION_STOCK.LAIT ? (
                        <JournalLait
                          lait={archive.lait}
                          bilan={bilanLait(archive, litresVendus)}
                          prix={archive.prix[CLE_PRIX_LAIT]}
                          onModifierPrix={() => setPrixLaitOuvert(true)}
                          onOuvrir={setLaitOuvert}
                        />
                      ) : section === SECTION_STOCK.OEUFS ? (
                        <Card>
                          <View style={commonStyles.rowSpaceBetween}>
                            <Text style={commonStyles.muted}>{T.oeufs.prixDeLOeuf}</Text>
                            <Pressable
                              style={commonStyles.rowFin}
                              onPress={() => setPrixOeufsOuvert(true)}
                              hitSlop={8}
                              accessibilityLabel={T.oeufs.modifierLePrix}
                            >
                              <Text style={commonStyles.lineBold}>
                                {T.oeufs.prixOeuf(formatMontant(prixDesOeufs(archive)))}
                              </Text>
                              <Ionicons name="pencil" size={18} color={colors.ajout} />
                            </Pressable>
                          </View>
                          <Text style={commonStyles.note}>{T.oeufs.note}</Text>
                        </Card>
                      ) : null}
                    </View>
                    </AncreVisite>
                  );
                })}
                {listesPerso.map((l) => (
                  <View key={l.id} style={commonStyles.gap10}>
                    <View style={commonStyles.gap2}>
                      <Text style={commonStyles.lineBold}>{l.nom}</Text>
                      <Text style={commonStyles.note}>{T.compte(l.compte, l.libelleCompte)}</Text>
                    </View>
                    {articlesDeLaListe(GENRE_ARTICLE.PERSONNALISE, undefined, l.id).length === 0 ? (
                      <Text style={commonStyles.mutedItalic}>{T.ajouter.listeVide}</Text>
                    ) : (
                      liste(GENRE_ARTICLE.PERSONNALISE, undefined, l.id)
                    )}
                  </View>
                ))}
                {perso && listesPerso.length === 0 ? (
                  <Text style={commonStyles.mutedItalic}>{T.structure.categorieVide}</Text>
                ) : null}
              </SectionDeroulante>
            );
          },
        )}
      </ScrollView>

      {/* À droite du titre : la structure des listes et l'historique des mouvements (les statistiques sont sur Fromages, le PDF dans Organisation › PDF). */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <View
              style={[
                commonStyles.headerDroite,
                commonStyles.boutonEnteteDroite,
                commonStyles.headerDroiteEspacee,
              ]}
            >
              <Pressable
                onPress={() => router.push(ROUTES.STOCK_STRUCTURE)}
                hitSlop={10}
                accessibilityLabel={T.structure.titre}
              >
                <Ionicons name="albums" size={24} color={colors.blanc} />
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push(
                    ROUTES.stockHistorique(filtreCourant === FILTRE_STOCK_TOUT ? undefined : filtreCourant),
                  )
                }
                hitSlop={10}
                accessibilityLabel={T.historique.titre}
              >
                <Ionicons name="time" size={24} color={colors.blanc} />
              </Pressable>
            </View>
          ),
        }}
      />

      {optionsAjout.length > 0 ? <Fab options={optionsAjout} /> : null}
      <OptionsModal
        visible={menuAjout !== null}
        onClose={() => setMenuAjout(null)}
        title={menuAjout?.titre}
        options={menuAjout?.options ?? []}
      />

      <ModalSynchroBoucles
        visible={synchroOuverte}
        possibles={possibles}
        onValider={synchroniserLesBoucles}
        onAnnuler={() => setSynchroOuverte(false)}
      />

      <ArticleStockModal
        visible={prixLaitOuvert}
        titre={T.laitJour.modifierLePrix}
        prix={archive.prix[CLE_PRIX_LAIT]}
        avecPrix
        libellePrix={T.articleModal.prixLitre}
        cleImage="lait"
        emoji="🥛"
        onValider={async (_nom, prix, _litres, image) => {
          if (image) await definirImageArticle('lait', image);
          await definirPrixArticle(CLE_PRIX_LAIT, prix);
          setPrixLaitOuvert(false);
          charger();
        }}
        onAnnuler={() => setPrixLaitOuvert(false)}
      />

      <ArticleStockModal
        visible={prixOeufsOuvert}
        titre={T.oeufs.modifierLePrix}
        prix={prixDesOeufs(archive)}
        avecPrix
        libellePrix={T.oeufs.prixLabel}
        onValider={async (_nom, prix) => {
          await definirPrixArticle(CLE_PRIX_OEUFS, prix);
          setPrixOeufsOuvert(false);
          charger();
        }}
        onAnnuler={() => setPrixOeufsOuvert(false)}
      />

      <LaitJourModal
        visible={laitOuvert !== null}
        entree={laitOuvert && laitOuvert !== 'nouveau' ? laitOuvert : undefined}
        onValider={async (valeurs) => {
          await enregistrerLaitJour(valeurs);
          setLaitOuvert(null);
          charger();
        }}
        onFermer={() => setLaitOuvert(null)}
      />

      <DetailLotsModal
        visible={fromageVisible}
        article={fromageOuvert}
        lots={archive.lots ?? []}
        sansLot={
          fromageOuvert
            ? Math.max(
                0,
                (niveaux.get(fromageOuvert.cle) ?? 0) -
                  lotsDeLInventaire(archive, 'en_stock', fromageOuvert.cle).length,
              )
            : 0
        }
        onChange={charger}
        archive={archive}
        onFermer={() => setFromageVisible(false)}
      />

      <DetailBouclesModal
        visible={boucleVisible}
        article={boucleOuverte}
        boucles={bouclesEspece}
        mouvements={archive.mouvements}
        onFermer={() => setBoucleVisible(false)}
      />

      <MouvementStockModal
        article={article}
        unite={article?.cle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) ? TEXTES.commun.general.kg : undefined}
        consommable={
          !!article &&
          NATURE_PAR_GENRE[article.cle.split(':')[0] as GenreArticle] === NATURE_STOCK.CONSOMMABLE
        }
        niveau={article ? niveaux.get(article.cle) : undefined}
        avecLitres={article?.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)}
        litresParFromage={article ? archive.litresParFromage?.[article.cle] : undefined}
        libelleLitres={
          article?.cle === cleArticle(GENRE_ARTICLE.FROMAGE, 'brocciu') ? T.modal.litresBrocciu : undefined
        }
        onValider={valider}
        onSupprimer={
          article && estAjoutable(article.cle)
            ? () => {
                setASupprimer(article);
                setArticle(null);
              }
            : undefined
        }
        onFermer={() => setArticle(null)}
      />
      <HistoriqueArticleModal
        article={
          historiqueDe
            ? {
                cle: historiqueDe.cle,
                titre: historiqueDe.libelle,
                emoji: emojiDeLArticle(genreDeLaCle(historiqueDe.cle), historiqueDe.libelle),
                unite: historiqueDe.cle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) ? TEXTES.commun.general.kg : undefined,
              }
            : null
        }
        onAjuster={() => {
          setArticle(historiqueDe);
          setHistoriqueDe(null);
        }}
        onFermer={() => setHistoriqueDe(null)}
      />
      <ArticleStockModal
        visible={!!renomme}
        titre={produitFiniModifie ? (renomme?.libelle ?? '') : T.renommer.titre}
        nom={renomme?.libelle}
        cle={renomme?.cle}
        emoji={renomme ? emojiDeLArticle(genreDeLaCle(renomme.cle), renomme.libelle) : undefined}
        prix={renomme?.prix}
        avecPrix={!!renomme && seVend(renomme.cle)}
        avecLitres={!!renomme?.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)}
        litresParFromage={renomme?.litresParFromage}
        libelleLitres={
          renomme?.cle === cleArticle(GENRE_ARTICLE.FROMAGE, 'brocciu')
            ? T.articleModal.litresBrocciu
            : undefined
        }
        parKg={!!renomme && roleDeLaViande(renomme.cle) !== undefined}
        // Un produit fini ou animal : seul son prix de vente se modifie (ni nom, ni suppression).
        libellePrix={
          produitFiniModifie
            ? renomme && roleDeLaViande(renomme.cle)
              ? T.articleModal.prixKg
              : T.articleModal.prix
            : undefined
        }
        onValider={renommer}
        // Seuls les articles ajoutables se suppriment.
        onSupprimer={
          renomme && estAjoutable(renomme.cle)
            ? () => {
                setASupprimer(renomme);
                setRenomme(null);
              }
            : undefined
        }
        onAnnuler={() => setRenomme(null)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.suppression.titre}
        message={T.suppression.message(aSupprimer?.libelle ?? '')}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={retirer}
      />
      <NomModal
        visible={!!ajout}
        titre={listeAjout ? T.ajouter.dansLaListe(listeAjout.nom) : ajout ? TEXTES_AJOUT[ajout].titre : ''}
        placeholder={ajout ? TEXTES_AJOUT[ajout].exemple : T.ajouter.nom}
        onValider={creer}
        onAnnuler={() => {
          setAjout(null);
          setListeAjout(null);
        }}
        enfants={
          especes.length > 1 ? (
            <SelectField<string>
              label={T.ajouter.activite}
              value={activiteAjout}
              onChange={setActiviteAjout}
              options={[
                { value: '', label: T.ajouter.toutesActivites },
                ...especes.map((e) => ({ value: e as string, label: LABEL_ACTIVITE_COMPTABLE[e] })),
              ]}
            />
          ) : null
        }
      />
    </Screen>
    </CadreDeJeu>
  );
}

/** Le genre d'un article d'après sa clé (« aliment:maïs » : aliment). */
const genreDeLaCle = (cle: string): GenreArticle => cle.split(':')[0] as GenreArticle;

/** Le cadre de jeu de la grange : un cadre de bois et un panneau beige parchemin, autour du stock, sur le fond habituel de l'application. */
const jeu = StyleSheet.create({
  /** Le bouton sous le cadre, comme « Tout le stock » de la grange. */
  complet: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#6B3F1B',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#3F230E',
  },
  completTexte: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  /** Les marges de la liste réduites : le conteneur est plus large, pour trois cartes l'une à côté de l'autre. */
  listeLarge: { paddingHorizontal: 4 },
  /** La liste et, à droite, la barre de navigation. */
  corps: { flex: 1, flexDirection: 'row' },
  defile: { flex: 1 },
  /** Les cartes d'une rubrique et leur indication de déplacement. */
  cartesStock: { gap: 8, paddingVertical: 4 },
  indiceDeplacement: { fontSize: 13, fontWeight: '700', color: '#B8641A' },
  fond: { flex: 1, backgroundColor: colors.background, padding: 8 },
  cadre: { flex: 1, backgroundColor: '#E8892B', borderRadius: 26, borderWidth: 4, borderColor: '#B8641A', padding: 6 },
  panneau: { flex: 1, backgroundColor: '#FAF3E1', borderRadius: 16, overflow: 'hidden' },
});
