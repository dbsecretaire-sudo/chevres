import { useGlobalSearchParams, usePathname } from 'expo-router';
import { definitionDesMenus } from '@/bureau/MenuBureau';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { routesDuMenu } from '@/shared/navigation/filAriane';
import { routeLaPlusPrecise, type ParametresDePage } from '@/shared/navigation/pageOuverte';
import { menusDeLaFerme, menusDuPoste } from '@/shared/navigation/structureMenus';

/**
 * Les menus de l'application tels que l'arbre de gauche les montre, et la page de menu qui est ouverte (une seule : la plus précise). `poste` : le poste de comptabilité (Windows, affichage
 * sobre), qui a ses huit thèmes ; le téléphone garde les menus de la ferme.
 */
export function usePositionDansLesMenus(poste = false): { menus: DefinitionMenu[]; courante: string | undefined; adresse: string } {
  const adresse = usePathname();
  const parametres = useGlobalSearchParams() as ParametresDePage;
  const { settings } = useAppSettings();
  const avecPlanDeLaFerme = !modeEntreprise() && !settings.exploitation?.accueilClassique;
  const menus = avecPlanDeLaFerme ? (poste ? menusDuPoste() : menusDeLaFerme()) : definitionDesMenus();
  return { menus, courante: routeLaPlusPrecise(menus.flatMap(routesDuMenu), adresse, parametres), adresse };
}
