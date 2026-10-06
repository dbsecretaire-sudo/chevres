import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/ListeReordonnable.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Espace entre deux lignes (celui de `commonStyles.gap10`). */
const ECART_LIGNES = 10;

/** En dessous de ce déplacement (px), un geste sur la poignée est un simple appui, pas un glissement. */
const SEUIL_GLISSEMENT = 6;

interface PoigneeProps {
  onDebut: () => void;
  onDeplacement: (dy: number) => void;
  onFin: (dy: number) => void;
  children: ReactNode;
}

/** La poignée d'une ligne : on la garde appuyée et on la fait glisser ; elle garde le geste (la page ne défile pas). */
function Poignee({ onDebut, onDeplacement, onFin, children }: PoigneeProps) {
  const rappels = useRef({ onDebut, onDeplacement, onFin });
  useEffect(() => {
    rappels.current = { onDebut, onDeplacement, onFin };
  });

  // Les gestes lisent les rappels au moment où ils arrivent (jamais pendant l'affichage) : toujours les derniers.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => rappels.current.onDebut(),
      onPanResponderMove: (_, geste) => rappels.current.onDeplacement(geste.dy),
      onPanResponderRelease: (_, geste) => rappels.current.onFin(geste.dy),
      onPanResponderTerminate: () => rappels.current.onFin(0),
    }),
  );

  return (
    <View {...pan.panHandlers} style={styles.poignee}>
      {children}
    </View>
  );
}

interface Props<T> {
  elements: T[];
  /** L'identifiant stable d'un élément. */
  cle: (element: T) => string;
  /** La ligne d'un élément ; `poignee` est à placer où l'on veut sur la ligne (au bout, par exemple). */
  ligne: (element: T, poignee: ReactNode) => ReactNode;
  /** Appelé quand une ligne a été lâchée à une autre place (index de destination dans la liste). */
  onDeplacer: (cle: string, nouvelIndex: number) => void;
  /** Dit si un glissement est en cours : la page qui contient la liste doit alors cesser de défiler. */
  onGlisse?: (actif: boolean) => void;
  /** Appelé quand on touche la poignée sans glisser. */
  onAppuiPoignee?: (cle: string) => void;
}

/**
 * Une liste dont on change l'ordre au doigt : on appuie sur la poignée d'une ligne, on la fait glisser jusqu'à sa place
 * (les autres lignes s'écartent), puis on la lâche. Un simple appui sur la poignée est signalé à part.
 */
export function ListeReordonnable<T>({
  elements,
  cle,
  ligne,
  onDeplacer,
  onGlisse,
  onAppuiPoignee,
}: Props<T>) {
  const [hauteurs, setHauteurs] = useState<Record<string, number>>({});
  const [actif, setActif] = useState<{ cle: string; dy: number } | null>(null);

  const cles = elements.map(cle);

  /** L'index où la ligne tombera si on la lâche après avoir glissé de `dy` pixels. */
  const indexCible = (depart: number, dy: number): number => {
    let index = depart;
    let reste = dy;
    if (dy > 0) {
      while (index < cles.length - 1 && reste > ((hauteurs[cles[index + 1]] ?? 0) + ECART_LIGNES) / 2) {
        reste -= (hauteurs[cles[index + 1]] ?? 0) + ECART_LIGNES;
        index += 1;
      }
    } else {
      while (index > 0 && -reste > ((hauteurs[cles[index - 1]] ?? 0) + ECART_LIGNES) / 2) {
        reste += (hauteurs[cles[index - 1]] ?? 0) + ECART_LIGNES;
        index -= 1;
      }
    }
    return index;
  };

  const terminer = (c: string, dy: number) => {
    const depart = cles.indexOf(c);
    setActif(null);
    onGlisse?.(false);
    if (Math.abs(dy) < SEUIL_GLISSEMENT) {
      onAppuiPoignee?.(c);
      return;
    }
    const cible = indexCible(depart, dy);
    if (cible !== depart) onDeplacer(c, cible);
  };

  const indexActif = actif ? cles.indexOf(actif.cle) : -1;
  const cibleActive = actif ? indexCible(indexActif, actif.dy) : -1;
  const hauteurActive = actif ? (hauteurs[actif.cle] ?? 0) + ECART_LIGNES : 0;

  return (
    <View style={commonStyles.gap10}>
      {elements.map((element, i) => {
        const c = cles[i];
        const enDeplacement = actif?.cle === c;
        let decalage = 0;
        if (actif) {
          if (enDeplacement) decalage = actif.dy;
          else if (indexActif < cibleActive && i > indexActif && i <= cibleActive) decalage = -hauteurActive;
          else if (indexActif > cibleActive && i < indexActif && i >= cibleActive) decalage = hauteurActive;
        }
        return (
          <View
            key={c}
            onLayout={(e) => {
              const hauteur = e.nativeEvent.layout.height;
              setHauteurs((actuelles) =>
                actuelles[c] === hauteur ? actuelles : { ...actuelles, [c]: hauteur },
              );
            }}
            style={[{ transform: [{ translateY: decalage }] }, enDeplacement && styles.enDeplacement]}
          >
            {ligne(
              element,
              <Poignee
                onDebut={() => {
                  setActif({ cle: c, dy: 0 });
                  onGlisse?.(true);
                }}
                onDeplacement={(dy) => setActif({ cle: c, dy })}
                onFin={(dy) => terminer(c, dy)}
              >
                <Ionicons name="swap-vertical" size={22} color={colors.textMuted} />
              </Poignee>,
            )}
          </View>
        );
      })}
    </View>
  );
}
