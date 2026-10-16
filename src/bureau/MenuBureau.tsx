import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FAMILLE_CONTROLE, VOLET_ANALYSES_PAR_ESPECE } from '@/shared/constants/controles';
import { ESPECES_PETITS_RUMINANTS } from '@/shared/constants/primes';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { ROUTES } from '@/shared/constants/routes';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { inventaireAccessible } from '@/features/settings/utils/rubriques';
import { laiterieActive, oeufsActifs, productionActive } from '@/features/comptabilite/utils/recettes';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { estBureau } from '@/shared/utils/plateforme';
import { TEXTES } from '@/shared/textes';

const A = TEXTES.production.accueil;
const C = TEXTES.comptabilite.accueil;
const K = TEXTES.commercial.accueil;

/** Les menus de la barre du haut : ce que les onglets du bas donnent sur le téléphone, avec leurs écrans en dessous. */
function definitionDesMenus(): DefinitionMenu[] {
  const entreprise = modeEntreprise();
  const accueil: DefinitionMenu = {
    label: TEXTES.navigation.layout.accueil,
    items: [
      { label: TEXTES.navigation.layout.accueil, route: '/' },
      { separateur: true },
      {
        label: entreprise
          ? TEXTES.commun.general.informationsDeLEntreprise
          : TEXTES.commun.general.informationsDeLExploitation,
        route: ROUTES.INFORMATIONS_EXPLOITATION,
      },
      { label: TEXTES.rappels.historique.titre, route: ROUTES.RAPPELS_HISTORIQUE },
    ],
  };
  const clients: DefinitionMenu = {
    label: TEXTES.commun.general.clients,
    route: ROUTES.CLIENTS,
  };
  /** Les contacts (clients, fournisseurs, organismes…) : une entrée du haut, car ils servent aux recettes, aux dépenses et aux documents. */
  const contacts: DefinitionMenu = {
    label: TEXTES.contacts.titre,
    route: ROUTES.CONTACTS,
  };
  const cheptel: DefinitionMenu = {
    label: TEXTES.commun.general.cheptel,
    items: [
      { label: TEXTES.commun.general.cheptel, route: ROUTES.CHEPTEL_LISTE },
      {
        label: TEXTES.exploitation.controles.familles.surface.titre,
        route: ROUTES.santeControles(FAMILLE_CONTROLE.SURFACE),
      },
      {
        label: TEXTES.exploitation.controles.familles.animaux.titre,
        route: ROUTES.santeControles(FAMILLE_CONTROLE.ANIMAUX),
      },
      { label: TEXTES.cheptel.traitements.titre, route: ROUTES.CHEPTEL_TRAITEMENTS },
      { label: TEXTES.commun.general.alimentation, route: ROUTES.SANTE_ALIMENTATION },
      { label: TEXTES.commun.general.bilanAnnuel, route: ROUTES.CHEPTEL_BILAN },
      { label: TEXTES.cheptel.reglages.titre, route: ROUTES.CHEPTEL_REGLAGES },
    ],
  };
  const production: DefinitionMenu = {
    label: TEXTES.production.titre,
    items: [
      // Les fromages et le contrôle du lait ne concernent que les espèces qui ont une laiterie (chèvres, brebis, vaches).
      ...(laiterieActive(especeCourante())
        ? [{ label: A.fromages.titre, route: ROUTES.PRODUCTION_FROMAGES }]
        : []),
      ...(oeufsActifs(especeCourante()) ? [{ label: A.oeufs.titre, route: ROUTES.PRODUCTION_OEUFS }] : []),
      { label: A.viande.titre, route: ROUTES.PRODUCTION_VIANDE },
      { label: A.charcuterie.titre, route: ROUTES.PRODUCTION_CHARCUTERIE },
      ...(laiterieActive(especeCourante())
        ? [{ label: A.laitier.titre, route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER) }]
        : []),
      // Le lait par chèvre (ou brebis) et par traite : les petits ruminants seulement.
      ...(ESPECES_PETITS_RUMINANTS.includes(especeCourante())
        ? [{ label: A.productionLait.titre, route: ROUTES.PRODUCTION_LAIT }]
        : []),
      // Les analyses des autres espèces : l'abattoir et les autocontrôles, ou la salmonelle des fientes.
      ...(VOLET_ANALYSES_PAR_ESPECE[especeCourante()]
        ? [
            VOLET_ANALYSES_PAR_ESPECE[especeCourante()] === FAMILLE_CONTROLE.OFFICIEL
              ? { label: A.officiel.titre, route: ROUTES.santeControles(FAMILLE_CONTROLE.OFFICIEL) }
              : { label: A.salmonelle.titre, route: ROUTES.santeControles(FAMILLE_CONTROLE.SALMONELLE) },
          ]
        : []),
      { label: A.rappels.titre, route: ROUTES.PRODUCTION_RAPPELS_LOTS },
    ],
  };
  const commercial: DefinitionMenu = {
    label: TEXTES.commercial.titre,
    items: [
      { label: K.ventes.titre, route: ROUTES.COMMERCIAL_VENTES },
      { label: K.tarifs.titre, route: ROUTES.COMMERCIAL_TARIFS },
      { label: K.commandes.titre, route: ROUTES.COMMERCIAL_COMMANDES },
      { label: K.visitesAgri.titre, route: ROUTES.COMMERCIAL_AGRITOURISME },
      { label: K.formulesAgri.titre, route: ROUTES.COMMERCIAL_FORMULES },
      { label: K.circuits.titre, route: ROUTES.COMMERCIAL_CIRCUITS },
    ],
  };
  const comptabilite: DefinitionMenu = {
    label: TEXTES.commun.general.comptabilite,
    items: [
      { label: C.ecritures, route: ROUTES.COMPTABILITE_LISTE },
      { label: C.inventaire.titre, route: ROUTES.COMPTABILITE_INVENTAIRE },
      { label: C.tresorerie.titre, route: ROUTES.COMPTABILITE_TRESORERIE },
      { label: C.rentabilite.titre, route: ROUTES.RENTABILITE },
      { label: C.tva.titre, route: ROUTES.TVA },
      { label: TEXTES.comptabilite.fiscalite.titre, route: ROUTES.FISCALITE },
      { label: TEXTES.settings.reglages.comptesPcg, route: ROUTES.COMPTES_PCG },
      { label: C.reglages.titre, route: ROUTES.COMPTABILITE_REGLAGES },
      // Les écrans de l'inventaire : les icônes de l'en-tête des stocks.
      ...(inventaireAccessible()
        ? [
            { separateur: true as const },
            { label: C.inventaire.stocks, route: ROUTES.COMPTABILITE_STOCKS },
            { label: TEXTES.stock.conditionnement.titre, route: ROUTES.COMPTABILITE_CONDITIONNEMENT },
            { label: TEXTES.stock.structure.titre, route: ROUTES.STOCK_STRUCTURE },
            { label: TEXTES.navigation.menuBureau.historiqueDesStocks, route: ROUTES.stockHistorique() },
            { label: TEXTES.navigation.menuBureau.statistiquesDesStocks, route: ROUTES.STOCK_STATISTIQUES },
          ]
        : []),
    ],
  };
  const organisation: DefinitionMenu = {
    label: TEXTES.navigation.layout.reglages,
    items: [
      { label: TEXTES.settings.reglages.sectionEtablissement, route: ROUTES.ORGANISATION_ETABLISSEMENT },
      { label: TEXTES.dossiers.structure.titre, route: ROUTES.STRUCTURE_DOSSIERS },
      { separateur: true },
      { label: TEXTES.settings.reglages.sectionTiers, route: ROUTES.ORGANISATION_TIERS },
      {
        label: TEXTES.settings.reglages.sectionCategoriesClient,
        route: ROUTES.ORGANISATION_CATEGORIES_CLIENT,
      },
      { label: TEXTES.settings.reglages.sectionCategoriesTiers, route: ROUTES.ORGANISATION_CATEGORIES_TIERS },
      { separateur: true },
      { label: TEXTES.settings.reglages.sectionDonnees, route: ROUTES.ORGANISATION_DONNEES },
      { label: TEXTES.settings.reglages.export, route: ROUTES.EXPORT_DONNEES },
      { label: TEXTES.settings.reglages.pdf, route: ROUTES.PDF_DONNEES },
      { label: TEXTES.settings.reglages.sauvegardeLocale, route: ROUTES.SAUVEGARDE_LOCALE },
      { label: TEXTES.settings.reglages.googleDrive, route: ROUTES.GOOGLE_DRIVE },
    ],
  };
  // Une entreprise a ses clients à la place du cheptel et de la production.
  return entreprise
    ? [accueil, clients, comptabilite, organisation]
    : [
        accueil,
        cheptel,
        // Les animaux de compagnie n'ont aucune production.
        ...(productionActive(especeCourante()) ? [production] : []),
        commercial,
        comptabilite,
        contacts,
        organisation,
      ];
}

/**
 * Dans la version Windows, la barre d'onglets du bas laisse la place aux menus de la fenêtre, en haut à gauche (comme dans les
 * programmes de bureau). Ce composant les donne à la fenêtre et suit les choix qu'on y fait ; il ne montre rien.
 */
export function MenuBureau() {
  const router = useRouter();
  // Les menus changent avec l'établissement (une entreprise n'a ni cheptel ni production) : on les redonne quand il change.
  const etablissement = useEtablissement();
  useEffect(() => {
    if (!estBureau() || !window.bureau) return;
    window.bureau.menu.definir(definitionDesMenus());
    return window.bureau.menu.surChoix((route) => router.push(route as never));
  }, [router, etablissement]);
  return null;
}
