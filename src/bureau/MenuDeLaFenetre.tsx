import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { changerAffichage } from '@/bureau/changerAffichage';
import { useVisiteGuidee } from '@/features/didacticiel/context/VisiteGuidee';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { menusDeLApplication } from '@/shared/navigation/structureMenus';
import { afficheBureau, modeAffichage, modeDeLaCommande } from '@/shared/utils/affichage';
import { estBureau } from '@/shared/utils/plateforme';

/**
 * Dans la version Windows (affichage « bureau »), la barre d'onglets du bas laisse la place aux menus de la fenêtre, en haut à gauche (comme dans les
 * programmes de bureau) : les mêmes que le menu en arbre et que le menu « Menus » du mobile — l'Accueil, l'Exploitation, l'Atelier, l'Agritourisme, la Comptabilité,
 * les Contacts et l'Organisation. Ce composant les donne à la fenêtre et suit les choix qu'on y fait ; il ne montre rien.
 */
export function MenuDeLaFenetre() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const accueilClassique = !!settings.exploitation?.accueilClassique;
  // Les menus changent avec l'établissement (une entreprise n'a ni cheptel ni production) : on les redonne quand il change.
  const etablissement = useEtablissement();
  // Un choix de menu valide l'étape de la visite guidée qui demandait de l'ouvrir (même quand il mène à la page où l'on est déjà).
  const { menuChoisi } = useVisiteGuidee();
  useEffect(() => {
    if (!estBureau() || !window.bureau) return;
    // Les affichages mobile et sobre n'ont pas les menus de la fenêtre : ils sont dans le menu « Menus » ou dans l'arbre de gauche.
    window.bureau.menu.definir(afficheBureau() ? menusDeLApplication(accueilClassique) : [], modeAffichage);
    return window.bureau.menu.surChoix((route) => {
      const mode = modeDeLaCommande(route);
      if (mode) return void changerAffichage(mode);
      menuChoisi(route);
      router.push(route as never);
    });
  }, [router, etablissement, menuChoisi, accueilClassique]);
  return null;
}
