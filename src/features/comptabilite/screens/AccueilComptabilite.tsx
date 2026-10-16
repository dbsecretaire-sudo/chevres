import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/shared/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { ROUTES } from '@/shared/constants/routes';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { useAccueilEnDeuxColonnes, useLigneActive } from '@/bureau/colonnes';
import { inventaireAccessible } from '@/features/settings/utils/rubriques';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.accueil;
const G = T.groupes;

/**
 * L'onglet Comptabilité, en groupes titrés : les écritures (les ventes et les factures) avec l'inventaire ; le pilotage
 * (trésorerie, rentabilité, TVA) ; les déclarations avec les comptes du plan comptable ; enfin la technique (réglages). Depuis ces écrans, la flèche de retour
 * ramène ici.
 */
export default function AccueilComptabilite() {
  const router = useRouter();
  const estActive = useLigneActive();
  // Deux colonnes : le menu est déjà à gauche, la colonne de droite montre les écritures.
  const redirection = useAccueilEnDeuxColonnes(ROUTES.COMPTABILITE_LISTE);
  if (redirection) return redirection;
  type Rubrique = {
    cle: string;
    titre: string;
    aide?: string;
    icone: keyof typeof Ionicons.glyphMap;
    route: string;
  };
  /** Les écritures, avec l'inventaire (qui existe pour un élevage et pour un gîte, pas pour un secrétariat ni une activité financière). */
  const ecritures: Rubrique[] = [
    { cle: 'ecritures', titre: T.ecritures, icone: 'list', route: ROUTES.COMPTABILITE_LISTE },
    { cle: 'contacts', titre: TEXTES.contacts.titre, aide: TEXTES.contacts.aideRubrique, icone: 'people', route: ROUTES.CONTACTS },
    ...(inventaireAccessible()
      ? [
          {
            cle: 'inventaire',
            titre: T.inventaire.titre,
            aide: T.inventaire.aide,
            icone: 'clipboard' as const,
            route: ROUTES.COMPTABILITE_INVENTAIRE,
          },
        ]
      : []),
  ];
  const pilotage: Rubrique[] = [
    {
      cle: 'tresorerie',
      titre: T.tresorerie.titre,
      aide: T.tresorerie.aide,
      icone: 'wallet',
      route: ROUTES.COMPTABILITE_TRESORERIE,
    },
    {
      cle: 'rentabilite',
      titre: T.rentabilite.titre,
      aide: modeEntreprise() ? T.rentabilite.aideEntreprise : T.rentabilite.aide,
      icone: 'trending-up',
      route: ROUTES.RENTABILITE,
    },
    { cle: 'tva', titre: T.tva.titre, aide: T.tva.aide, icone: 'pricetag', route: ROUTES.TVA },
  ];
  /** Les déclarations, avec les comptes du plan comptable (toujours à portée). */
  const declarations: Rubrique[] = [
    {
      cle: 'declarations',
      titre: TEXTES.comptabilite.fiscalite.titre,
      aide: T.declarationsAide,
      icone: 'receipt',
      route: ROUTES.FISCALITE,
    },
    {
      cle: 'comptes',
      titre: TEXTES.settings.reglages.comptesPcg,
      aide: TEXTES.settings.reglages.aideComptesPcg,
      icone: 'list',
      route: ROUTES.COMPTES_PCG,
    },
  ];
  const technique: Rubrique[] = [
    {
      cle: 'reglages',
      titre: T.reglages.titre,
      aide: T.reglages.aide,
      icone: 'settings',
      route: ROUTES.COMPTABILITE_REGLAGES,
    },
  ];
  const groupes = [
    { titre: G.ecritures, lignes: ecritures },
    { titre: G.pilotage, lignes: pilotage },
    { titre: G.declarations, lignes: declarations },
    { titre: G.technique, lignes: technique },
  ];
  return (
    <Screen>
      <SelecteurEspece />
      {groupes.map((groupe) => (
        <GroupeAccueil key={groupe.titre} titre={groupe.titre}>
          <BlocLignes>
            {groupe.lignes.map((l) => (
              <ListRow
                key={l.cle}
                title={l.titre}
                subtitle={l.aide}
                icone={l.icone}
                actif={estActive(l.route)}
                onPress={() => router.push(l.route as never)}
              />
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ))}
    </Screen>
  );
}
