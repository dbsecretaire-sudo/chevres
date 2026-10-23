import { FAMILLE_CONTROLE, VOLET_ANALYSES_PAR_ESPECE } from '@/shared/constants/controles';
import { ESPECES_PETITS_RUMINANTS } from '@/shared/constants/primes';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { ROUTES } from '@/shared/constants/routes';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { groupesCheptel } from '@/features/cheptel/services/rubriquesCheptel';
import { especeDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { inventaireAccessible } from '@/features/settings/utils/rubriques';
import { laiterieActive, oeufsActifs, productionActive } from '@/features/comptabilite/utils/recettes';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { TEXTES } from '@/shared/textes';

const A = TEXTES.production.accueil;
const C = TEXTES.comptabilite.accueil;
const K = TEXTES.commercial.accueil;

/** Les menus de la barre du haut, chacun par son nom : la version bureau les range en barre, le menu « Menus » du mobile en reprend les écrans. */
export function menusParNom() {
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
      { separateur: true },
      // Enregistrer : sur Google Drive, ou dans un fichier de l'ordinateur.
      { label: TEXTES.sauvegarde.enregistrer.menuDrive, route: ROUTES.GOOGLE_DRIVE },
      { label: TEXTES.sauvegarde.enregistrer.menuAppareil, route: ROUTES.SAUVEGARDE_LOCALE },
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
  /** Le menu du Cheptel : les mêmes groupes que l'accueil du Cheptel sur téléphone (voir groupesCheptel), séparés par un trait. */
  const cheptel: DefinitionMenu = {
    label: TEXTES.commun.general.cheptel,
    items: groupesCheptel(especeDuSuivi(especeCourante())).flatMap((groupe, i) => [
      ...(i > 0 ? [{ separateur: true as const }] : []),
      ...groupe.lignes.map((l) => ({ label: l.titre, route: l.route })),
    ]),
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
      // Les autocontrôles du fromage et de la charcuterie (Listeria, Salmonella, staphylocoques, E. coli).
      ...(laiterieActive(especeCourante())
        ? [{ label: TEXTES.analysesProduits.produits.fromage.titre, route: ROUTES.analysesProduit('fromage') }]
        : []),
      { label: TEXTES.analysesProduits.produits.charcuterie.titre, route: ROUTES.analysesProduit('charcuterie') },
      { label: TEXTES.analysesProduits.produits.plat.titre, route: ROUTES.analysesProduit('plat') },
      ...(laiterieActive(especeCourante())
        ? [{ label: TEXTES.analysesProduits.produits.savon.titre, route: ROUTES.analysesProduit('savon') }]
        : []),
      { label: TEXTES.analysesProduits.registre.titre, route: ROUTES.PRODUCTION_REGISTRE_ANALYSES },
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
      { label: TEXTES.comptesPcg.planGeneral.titre, route: ROUTES.PLAN_COMPTABLE },
      { label: C.reglages.titre, route: ROUTES.COMPTABILITE_REGLAGES },
      // Les écrans de l'inventaire : les icônes de l'en-tête des stocks.
      ...(inventaireAccessible()
        ? [
            { separateur: true as const, titre: TEXTES.navigation.menuBureau.stocks },
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
      { label: TEXTES.settings.listesChoix.titre, route: ROUTES.ORGANISATION_LISTES },
      { separateur: true },
      { label: TEXTES.settings.reglages.sectionTiers, route: ROUTES.ORGANISATION_TIERS },
      {
        label: TEXTES.settings.reglages.sectionCategoriesClient,
        route: ROUTES.ORGANISATION_CATEGORIES_CLIENT,
      },
      { label: TEXTES.settings.reglages.sectionCategoriesTiers, route: ROUTES.ORGANISATION_CATEGORIES_TIERS },
      // La structure des dossiers ne sert qu'au secrétariat (les dossiers de ses clients) : pas pour une exploitation agricole.
      ...(activitesEtablissement().includes(ACTIVITE_SOCIETE.PRESTATIONS_SERVICE)
        ? [{ label: TEXTES.dossiers.structure.titre, route: ROUTES.STRUCTURE_DOSSIERS }]
        : []),
      { separateur: true },
      { label: TEXTES.settings.reglages.sectionDonnees, route: ROUTES.ORGANISATION_DONNEES },
      { label: TEXTES.settings.reglages.export, route: ROUTES.EXPORT_DONNEES },
      { label: TEXTES.settings.reglages.pdf, route: ROUTES.PDF_DONNEES },
      { label: TEXTES.settings.reglages.sauvegardeLocale, route: ROUTES.SAUVEGARDE_LOCALE },
      { label: TEXTES.settings.reglages.googleDrive, route: ROUTES.GOOGLE_DRIVE },
      { separateur: true },
      { label: TEXTES.settings.reglages.sectionRegles, route: ROUTES.ORGANISATION_REGLES },
    ],
  };
  return { entreprise, accueil, clients, contacts, cheptel, production, commercial, comptabilite, organisation };
}

/** Les menus de la barre du haut : ce que les onglets du bas donnent sur le téléphone, avec leurs écrans en dessous. */
export function definitionDesMenus(): DefinitionMenu[] {
  const { entreprise, accueil, clients, contacts, cheptel, production, commercial, comptabilite, organisation } = menusParNom();
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
