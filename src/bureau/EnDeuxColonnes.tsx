import { useEffect, type PropsWithChildren, type ReactElement } from 'react';
import { View } from 'react-native';
import { usePathname, useSegments } from 'expo-router';
import AccueilCheptel from '@/features/cheptel/screens/AccueilCheptel';
import AccueilComptabilite from '@/features/comptabilite/screens/AccueilComptabilite';
import CommercialAccueil from '@/features/commercial/screens/CommercialAccueil';
import ProductionAccueil from '@/features/production/screens/ProductionAccueil';
import Reglages from '@/features/settings/screens/Reglages';
import { DansColonneGauche, useDeuxColonnes } from '@/bureau/colonnes';
import { useRetourContexte } from '@/shared/navigation/contexteRetour';
import { ROUTES } from '@/shared/constants/routes';
import { estBureau } from '@/shared/utils/plateforme';
import { LARGEUR_MENU, styles } from '@/shared/styles/bureau/EnDeuxColonnes.styles';

/** Les écrans des tiers (clients, fournisseurs) : des écrans de la comptabilité, mais de l'Organisation. */
const PAGES_TIERS = [ROUTES.CLIENTS, ROUTES.FOURNISSEURS];

/** La variable CSS qui donne la largeur du menu de gauche : bureau/preload.js en fait le bord gauche des modales. */
const VARIABLE_LARGEUR_MENU = '--bureau-menu-gauche';

/** Les écrans (cachés de la barre) qui font partie de l'Organisation : son menu reste à gauche. */
const PAGES_ORGANISATION = [
  'reglages',
  'organisation-',
  'export-donnees',
  'pdf-donnees',
  'sauvegarde-locale',
  'google-drive',
  'structure-dossiers',
  'informations-exploitation',
];

/**
 * Le menu de la rubrique de la page ouverte (rien pour l'accueil et pour les clients d'une entreprise). La clé change à chaque écran
 * ouvert : le menu se recharge, ses alertes (stocks négatifs…) restent à jour.
 */
function menuDeLaRubrique(page: string, adresse: string, depuisOrganisation: boolean): ReactElement | null {
  // Les contacts ont leur entrée dans la barre du haut : pas de menu à gauche, sauf ouverts depuis l'Organisation.
  if (page === 'comptabilite' && adresse.startsWith(ROUTES.CONTACTS)) {
    return depuisOrganisation ? <Reglages key={adresse} /> : null;
  }
  if (page === 'cheptel' || page === 'sante') return <AccueilCheptel key={adresse} />;
  if (page === 'production') return <ProductionAccueil key={adresse} />;
  if (page === 'commercial') return <CommercialAccueil key={adresse} />;
  // Les clients, les fournisseurs et (ouverts depuis l'Organisation) les comptes du plan comptable sont des écrans de la comptabilité
  // qui font partie de l'Organisation : c'est le menu de l'Organisation qui reste à gauche.
  if (
    page === 'comptabilite' &&
    (PAGES_TIERS.some((t) => adresse.startsWith(t)) ||
      (depuisOrganisation && adresse.startsWith(ROUTES.COMPTES_PCG)))
  ) {
    return <Reglages key={adresse} />;
  }
  if (page === 'comptabilite') return <AccueilComptabilite key={adresse} />;
  if (PAGES_ORGANISATION.some((p) => page.startsWith(p))) return <Reglages key={adresse} />;
  return null;
}

/**
 * Dans la version Windows, une fenêtre assez large montre deux colonnes : à gauche le menu de la rubrique ouverte (la ligne de l'écran
 * ouvert est en couleur), à droite l'écran lui-même. Une fenêtre étroite garde l'affichage du téléphone.
 */
export function EnDeuxColonnes({ children }: PropsWithChildren) {
  // Sur le téléphone (et dans un navigateur ordinaire), rien ne change : les écrans s'affichent seuls.
  return estBureau() ? <EnDeuxColonnesBureau>{children}</EnDeuxColonnesBureau> : <>{children}</>;
}

function EnDeuxColonnesBureau({ children }: PropsWithChildren) {
  const deuxColonnes = useDeuxColonnes();
  const page = (useSegments() as string[])[1] ?? '';
  const adresse = usePathname();
  const depuisOrganisation = useRetourContexte() !== null;
  const menu = menuDeLaRubrique(page, adresse, depuisOrganisation);
  const avecMenu = deuxColonnes && !!menu;
  // Les fenêtres (modales) ne couvrent que la zone de droite : elles laissent le menu de gauche libre (voir bureau/preload.js).
  useEffect(() => {
    document.documentElement.style.setProperty(VARIABLE_LARGEUR_MENU, avecMenu ? `${LARGEUR_MENU}px` : '0px');
    return () => {
      document.documentElement.style.removeProperty(VARIABLE_LARGEUR_MENU);
    };
  }, [avecMenu]);
  // Toujours la même structure (le menu de gauche s'ajoute devant, rien ne change autour de l'écran) : en changeant de forme en entrant dans une
  // rubrique, React recréerait la navigation entière, qui oublierait l'écran demandé (un rappel de l'accueil) pour ne garder que la rubrique.
  return (
    <View style={styles.deuxColonnes}>
      {avecMenu ? (
        <View style={styles.gauche}>
          <DansColonneGauche.Provider value>{menu}</DansColonneGauche.Provider>
        </View>
      ) : null}
      <View style={styles.droite}>{children}</View>
    </View>
  );
}
