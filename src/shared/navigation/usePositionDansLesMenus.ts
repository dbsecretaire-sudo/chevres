import { useGlobalSearchParams, usePathname } from 'expo-router';
import { definitionDesMenus } from '@/bureau/MenuBureau';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { routesDuMenu } from '@/shared/navigation/filAriane';
import { routeLaPlusPrecise, type ParametresDePage } from '@/shared/navigation/pageOuverte';
import { menusDeLaFerme } from '@/shared/navigation/structureMenus';

/** Les menus de l'application tels que l'arbre de gauche les montre, et la page de menu qui est ouverte (une seule : la plus précise). */
export function usePositionDansLesMenus(): { menus: DefinitionMenu[]; courante: string | undefined; adresse: string } {
  const adresse = usePathname();
  const parametres = useGlobalSearchParams() as ParametresDePage;
  const { settings } = useAppSettings();
  const avecPlanDeLaFerme = !modeEntreprise() && !settings.exploitation?.accueilClassique;
  const menus = avecPlanDeLaFerme ? menusDeLaFerme() : definitionDesMenus();
  return { menus, courante: routeLaPlusPrecise(menus.flatMap(routesDuMenu), adresse, parametres), adresse };
}
