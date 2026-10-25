import { useGlobalSearchParams, usePathname } from 'expo-router';
import { definitionDesMenus } from '@/bureau/MenuBureau';
import type { MenuBureau as DefinitionMenu } from '@/bureau/pont';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { routesDuMenu } from '@/shared/navigation/filAriane';
import { routeLaPlusPrecise, type ParametresDePage } from '@/shared/navigation/pageOuverte';
import { menusDeLaFenetre, menusDuPoste } from '@/features/accueil/shell/structureMenus';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

/** Les menus de l'application tels que l'arbre de gauche et le fil d'Ariane les montrent (les quatre rubriques ; les huit thèmes au poste de comptabilité), et la page de menu qui est ouverte (une seule : la plus précise). */
export function usePositionDansLesMenus(): { menus: DefinitionMenu[]; courante: string | undefined; adresse: string } {
  const adresse = usePathname();
  const parametres = useGlobalSearchParams() as ParametresDePage;
  const { settings } = useAppSettings();
  const comptable = useDispositionComptable();
  const avecPlanDeLaFerme = !settings.exploitation?.accueilClassique;
  const menus = avecPlanDeLaFerme ? (comptable ? menusDuPoste() : menusDeLaFenetre()) : definitionDesMenus();
  return { menus, courante: routeLaPlusPrecise(menus.flatMap(routesDuMenu), adresse, parametres), adresse };
}
