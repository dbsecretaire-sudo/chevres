import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';

/**
 * Le style d'un poste de comptabilité, posé sur toute la page (web et Windows) tant que la disposition est affichée : des angles à peine arrondis (plus de capsules,
 * de bulles ni de cartes rondes), des champs rectangulaires à fine bordure, et des fenêtres (rappels, panneaux) étroites et centrées au lieu de couvrir tout l'écran.
 */
const STYLE_COMPTABLE = `
  *:not(svg):not(path) { border-radius: 3px !important; }
  /* Une seule police partout (les icônes gardent la leur). */
  *:not(svg):not(path):not([style*="icon" i]):not([style*="material" i]) { font-family: 'Segoe UI', system-ui, Arial, sans-serif !important; }
  input, textarea, select { border-radius: 2px !important; background-color: #fff !important; border: 1px solid #8a8a8a !important; }
  /* Une page entière ouverte en modale (les rappels…) : une fenêtre centrée, devant un fond assombri. */
  .modale-fenetre { background-color: rgba(0, 0, 0, 0.35) !important; align-items: center !important; justify-content: center !important; }
  .modale-fenetre > div { flex: none !important; width: min(760px, 94vw) !important; height: min(640px, 88vh) !important; border: 1px solid #777; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35); overflow: hidden; }
  /* Un panneau d'une modale transparente (historique d'un article…) : pas plus large qu'une fenêtre. */
  .carte-etroite { max-width: 720px !important; align-self: center !important; margin-left: auto !important; margin-right: auto !important; }
`;
const ID_STYLE_COMPTABLE = 'disposition-comptable';

/** Le gris-blanc des fonds de page : un fond qui ne l'est pas n'est pas un panneau. */
const estBlanc = (couleur: string) => couleur === 'rgb(255, 255, 255)';

/** Marque les modales : une page entière (fond opaque) devient une fenêtre ; dans une modale transparente, le premier grand panneau blanc est rétréci. */
function marquerLesModales(): void {
  document.querySelectorAll<HTMLElement>('[aria-modal="true"]').forEach((racine) => {
    if (racine.classList.contains('modale-fenetre')) return;
    if (estBlanc(getComputedStyle(racine).backgroundColor)) {
      racine.classList.add('modale-fenetre');
      return;
    }
    // Transparente : on cherche, de l'extérieur vers l'intérieur, les panneaux blancs plus larges qu'une fenêtre.
    const parcourir = (noeud: Element) => {
      for (const enfant of Array.from(noeud.children) as HTMLElement[]) {
        if (enfant.classList.contains('carte-etroite')) continue;
        const { width } = enfant.getBoundingClientRect();
        if (width > 740 && estBlanc(getComputedStyle(enfant).backgroundColor)) enfant.classList.add('carte-etroite');
        else parcourir(enfant);
      }
    };
    parcourir(racine);
  });
}

/** Pose le style du poste de comptabilité sur la page ; rien à l'écran. */
export function StyleComptable() {
  const comptable = useDispositionComptable();
  useEffect(() => {
    if (!comptable || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = ID_STYLE_COMPTABLE;
    style.textContent = STYLE_COMPTABLE;
    document.head.appendChild(style);
    let planifie = false;
    const observateur = new MutationObserver(() => {
      if (planifie) return;
      planifie = true;
      requestAnimationFrame(() => {
        planifie = false;
        marquerLesModales();
      });
    });
    observateur.observe(document.body, { childList: true, subtree: true });
    return () => {
      observateur.disconnect();
      style.remove();
    };
  }, [comptable]);
  return null;
}
