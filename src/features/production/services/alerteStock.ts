import { Alert } from 'react-native';
import { ingredientsEnManque } from '@/features/production/services/ingredientsPlat';
import type { ArchiveStock } from '@/features/stock/types';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.stockInsuffisant;
const nombre = (n: number) => String(n).replace('.', ',');

/**
 * Prévient quand le stock ne couvre pas les ingrédients d'une fabrication (huile, soude, présure, sel…) : une alerte liste ce qui manque et laisse fabriquer quand
 * même (le stock passe alors en négatif, à régulariser). Vrai quand l'alerte est montrée : la fabrication attend alors la réponse.
 */
export function alerterSiStockInsuffisant(
  archive: ArchiveStock,
  utilises: { article: string; quantite: number }[],
  continuer: () => void,
): boolean {
  const manques = ingredientsEnManque(archive, utilises);
  if (manques.length === 0) return false;
  Alert.alert(T.titre, T.message(manques.map((m) => T.ligne(m.libelle, nombre(m.enStock), nombre(m.demande))).join('\n')), [
    { text: TEXTES.commun.general.annuler, style: 'cancel' },
    { text: T.continuer, onPress: continuer },
  ]);
  return true;
}
